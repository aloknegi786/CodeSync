import { roomDetails, roomUsers } from './../../../models/RoomStore.js';
import { ACTIONS } from '../../../utils/Actions.js';
import { runCode } from '../../../controllers/executionController.js'



const EXECUTION_TIMEOUT_MS = 10000; // 10 seconds

export function registerExecutionHandler(io, socket) {

  socket.on(ACTIONS.EXECUTE, async ({ roomId }) => {
    const room = roomUsers.get(roomId);
    const liveRole = room?.get(socket.data.email)?.role;
    if (liveRole !== "host") return; 


    const roomDetail = roomDetails.get(roomId);
    if (!roomDetail) return;

    if (roomDetail.isExecuting) {
      io.to(socket.id).emit(ACTIONS.ERROR, { message: "Code is already executing. Please wait." });
      return;
    }

    roomDetail.isExecuting = true;
    const codeToExecute = roomDetail.ydoc.getText('monaco').toString();

    // to check time out, we create a promise that rejects after a certain time, and race it against the actual execution promise. This way, if the execution takes too long, we can handle it gracefully.
    const executionWithTimeout = Promise.race([
      runCode(roomDetail.language, codeToExecute, roomDetail.input),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Execution timed out after 10s")), EXECUTION_TIMEOUT_MS)
      )
    ]);

    try {
      const output = await executionWithTimeout;
      roomDetail.output = (output ?? "").trim().split("\n").filter(line => line !== "");
      roomDetail.isError = false;
    } catch (err) {
      roomDetail.output = [err.message];
      roomDetail.isError = true;
    }
    finally {
      roomDetail.isExecuting = false; 
    }

    roomDetail.isExecuting = false;
    io.to(roomId).emit(ACTIONS.OUTPUT_CHANGE, {
      output: roomDetail.output,
      isError: roomDetail.isError
    });
  });

  socket.on(ACTIONS.INPUT_CHANGE, ({ input, roomId }) => {
    const room = roomUsers.get(roomId);
    const liveRole = room?.get(socket.data.email)?.role;
    if (liveRole !== "host") return; 

    const roomDetail = roomDetails.get(roomId);
    if (!roomDetail) return;

    roomDetail.input = input;
    io.to(roomId).emit(ACTIONS.INPUT_CHANGE, { newInput: input });
  });
}