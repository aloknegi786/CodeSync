// update the imports to match the new file structure

import { roomUsers, roomDetails } from './../../../models/RoomStore.js';
import { ACTIONS } from '../../../utils/Actions.js';
import { CODE_SNIPPETS } from '../../../utils/languageInfo.js';
import { sendUserList } from '../utils/sendUserList.js';
import { creatingRooms } from '../state/timers.js';
import pool from '../../../utils/db.js';
import redisClient from '../../../utils/redis.js';
import * as Y from 'yjs';
// import { Awareness } from 'y-protocols/awareness';

export function registerJoinHandler(io, socket) {
  socket.on(ACTIONS.JOIN, async ({ roomId, username, email, description }) => {
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.username = username;
    socket.data.email = email;

    if (!roomDetails.has(roomId) && !creatingRooms.has(roomId)) {
      creatingRooms.add(roomId);
      try {
        await initializeRoom(roomId, email, username, description);
      } finally {
        creatingRooms.delete(roomId);
      }
    } else if (creatingRooms.has(roomId)) {
      try {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            clearInterval(interval);
            reject(new Error(`Room ${roomId} init timed out`));
          }, 5000);

          const interval = setInterval(() => {
            if (!creatingRooms.has(roomId)) {
              clearInterval(interval);
              clearTimeout(timeout);
              resolve();
            }
          }, 50);
        });
      } catch (err) {
        console.error(err.message);
        socket.emit("action_error", { message: "Failed to join room. Please retry." });
        return; 
      }
    }

    if (!roomDetails.has(roomId)) {
      console.error(`Room ${roomId} failed to initialize.`);
      socket.emit("action_error", { message: "Room could not be loaded. Please retry." });
      return;
    }

    const room = roomUsers.get(roomId);
    if (!room) return;

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
      sendUserList(io, socket, roomId, username, email, existingUser.role, "reconnected");   
      return;
    }

    //  #5: Check DB for saved role before defaulting to viewer
    let assignedRole = "viewer";
    try {
      const savedUser = await pool.query(
        'SELECT role FROM room_users WHERE room_id = $1 AND email = $2',
        [roomId, email]
      );
      if (savedUser.rows.length > 0) {
        assignedRole = savedUser.rows[0].role;
      }
    } catch (err) {
      console.error("Error fetching saved role:", err);
    }

    socket.data.role = assignedRole;
    room.set(email, {
      username,
      socketId: socket.id,
      role: assignedRole,
      connected: true
    });

    // Save new user to DB
    try {
      await pool.query(
        `INSERT INTO room_users (room_id, username, email, role) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (room_id, email) DO UPDATE SET role = EXCLUDED.role`,
        [roomId, username, email, assignedRole]
      );
    } catch (err) {
      console.error("Error saving new user:", err);
    }

    sendUserList(io, socket, roomId, username, email, assignedRole, "joined");
  });
}

async function initializeRoom(roomId, email, username, description) {
  roomUsers.set(roomId, new Map());
  const room = roomUsers.get(roomId);

  let loadedLanguage = "java";
  const ydoc = new Y.Doc();

  let actualHostEmail = null;
  try {
    const hostRes = await pool.query(
      `SELECT host_email FROM rooms WHERE room_id = $1`,
      [roomId]
    );
    if (hostRes.rows.length > 0) {
      actualHostEmail = hostRes.rows[0].host_email;
    }
  } catch (err) {
    console.error("Error fetching room host:", err);
  }

  const isNewRoom = actualHostEmail === null;
  const resolvedHost = isNewRoom ? email : actualHostEmail;

  try {
    const cachedState = await redisClient.get(`room_state:${roomId}`);
    if (cachedState) {
      Y.applyUpdate(ydoc, new Uint8Array(Buffer.from(cachedState, 'base64')));
      const langRes = await pool.query('SELECT language FROM rooms WHERE room_id = $1', [roomId]);
      if (langRes.rows.length > 0) loadedLanguage = langRes.rows[0].language;

    } else {
      const dbRoomRes = await pool.query('SELECT * FROM rooms WHERE room_id = $1', [roomId]);
      if (dbRoomRes.rows.length > 0 && dbRoomRes.rows[0].yjs_state) {
        const dbRoom = dbRoomRes.rows[0];
        Y.applyUpdate(ydoc, new Uint8Array(Buffer.from(dbRoom.yjs_state, 'base64')));
        loadedLanguage = dbRoom.language;
        await redisClient.setEx(`room_state:${roomId}`, 86400, dbRoom.yjs_state);
      } else {
        // Brand new room
        const ytext = ydoc.getText("monaco");
        ytext.insert(0, CODE_SNIPPETS["java"]);
        await pool.query(
          `INSERT INTO rooms (room_id, host_email, description, language, yjs_state, plain_text_code) 
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (room_id) DO NOTHING`,
          [roomId, email, description, "java",
           Buffer.from(Y.encodeStateAsUpdate(ydoc)).toString('base64'),
           CODE_SNIPPETS["java"]]
        );
      }
    }

    const dbUsersRes = await pool.query(
      'SELECT email, username, role FROM room_users WHERE room_id = $1', [roomId]
    );
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

  if (isNewRoom) {
    try {
      await pool.query(
        `INSERT INTO room_users (room_id, username, email, role) 
         VALUES ($1, $2, $3, 'host') 
         ON CONFLICT (room_id, email) DO UPDATE SET role = 'host'`,
        [roomId, username, email]
      );
      room.set(email, { username, socketId: null, role: 'host', connected: false });
    } catch (err) {
      console.error("Error saving host to DB:", err);
    }
  }


  roomDetails.set(roomId, {
    host: resolvedHost,
    hostSocketId: null,
    language: loadedLanguage,
    ydoc,
    input: "",
    output: "",
    isError: false,
    isExecuting: false
  });
}