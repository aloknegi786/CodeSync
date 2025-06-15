import { roomUsers, roomDetails } from '../models/RoomStore.js';

export function fetchRoomStatus(roomId){
    const users = roomUsers[roomId];
    const roomDetail = roomDetails[roomId];

    if(!users || !roomDetail){
        return ;
    }

    return { users, roomDetail }
}