import express from "express";
import http from 'http'
import { Server } from "socket.io";
import { ACTIONS } from "./Actions.js";

const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server);

const userSocketMap = {}
function getAllConnectedClients(roomId) {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map((socketId) => {
        return {
            socketId,
            username: userSocketMap[socketId]
        }
    })
}

io.on('connection', (socket) => {
    console.log('socket connected ', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        userSocketMap[socket.id] = username;
        socket.join(roomId);
    
        const clients = getAllConnectedClients(roomId);
    
        // ✅ Broadcast JOINED to everyone in the room once
        io.in(roomId).emit(ACTIONS.JOINED, {
            clients,
            username,
            socketId: socket.id,
        });
    });
    
});


server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
})