
import { roomUsers, roomDetails } from './../../../models/RoomStore.js';
import { ACTIONS } from '../../../utils/Actions.js';
import { sendUserList } from '../utils/sendUserList.js';
import { saveAndCloseRoom } from '../utils/saveAndCloseRoom.js';

export function registerDisconnectHandler(io, socket) {

  socket.on(ACTIONS.LEAVE, ({ roomId, email }) => {
    if (!roomUsers.has(roomId)) return;

    const room = roomUsers.get(roomId);
    const user = room.get(email);
    if (!user) return;

    const wasHost = user.role === "host";
    room.delete(email);

    if (wasHost) {
      saveAndCloseRoom(io, roomId);
      return;
    }

    sendUserList(io, socket, roomId, socket.data.username, email, user.role, "left");
  });

  // ✅ BUG FIX #3: Must be lowercase "disconnect" — verify ACTIONS.DISCONNECT matches
  socket.on("disconnect", () => {
    const { roomId, email } = socket.data || {};
    if (!roomId || !roomUsers.has(roomId)) return;

    const room = roomUsers.get(roomId);
    const user = room.get(email);
    if (!user) return;

    if (user.socketId !== socket.id) return; // stale socket, ignore

    if (user.role === "viewer") {
      room.delete(email);
      if (room.size === 0) {
        saveAndCloseRoom(io, roomId);
      } else {
        sendUserList(io, socket, roomId, socket.data.username, email, user.role, "left");
      }
    } else {
      // host/editor go offline but stay in room
      user.connected = false;
      user.socketId = null;
      sendUserList(io, socket, roomId, socket.data.username, email, user.role, "offline");
    }
  });
}