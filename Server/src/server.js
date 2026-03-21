import express from "express";
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';

import { setupSocketServer } from './sockets/index.js';
import { fetchUserRooms, deleteUserRoom } from "./controllers/userController.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors({
    origin: '*',
    // credentials: true
}));
app.use(express.json());

const server = http.createServer(app);
setupSocketServer(server);

app.get('/api/userRooms', fetchUserRooms);
app.delete('/api/delete-room/:roomId', deleteUserRoom);

app.get('/', (req, res) => {
  res.send({
    activeStatus: true,
    error: false,
  })
});

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});
