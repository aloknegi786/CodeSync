import { roomUsers, roomDetails } from './../../../models/RoomStore.js';
import { ACTIONS } from '../../../utils/Actions.js';
import { redisSaveTimers, closingRooms } from '../state/timers.js';
import pool from '../../../utils/db.js';
import redisClient from '../../../utils/redis.js';
import * as Y from 'yjs';

export async function saveAndCloseRoom(io, roomId) {
  
  if (closingRooms.has(roomId)) return;
  closingRooms.add(roomId);

  if (redisSaveTimers.has(roomId)) {
    clearTimeout(redisSaveTimers.get(roomId));
    redisSaveTimers.delete(roomId);
  }

  io.to(roomId).emit(ACTIONS.CLOSE, { message: "Host left! Room will be closed in 2s" });

  const roomDetail = roomDetails.get(roomId);

  roomUsers.delete(roomId);
  roomDetails.delete(roomId);

  if (roomDetail) {
    const stateVector = Y.encodeStateAsUpdate(roomDetail.ydoc);
    const base64State = Buffer.from(stateVector).toString('base64');
    const plainText = roomDetail.ydoc.getText('monaco').toString();

    try {
      await Promise.all([
        pool.query(
          `UPDATE rooms 
           SET language = $1, yjs_state = $2, plain_text_code = $3, updated_at = CURRENT_TIMESTAMP 
           WHERE room_id = $4`,
          [roomDetail.language, base64State, plainText, roomId]
        ),
        redisClient.setEx(`room_state:${roomId}`, 86400, base64State)
      ]);
    } catch (err) {
      console.error("Final save error:", err);
      try {
        await redisClient.setEx(`room_state:${roomId}`, 604800, base64State);
        console.warn(`Room ${roomId} DB save failed — state preserved in Redis for 7 days`);
      } catch (redisErr) {
        console.error(`Room ${roomId} total save failure — data may be lost:`, redisErr);
      }
    }
  }

  setTimeout(() => {
    roomDetail?.ydoc.destroy();
    closingRooms.delete(roomId); 
  }, 2000);
}