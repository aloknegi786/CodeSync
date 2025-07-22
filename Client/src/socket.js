import { io } from 'socket.io-client';

const URL = import.meta.env.VITE_BACKEND_URL;
let socket = null;

export const initSocket = async () => {
    if (socket && socket.connected) {
        return socket;
    }

    if (socket && !socket.connected) {
        socket.disconnect();
        socket = null;
    }

    if (!socket) {
        const options = {
            transports: ['websocket'],
            timeout: 20000,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        };

        socket = io(URL, options);

        socket.on('connect', () => {});
        socket.on('disconnect', (reason) => {});
        socket.on('reconnect_attempt', (attemptNumber) => {});
        socket.on('reconnect', (attemptNumber) => {});
        socket.on('reconnect_error', (error) => {});
        socket.on('connect_timeout', (timeout) => {});
        socket.on('error', (error) => {});

        await new Promise((resolve, reject) => {
            const handleConnect = () => {
                socket.off('connect_error', handleReject);
                socket.off('connect_timeout', handleReject);
                resolve();
            };
            const handleReject = (err) => {
                socket.off('connect', handleConnect);
                socket.off('connect_timeout', handleReject);
                socket.off('connect_error', handleReject);
                reject(err || new Error('Socket connection failed or timed out.'));
            };

            socket.once('connect', handleConnect);
            socket.once('connect_error', handleReject);
            socket.once('connect_timeout', handleReject);
        });
    }

    return socket;
};

export const resetSocket = () => {
    if (socket) {
        socket.disconnect();
    }
    socket = null;
};