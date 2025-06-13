import express from "express";
import http from 'http'
import { Server } from "socket.io";
import { ACTIONS } from "./Actions.js";
import cors from 'cors'

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server);

const rooms = new Map();

io.on('connection', (socket) => {
    console.log('socket connected ', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        // problem : on reload the user reconnects but as a different userthe hosts identity is lost somewhere
        // last changes
        const room = rooms.get(roomId);
        // till here

        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.username = username;
        socket.data.role = "viewer";

        if(!rooms.has(roomId)){
            rooms.set(roomId, new Map());
            socket.data.role = "host";
        }

        rooms.get(roomId).set(socket.id, {
            username,
            role: socket.data.role
        });

        sendUserList(roomId, username);
    });

    socket.on(ACTIONS.REQUEST_PROMOTION, ({ roomId, username }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        socket.data.role = "pending";

        for (const [socketId, data] of room.entries()) {
            if (data.username === username) {
                data.role = "pending";
                break;
            }
        }
        sendUserList(roomId, username);
    });


    socket.on(ACTIONS.CODE_CHANGE, ({roomId, code}) => {
        const room = rooms.get(roomId);
        console.log(socket.data.username);
        console.log(socket.data.role);
        console.log(code);
        if(!room) return ;
        const user = room.get(socket.id);
        if(!user) return ;

        socket.data.role = user.role;
        if(socket.data.role === 'viewer' || socket.data.role === 'pending'){
            io.to(roomId).emit("action_error", {
                message: "Un-Authorized Action"
            });
            return ;
        }
        socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
    });

    socket.on(ACTIONS.PROMOTE, ({ roomId, socketId }) => {
        const room = rooms.get(roomId);
        if (!room || socket.data.role !== "host") {
            io.to(socket.id).emit("action_error", {
                message: "Invalid action"
            });
            return;
        }

        const user = room.get(socketId);
        if (!user){
            io.to(socket.id).emit("action_error", {
                message: "No such user"
            });
            return ;
        }

        user.role = "editor";
        room.set(socketId, user);
        
        io.to(socketId).emit('notification', {
            message : "You have been promoted as editor."
        });

        sendUserList(roomId, socket.data.username);
    });

    socket.on("disconnect", () => {
        const { roomId, role } = socket.data || {};

        if (rooms.has(roomId)) {
            const wasHost = role === "host";

            rooms.get(roomId).delete(socket.id);

            if (rooms.get(roomId).size === 0 || wasHost) {
                io.to(roomId).emit("close", {
                    message: "Host left! Room will be closed in 2s",
                });

                setTimeout(() => {
                    rooms.delete(roomId);
                }, 2000);
            } else {
                sendUserList(roomId);
            }
        }
    });



    socket.on(ACTIONS.SYNC_CODE, ({ socketId, code}) => {
        io.to(socketId).emit(ACTIONS.CODE_CHANGE, {code});
    });
    
    function sendUserList(roomId, username){
        const clients = [];
        if(rooms.has(roomId)){
            for (const [socketId, data] of rooms.get(roomId).entries()){
                clients.push({socketId, ...data});
            }
            io.in(roomId).emit(ACTIONS.JOINED, {
                clients,
                username,
                Role: socket.data.role,
                socketId: socket.id,
            });
        }
    }
});


server.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
})