import { io } from 'socket.io-client';

const URL = 'http://localhost:5000';
let socket = null;

export const initSocket = async () => {
    if (!socket) {
        const options = {
            transports: ['websocket'],
            timeout: 10000,
            reconnectionAttempts: Infinity,
        };
        socket = io(URL, options);

        await new Promise((resolve, reject) => {
            socket.on('connect', resolve);
            socket.on('connect_error', (err) => {
                reject(err);
            });
        });
    }

    return socket;
};
