import { registerRoomLifecycle } from "./roomLifeCycle.js";
import { registerCollaboration } from "./collaboration.js";
import { registerExecution } from "./execution.js";

export function registerSocketHandlers(io, socket) {

  console.log("socket connected", socket.id);

  registerRoomLifecycle(io, socket);
  registerCollaboration(io, socket);
  registerExecution(io, socket);

}