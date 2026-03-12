import { roomUsers, roomDetails } from './../../../models/RoomStore.js';
import { redisSaveTimers } from '../state/timers.js';
import redisClient from '../../../utils/redis.js';
import * as Y from 'yjs';

export function registerYjsHandler(io, socket) {

  socket.on('yjs_update', ({ roomId, update }) => {
    const room = roomUsers.get(roomId);
    if (!room) return;

    const user = room.get(socket.data.email);
    if (!user) return;

    
    socket.data.role = user.role;

    if (socket.data.role === 'viewer' || socket.data.role === 'pending') {
      io.to(socket.id).emit("action_error", { message: "Unauthorized Action" });
      return;
    }

    const roomDetail = roomDetails.get(roomId);
    if (!roomDetail) return;

    if (!update || !update.length) {
      console.warn(`Empty yjs_update from ${socket.data.email}`);
      return;
    }

    try {
      Y.applyUpdate(roomDetail.ydoc, new Uint8Array(update));
    } catch (err) {
      console.error("Failed to apply Yjs update:", err);
      return; 
    }

    socket.to(roomId).emit('yjs_update', update);

    if (redisSaveTimers.has(roomId)) {
      clearTimeout(redisSaveTimers.get(roomId));
      redisSaveTimers.delete(roomId);
    }

    const timer = setTimeout(async () => {
      const liveRoomDetail = roomDetails.get(roomId);
      if (!liveRoomDetail) return;
      try {
        const stateVector = Y.encodeStateAsUpdate(liveRoomDetail.ydoc);
        const base64State = Buffer.from(stateVector).toString('base64');
        await redisClient.setEx(`room_state:${roomId}`, 86400, base64State);
      } catch (err) {
        console.error("Redis save error:", err);
      }
    }, 2000);

    redisSaveTimers.set(roomId, timer);
  });

  socket.on('awareness_update', ({ roomId, update }) => {
    const room = roomUsers.get(roomId);
    if (!room) return;

    const liveRole = room.get(socket.data.email)?.role;
    if (liveRole === 'viewer' || liveRole === 'pending') return;

    socket.to(roomId).emit('awareness_update', { update });
  });
}