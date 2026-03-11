import { roomUsers, roomDetails } from "../models/RoomStore.js";
import * as Y from "yjs";
import { saveToRedis } from "./persistence.js";

export function registerCollaboration(io, socket) {

    socket.on("yjs_update", ({ roomId, update }) => {

    const room = roomUsers.get(roomId);
    if (!room) return;

    const user = room.get(socket.data.email);
    if (!user) return;

    if (user.role === "viewer" || user.role === "pending") {
        io.to(socket.id).emit("action_error", {
        message: "Unauthorized"
        });
        return;
    }

    const roomDetail = roomDetails.get(roomId);
    if (!roomDetail) return;

    Y.applyUpdate(roomDetail.ydoc, new Uint8Array(update));

    socket.in(roomId).emit("yjs_update", update);

    saveToRedis(roomId, roomDetail);

    });

}