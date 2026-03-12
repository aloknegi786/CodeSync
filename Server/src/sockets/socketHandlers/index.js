import { registerJoinHandler } from './handlers/joinHandler.js';
import { registerYjsHandler } from './handlers/yjsHandler.js';
import { registerRoomHandler } from './handlers/roomHandler.js';
import { registerExecutionHandler } from './handlers/executionHandler.js';
import { registerUserHandler } from './handlers/userHandler.js';
import { registerDisconnectHandler } from './handlers/disconnectHandler.js';

export function registerSocketHandlers(io, socket) {
  console.log('socket connected:', socket.id);

  registerJoinHandler(io, socket);
  registerYjsHandler(io, socket);
  registerRoomHandler(io, socket);
  registerExecutionHandler(io, socket);
  registerUserHandler(io, socket);
  registerDisconnectHandler(io, socket);
}