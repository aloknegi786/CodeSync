import { roomUsers } from './../../../models/RoomStore.js';
import { ACTIONS } from '../../../utils/Actions.js'

export function sendUserList(io, socket, roomId, username = "", email = "", role = "", action = "joined") {
  const clients = [];
  if (roomUsers.has(roomId)) {
    for (const [email, data] of roomUsers.get(roomId).entries()) {
      clients.push({ email, ...data });
    }
    io.in(roomId).emit(ACTIONS.JOINED, {
      clients, username, email, Role: role, socketId: socket.id, action
    });
  }
}