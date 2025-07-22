import express from "express";
import http from 'http';
import cors from 'cors';
import { setupSocketServer } from './sockets/index.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
setupSocketServer(server);

app.get('/', (req, res) => {
  res.send({
    activeStatus: true,
    error: false,
  })
});

server.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});
