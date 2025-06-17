import { Server } from 'socket.io';
import { registerSocketHandlers } from '../controllers/socketController.js';

export const setupSocketServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    registerSocketHandlers(io, socket);
  });
};
