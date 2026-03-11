import pool from "../utils/db.js";
import redisClient from "../utils/redis.js";
import * as Y from "yjs";
import { CODE_SNIPPETS } from "../utils/languageInfo.js";

const redisSaveTimers = new Map();

export async function loadRoomState(roomId, email) {

    const ydoc = new Y.Doc();
    const ytext = ydoc.getText("monaco");

    let language = "java";

    const cachedState = await redisClient.get(`room_state:${roomId}`);

    if (cachedState) {

        Y.applyUpdate(
            ydoc,
            new Uint8Array(Buffer.from(cachedState, "base64"))
        );

    } else {

        const dbRoom = await pool.query(
            "SELECT * FROM rooms WHERE room_id=$1",
            [roomId]
        );

        if (dbRoom.rows.length) {

            const room = dbRoom.rows[0];

            Y.applyUpdate(
                ydoc,
                new Uint8Array(Buffer.from(room.yjs_state, "base64"))
            );

            language = room.language;

            await redisClient.set(`room_state:${roomId}`, room.yjs_state);

        } else {

            ytext.insert(0, CODE_SNIPPETS["java"]);

            await pool.query(
                `INSERT INTO rooms (room_id, host_email, language)
                VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
                [roomId, email, "java"]
            );

        }

    }

    return { ydoc, language };

}

export function saveToRedis(roomId, roomDetail) {

    if (redisSaveTimers.has(roomId)) {
        clearTimeout(redisSaveTimers.get(roomId));
        redisSaveTimers.delete(roomId);
    }

    const timer = setTimeout(async () => {

        const state = Y.encodeStateAsUpdate(roomDetail.ydoc);

        await redisClient.setEx(
            `room_state:${roomId}`,
            86400,
            Buffer.from(state).toString("base64")
        );

    },2000);

    redisSaveTimers.set(roomId,timer);

}

export async function saveAndCloseRoom(io, roomId){

    io.to(roomId).emit("close",{message:"Room closing"});

}