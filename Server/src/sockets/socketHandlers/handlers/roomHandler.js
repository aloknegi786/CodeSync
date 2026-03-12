import { roomDetails, roomUsers } from './../../../models/RoomStore.js';
import { ACTIONS } from '../../../utils/Actions.js';
import { CODE_SNIPPETS } from '../../../utils/languageInfo.js';
import pool from '../../../utils/db.js';
import redisClient from '../../../utils/redis.js';
import * as Y from 'yjs';

export function registerRoomHandler(io, socket) {

  socket.on(ACTIONS.LANGUAGE_CHANGE, async ({ language, roomId }) => {
    
    const room = roomUsers.get(roomId);
    const liveRole = room?.get(socket.data.email)?.role;
    if (liveRole !== "host") return;

    const roomDetail = roomDetails.get(roomId);
    if (!roomDetail) return;

   
    const snippet = CODE_SNIPPETS[language];
    if (!snippet) {
      io.to(socket.id).emit("action_error", { message: `Unsupported language: ${language}` });
      return;
    }

    roomDetail.language = language;

    const ytext = roomDetail.ydoc.getText('monaco');

    roomDetail.ydoc.transact(() => {
      ytext.delete(0, ytext.length);
      ytext.insert(0, snippet);
    });

    io.to(roomId).emit("language_updated", { language });

    const update = Y.encodeStateAsUpdate(roomDetail.ydoc);
    io.to(roomId).emit('yjs_update', update);

    try {
      const stateVector = Y.encodeStateAsUpdate(roomDetail.ydoc);
      const base64State = Buffer.from(stateVector).toString('base64');
      const plainText = snippet;

      await Promise.all([
        redisClient.setEx(`room_state:${roomId}`, 86400, base64State),
        pool.query(
          `UPDATE rooms 
          SET language = $1, yjs_state = $2, plain_text_code = $3, updated_at = CURRENT_TIMESTAMP 
          WHERE room_id = $4`,
          [language, base64State, plainText, roomId]
        )
      ]);
    } catch (err) {
      console.error("Error persisting language change:", err);
    }
  });

  socket.on(ACTIONS.SYNC_CODE, ({ roomId }) => {
    
    if (socket.data.roomId !== roomId) return;

    const roomDetail = roomDetails.get(roomId);
    if (!roomDetail) return;

    const stateVector = Y.encodeStateAsUpdate(roomDetail.ydoc);
    socket.emit('yjs_initial_state', stateVector);
    socket.emit(ACTIONS.OUTPUT_CHANGE, {
      output: roomDetail.output || [], // ✅ FIX #7: consistent array type
      isError: roomDetail.isError
    });
    socket.emit(ACTIONS.INPUT_CHANGE, { newInput: roomDetail.input || "" });
  });
}