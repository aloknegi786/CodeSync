import { roomDetails } from "../models/RoomStore.js";
import { ACTIONS } from "../utils/Actions.js";
import { runCode } from "../controllers/executionController.js";

export function registerExecution(io, socket) {

    socket.on(ACTIONS.EXECUTE, async ({ roomId }) => {

    if (socket.data.role !== "host") return;

    const roomDetail = roomDetails.get(roomId);
    if (!roomDetail) return;

    if (roomDetail.isExecuting) {
        io.to(roomId).emit(ACTIONS.ERROR, {
        message: "Code already executing"
        });
        return;
    }

    roomDetail.isExecuting = true;

    const code = roomDetail.ydoc.getText("monaco").toString();

    try {

        const output = await runCode(
        roomDetail.language,
        code,
        roomDetail.input
        );

        roomDetail.output = output.trim().split("\n");
        roomDetail.isError = false;

    } catch (err) {

        roomDetail.output = [err.message];
        roomDetail.isError = true;

    }

    roomDetail.isExecuting = false;

    io.to(roomId).emit(ACTIONS.OUTPUT_CHANGE, {
        output: roomDetail.output,
        isError: roomDetail.isError
    });

    });

    socket.on(ACTIONS.INPUT_CHANGE, ({ input, roomId }) => {

    if (socket.data.role !== "host" && socket.data.role !== "editor") return;

    const roomDetail = roomDetails.get(roomId);
    if (!roomDetail) return;

    roomDetail.input = input;

    io.to(roomId).emit(ACTIONS.INPUT_CHANGE, {
        newInput: input
    });

    });

}