import { roomUsers, roomDetails } from "../models/RoomStore.js";
import { ACTIONS } from "../utils/Actions.js";
import { saveAndCloseRoom, loadRoomState } from "./persistence.js";

export function registerRoomLifecycle(io, socket) {

    socket.on(ACTIONS.JOIN, async ({ roomId, username, email }) => {

        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.username = username;
        socket.data.email = email;

        if (!roomDetails.has(roomId)) {

            const { ydoc, language } = await loadRoomState(roomId, email);

            roomUsers.set(roomId, new Map());

            roomDetails.set(roomId, {
                host: email,
                hostSocketId: socket.id,
                language,
                ydoc,
                input: "",
                output: "",
                isError: false,
                isExecuting: false
            });

            socket.data.role = "host";
        }

        const room = roomUsers.get(roomId);

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

            sendUserList(io, roomId, username, email, existingUser.role, "reconnected");
            return;
        }

        if (!socket.data.role) socket.data.role = "viewer";

        room.set(email, {
            username,
            socketId: socket.id,
            role: socket.data.role,
            connected: true
        });

        sendUserList(io, roomId, username, email, socket.data.role, "joined");

    });

    socket.on(ACTIONS.REQUEST_PROMOTION, ({ roomId, username, email:requestedEmail }) => {

        const room = roomUsers.get(roomId);
        if (!room) return;

        socket.data.role = "pending";

        for (const [email, data] of room.entries()) {
            if (email === requestedEmail && data.username === username) {
            data.role = "pending";
            break;
            }
        }

        sendUserList(io, roomId, username, requestedEmail, socket.data.role, "requested promotion");

    });

    socket.on(ACTIONS.PROMOTE, ({ roomId, socketId, email }) => {

        const room = roomUsers.get(roomId);
        if (!room || socket.data.role !== "host") return;

        const user = room.get(email);
        if (!user) return;

        user.role = "editor";
        room.set(email, user);

        io.to(socketId).emit("notification", {
            message: "You have been promoted as editor."
        });

        sendUserList(io, roomId, user.username, email, user.role, "promoted");

    });

    socket.on(ACTIONS.LEAVE, ({ roomId, email }) => {

        const room = roomUsers.get(roomId);
        if (!room) return;

        const user = room.get(email);
        if (!user) return;

        const wasHost = user.role === "host";

        room.delete(email);

        if (wasHost) {
            saveAndCloseRoom(io, roomId);
            return;
        }

        sendUserList(io, roomId, socket.data.username, email, user.role, "left");

    });

    socket.on(ACTIONS.DISCONNECT, () => {

        const { roomId, email } = socket.data || {};
        if (!roomUsers.has(roomId)) return;

        const room = roomUsers.get(roomId);
        const user = room.get(email);
        if (!user) return;

        if (user.socketId !== socket.id) return;

        if (user.role === "viewer") {

            room.delete(email);

            if (room.size === 0) {
            saveAndCloseRoom(io, roomId);
            } else {
            sendUserList(io, roomId, socket.data.username, email, user.role, "left");
            }

        } else {

            user.connected = false;
            user.socketId = null;

            sendUserList(io, roomId, socket.data.username, email, user.role, "offline");

        }

        });

    }

    function sendUserList(io, roomId, username="", email="", role="", action="joined") {

        const clients = [];

        if (roomUsers.has(roomId)) {

        for (const [email, data] of roomUsers.get(roomId).entries()) {
        clients.push({ email, ...data });
        }

        io.in(roomId).emit(ACTIONS.JOINED, {
            clients,
            username,
            email,
            Role: role,
            socketId: null,
            action
        });

    }

}