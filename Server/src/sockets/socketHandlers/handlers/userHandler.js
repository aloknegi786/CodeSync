import { roomUsers } from './../../../models/RoomStore.js';
import { ACTIONS } from '../../../utils/Actions.js';
import { sendUserList } from '../utils/sendUserList.js';
import pool from '../../../utils/db.js';

export function registerUserHandler(io, socket) {

  socket.on(ACTIONS.REQUEST_PROMOTION, async ({ roomId }) => {

    const { email, username } = socket.data;

    const room = roomUsers.get(roomId);
    if (!room) return;

    const user = room.get(email);
    if (!user) return;

    if (user.role === "host" || user.role === "editor" || user.role === "pending") return;

    try {
      await pool.query(
        `UPDATE room_users SET role = 'pending' WHERE room_id = $1 AND email = $2`,
        [roomId, email]
      );
      user.role = "pending";
      socket.data.role = "pending";
      room.set(email, user);
    } catch (err) {
      console.error("Error saving pending role:", err);
      return;
    }

    sendUserList(io, socket, roomId, username, email, "pending", "requested promotion");
  });

  socket.on(ACTIONS.PROMOTE, async ({ roomId, email }) => {
  
    const room = roomUsers.get(roomId);
    if (!room) return;
    
    const liveRole = room?.get(socket.data.email)?.role;
    if (liveRole !== "host") {
      return io.to(socket.id).emit("action_error", { message: "Invalid action" });
    }


    const user = room.get(email);
    if (!user) {
      return io.to(socket.id).emit("action_error", { message: "No such user" });
    }

    if (user.role !== "pending") {
      return io.to(socket.id).emit("action_error", { 
        message: "User has not requested promotion." 
      });
    }

    try {
      await pool.query(
        `UPDATE room_users SET role = $1 WHERE room_id = $2 AND email = $3`,
        ['editor', roomId, email]
      );
      user.role = "editor";
      room.set(email, user);
    } catch (err) {
      console.error("Error saving promotion:", err);
      return io.to(socket.id).emit("action_error", { message: "Promotion failed. Please try again." });
    }

    if (user.socketId) {
      io.to(user.socketId).emit('notification', { message: "You have been promoted as editor." });
    }

    sendUserList(io, socket, roomId, user.username, email, user.role, "promoted as editor");
  });
}