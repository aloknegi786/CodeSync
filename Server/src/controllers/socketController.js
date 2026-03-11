import { roomUsers, roomDetails } from '../models/RoomStore.js';
import { ACTIONS } from '../utils/Actions.js';
import { CODE_SNIPPETS } from '../utils/languageInfo.js';
import { runCode } from './executionController.js';
import * as Y from 'yjs';

import pool from '../utils/db.js'; 
import redisClient from '../utils/redis.js';

const redisSaveTimers = new Map();

const setRoomDetails = (roomId, details) => {
  const existingDetails = roomDetails.get(roomId) || {};
  roomDetails.set(roomId, { ...existingDetails, ...details });
};

export function registerSocketHandlers(io, socket) {
  console.log('socket connected ', socket.id);

  socket.on(ACTIONS.JOIN, async ({ roomId, username, email }) => {
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.username = username;
    socket.data.email = email;

    if (!roomDetails.has(roomId)) {
      roomUsers.set(roomId, new Map());
      const room = roomUsers.get(roomId);

      socket.data.role = "host";

      let loadedLanguage = "java";
      const ydoc = new Y.Doc();
      const ytext = ydoc.getText("monaco");


      try {
        const cachedState = await redisClient.get(`room_state:${roomId}`);
        if (cachedState) {
          Y.applyUpdate(ydoc, new Uint8Array(Buffer.from(cachedState, 'base64')));
        } else {
          // Fallback to Postgres (Cold Storage)
          const dbRoomRes = await pool.query('SELECT * FROM rooms WHERE room_id = $1', [roomId]);
          if (dbRoomRes.rows.length > 0 && dbRoomRes.rows[0].yjs_state) {
            const dbRoom = dbRoomRes.rows[0];
            Y.applyUpdate(ydoc, new Uint8Array(Buffer.from(dbRoom.yjs_state, 'base64')));
            loadedLanguage = dbRoom.language;
            
            await redisClient.set(`room_state:${roomId}`, dbRoom.yjs_state);
          } else {
            // Brand New Room
            ytext.insert(0, CODE_SNIPPETS["java"]);
            
            // --- DB: Create the room record immediately ---
            await pool.query(
              `INSERT INTO rooms (room_id, host_email, language, yjs_state, plain_text_code) 
               VALUES ($1, $2, $3, $4, $5) 
               ON CONFLICT (room_id) DO NOTHING`,
              [roomId, email, "java", Buffer.from(Y.encodeStateAsUpdate(ydoc), 'binary').toString('base64'), CODE_SNIPPETS["java"]]
            );
          }
        }

        // --- DB: LOAD PERMANENT ROLES INTO MEMORY ---
        const dbUsersRes = await pool.query('SELECT email, username, role FROM room_users WHERE room_id = $1', [roomId]);
        dbUsersRes.rows.forEach(dbUser => {
          room.set(dbUser.email, {
            username: dbUser.username,
            socketId: null,
            role: dbUser.role,
            connected: false
          });
        });
      } catch (err) {
        console.error("Error loading room data:", err);
      }

      roomDetails.set(roomId, {
        host: email,
        hostSocketId: socket.id,
        language: loadedLanguage,
        ydoc,
        input: "",
        output: "",
        isError: false,
        isExecuting: false
      });

    }

    const room = roomUsers.get(roomId);

    // ----- REJOIN LOGIC -----
    if (room.has(email)) {

      const existingUser = room.get(email);

      existingUser.socketId = socket.id;
      existingUser.connected = true;
      existingUser.username = username;

      if (roomDetails.get(roomId).host === email) {
        socket.data.role = "host";
        existingUser.role = "host";
      } else {
        socket.data.role = existingUser.role;
      }

      room.set(email, existingUser);

      sendUserList(roomId, username, email, existingUser.role, "reconnected");
      return;
    }

    // ----- NEW USER -----
    if (!socket.data.role) socket.data.role = "viewer";
    room.set(email, {
      username,
      socketId: socket.id,
      role: socket.data.role,
      connected: true
    });

    // --- DB: PERMANENTLY SAVE NEW USER ---
    try {
      await pool.query(
        `INSERT INTO room_users (room_id, username, email, role) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (room_id, email) DO UPDATE SET role = EXCLUDED.role`,
        [roomId, username, email, socket.data.role]
      );
    } catch (err) {
      console.error("Error saving new user:", err);
    }

    sendUserList(roomId, username, email, socket.data.role, "joined");

  });

  socket.on(ACTIONS.REQUEST_PROMOTION, ({ roomId, username, email:requestedEmail }) => {
    // ... (Your exact code, no changes needed) ...
    const room = roomUsers.get(roomId);
    if (!room) return;
    socket.data.role = "pending";
    for (const [email, data] of room.entries()) {
      if (email === requestedEmail && data.username === username) {
        data.role = "pending";
        break;
      }
    }
    sendUserList(roomId, username, requestedEmail, socket.data.role, "requested promotion");
  });

  socket.on(ACTIONS.LANGUAGE_CHANGE, ({ language, roomId }) => {
      if (socket.data.role !== "host") return;

      const roomDetail = roomDetails.get(roomId);
      if (!roomDetail) return;

      roomDetail.language = language;

      const ytext = roomDetail.ydoc.getText('monaco');
      ytext.delete(0, ytext.length); 
      ytext.insert(0, CODE_SNIPPETS[language]);

      const update = Y.encodeStateAsUpdate(roomDetail.ydoc);
      io.to(roomId).emit('yjs_update', update);

      io.to(roomId).emit("language_updated", { language });
  });

  socket.on(ACTIONS.EXECUTE, async ({roomId})=> {
      if (socket.data.role !== "host") return;
      const roomDetail = roomDetails.get(roomId);
      if (!roomDetail) return;
      if(roomDetail.isExecuting) {
        io.to(roomId).emit(ACTIONS.ERROR, { message: "Code is already executing. Please wait." });
        return;
      }
      roomDetail.isExecuting = true;
      const codeToExecute = roomDetail.ydoc.getText('monaco').toString();
      try {
        const output = await runCode(roomDetail.language, codeToExecute, roomDetail.input);
        roomDetail.output = output.trim().split("\n");
        roomDetail.isError = false;
      } catch (err) {
        roomDetail.output = [err.message];
        roomDetail.isError = true;
      }
      roomDetail.isExecuting = false;
      io.to(roomId).emit(ACTIONS.OUTPUT_CHANGE, {output: roomDetail.output, isError: roomDetail.isError});
  });

  socket.on(ACTIONS.INPUT_CHANGE, ({ input, roomId }) => {
    // ... (Your exact code, no changes needed) ...
    if (socket.data.role !== "host" && socket.data.role !== "editor") return;
    const roomDetail = roomDetails.get(roomId);
    if (!roomDetail) return;
    roomDetail.input = input;
    io.to(roomId).emit(ACTIONS.INPUT_CHANGE, {newInput: input});
  });

  socket.on('yjs_update', ({ roomId, update }) => {
    const room = roomUsers.get(roomId);
    if (!room) return;
    const user = room.get(socket.data.email);
    if (!user) return;

    socket.data.role = user.role;

    if (socket.data.role === 'viewer' || socket.data.role === 'pending') {
      io.to(socket.id).emit("action_error", { message: "Un-Authorized Action" });
      return;
    }

    const roomDetail = roomDetails.get(roomId);
    if(!roomDetail) return;

    Y.applyUpdate(roomDetail.ydoc, new Uint8Array(update));
    socket.in(roomId).emit('yjs_update', update);

    // --- DB / REDIS: DEBOUNCED FAST SAVES ---
    if (redisSaveTimers.has(roomId)) {
      clearTimeout(redisSaveTimers.get(roomId));
      redisSaveTimers.delete(roomId);
    }

    // Save to Redis 2 seconds after typing stops
    const timer = setTimeout(async () => {
      try {
        const stateVector = Y.encodeStateAsUpdate(roomDetail.ydoc);
        const base64State = Buffer.from(stateVector).toString('base64');
        await redisClient.setEx(`room_state:${roomId}`, 86400, base64State); // Expires in 24h
      } catch (err) {
        console.error("Redis save error:", err);
      }
    }, 2000);
    redisSaveTimers.set(roomId, timer);
  });

  socket.on(ACTIONS.PROMOTE, async ({ roomId, socketId, email }) => {
    const room = roomUsers.get(roomId);
    if (!room || socket.data.role !== "host") return io.to(socket.id).emit("action_error", { message: "Invalid action" });
    const user = room.get(email);
    if (!user) return io.to(socket.id).emit("action_error", { message: "No such user" });

    user.role = "editor";
    room.set(email, user);

    // --- DB: PERMANENTLY SAVE PROMOTION ---
    try {
      await pool.query(
        `UPDATE room_users SET role = $1 WHERE room_id = $2 AND email = $3`,
        ['editor', roomId, email]
      );
    } catch (err) {
      console.error("Error saving promotion:", err);
    }

    io.to(socketId).emit('notification', { message: "You have been promoted as editor." });
    sendUserList(roomId, user.username, email, user.role, "promoted as editor");
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, roomId }) => {
    const roomDetail = roomDetails.get(roomId);
    if(!roomDetail) return;
    const stateVector = Y.encodeStateAsUpdate(roomDetail.ydoc);
    io.to(socketId).emit('yjs_initial_state', stateVector);
    io.to(socketId).emit(ACTIONS.OUTPUT_CHANGE, {output: roomDetail.output || "", isError: roomDetail.isError});
    io.to(socketId).emit(ACTIONS.INPUT_CHANGE, {newInput: roomDetail.input || ""});
  });

  socket.on(ACTIONS.LEAVE, ({ roomId, email }) => {

    if (!roomUsers.has(roomId)) return;

    const room = roomUsers.get(roomId);
    const user = room.get(email);
    if (!user) return;

    const wasHost = user.role === "host";

    room.delete(email);

    if (wasHost) {
      saveAndCloseRoom(roomId);
      return;
    }

    sendUserList(
      roomId,
      socket.data.username,
      email,
      user.role,
      "left"
    );

  });

  socket.on(ACTIONS.DISCONNECT, () => {

    const { roomId, email } = socket.data || {};
    if (!roomUsers.has(roomId)) return;

    const room = roomUsers.get(roomId);
    const user = room.get(email);
    if (!user) return;

    // ignore stale socket disconnect
    if (user.socketId !== socket.id) return;

    if (user.role === "viewer") {

      room.delete(email);

      if (room.size === 0) {
        saveAndCloseRoom(roomId);
      } else {
        sendUserList(
          roomId,
          socket.data.username,
          email,
          user.role,
          "left"
        );
      }

    } else {

      // editor/host stay in room but go offline
      user.connected = false;
      user.socketId = null;

      sendUserList(
        roomId,
        socket.data.username,
        email,
        user.role,
        "offline"
      );

    }

  });

  function sendUserList(roomId, username = "", email = "", role = "", action = "joined") {
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

  async function saveAndCloseRoom(roomId) {
    io.to(roomId).emit(ACTIONS.CLOSE, { message: "Host left! Room will be closed in 2s" });
    
    const roomDetail = roomDetails.get(roomId);
    if (roomDetail) {
      try {
        const stateVector = Y.encodeStateAsUpdate(roomDetail.ydoc);
        const base64State = Buffer.from(stateVector).toString('base64');
        const plainText = roomDetail.ydoc.getText('monaco').toString();

        // Save everything securely to Postgres
        await pool.query(
          `UPDATE rooms 
           SET language = $1, yjs_state = $2, plain_text_code = $3, updated_at = CURRENT_TIMESTAMP 
           WHERE room_id = $4`,
          [roomDetail.language, base64State, plainText, roomId]
        );
        console.log(`Room ${roomId} backed up to PostgreSQL.`);
      } catch (err) {
        console.error("PostgreSQL final save error:", err);
      }
    }

    setTimeout(() => {
      roomDetail?.ydoc.destroy();
      roomUsers.delete(roomId);
      roomDetails.delete(roomId);
      if (redisSaveTimers.has(roomId)) {
        clearTimeout(redisSaveTimers.get(roomId));
        redisSaveTimers.delete(roomId);
      }
    }, 2000);
  }
}