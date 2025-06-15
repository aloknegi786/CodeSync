import { roomUsers, roomDetails } from '../models/RoomStore.js';
import { ACTIONS } from '../utils/Actions.js';
import {LANGUAGE_VERSIONS, CODE_SNIPPETS} from '../utils/languageInfo.js';

import { fetchRoomStatus } from './roomStatusController.js';

export function registerSocketHandlers(io, socket) {
  console.log('socket connected ', socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.username = username;
    socket.data.role = "viewer";

    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Map());
      socket.data.role = "host";

      roomDetails.set(roomId, {
        host: socket.id,
        language: "java",
        code: CODE_SNIPPETS["java"],
        input: "",
        output: ""
      });
    }

    roomUsers.get(roomId).set(socket.id, {
      username,
      role: socket.data.role
    });

    sendUserList(roomId, username);
  });

  socket.on(ACTIONS.REQUEST_PROMOTION, ({ roomId, username }) => {
    const room = roomUsers.get(roomId);
    if (!room) return;

    socket.data.role = "pending";

    for (const [socketId, data] of room.entries()) {
      if (data.username === username) {
        data.role = "pending";
        break;
      }
    }

    sendUserList(roomId, username);
  });

  socket.on("language_change", ({ language, roomId }) => {
      if (socket.data.role !== "host") return;

      console.log(language);
      roomDetails.set(roomId, {
          host: socket.id,
          language,
          code: CODE_SNIPPETS[language],
          input: "",
          output: ""
      });

      const roomDetail = roomDetails.get(roomId);
      io.to(roomId).emit(ACTIONS.CODE_CHANGE, {
        code : roomDetail.code,
      });
      io.to(roomId).emit("language_updated", {
        language,
      });
      console.log("Language: ",language);
  });


  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    const room = roomUsers.get(roomId);
    if (!room) return;
    const user = room.get(socket.id);
    if (!user) return;

    socket.data.role = user.role;

    if (socket.data.role === 'viewer' || socket.data.role === 'pending') {
      io.to(roomId).emit("action_error", {
        message: "Un-Authorized Action"
      });
      return;
    }

    const roomDetail = roomDetails.get(roomId);
    roomDetail.code = code;
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on(ACTIONS.PROMOTE, ({ roomId, socketId }) => {
    const room = roomUsers.get(roomId);
    if (!room || socket.data.role !== "host") {
      io.to(socket.id).emit("action_error", {
        message: "Invalid action"
      });
      return;
    }

    const user = room.get(socketId);
    if (!user) {
      io.to(socket.id).emit("action_error", {
        message: "No such user"
      });
      return;
    }

    user.role = "editor";
    room.set(socketId, user);

    io.to(socketId).emit('notification', {
      message: "You have been promoted as editor."
    });

    sendUserList(roomId, socket.data.username);
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, roomId }) => {
    const roomDetail = roomDetails.get(roomId);
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, {code: roomDetail.code});
  });

  socket.on("disconnect", () => {
    const { roomId, role } = socket.data || {};

    if (roomUsers.has(roomId)) {
      const wasHost = role === "host";

      roomUsers.get(roomId).delete(socket.id);

      if (roomUsers.get(roomId).size === 0 || wasHost) {
        io.to(roomId).emit("close", {
          message: "Host left! Room will be closed in 2s",
        });

        setTimeout(() => {
          roomUsers.delete(roomId);
          roomDetails.delete(roomId);
        }, 2000);
      } else {
        sendUserList(roomId);
      }
    }
  });

  function sendUserList(roomId, username = "") {
    const clients = [];
    if (roomUsers.has(roomId)) {
      for (const [socketId, data] of roomUsers.get(roomId).entries()) {
        clients.push({ socketId, ...data });
      }
      io.in(roomId).emit(ACTIONS.JOINED, {
        clients,
        username,
        Role: socket.data.role,
        socketId: socket.id,
      });
    }
  }
}
