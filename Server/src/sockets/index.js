import { Server } from 'socket.io';
import { registerSocketHandlers } from './socketHandlers/index.js';

export const setupSocketServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL, 
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    registerSocketHandlers(io, socket);
  });
};
