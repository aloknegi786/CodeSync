import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_BACKEND_URL;
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

export const resetSocket = async () => {
    socket = null;
    return ;
}
