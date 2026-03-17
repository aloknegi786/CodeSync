import React, { useState, useCallback } from "react";
import axios from 'axios';
import toast from "react-hot-toast";

import RoomCard from "./RoomCard";

import './RoomList.css';



function RoomsList({ email }) {
  const [rooms,       setRooms]       = useState([]);
  const [roomsOpen,   setRoomsOpen]   = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(false);

  const fetchRooms = useCallback(async () => {
    setRoomsLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/userRooms`, 
        {
          params: {email: email},
        }
      );
      
      setRooms(res.data.rooms);
      setRoomsOpen(true);
    } catch(error) {
      console.log(error);
      toast.error("Could not load your rooms");
    } finally {
      setRoomsLoading(false);
    }
  }, [email]);

  const handleDeleteRoom = async (roomId) => {
    try {
      setRooms((prev) => prev.filter(room => room.room_id !== roomId));
    } catch (error) {
      showToast("Failed to delete room", "error");
    }
  };

  const handleHeaderClick = () => {
    if (roomsOpen) {
      setRoomsOpen(false);
    } else {
      fetchRooms();
    }
  };

  return (
    <div className="roomsPanel">

      {/* Header */}
      <div className="roomsPanelHeader" onClick={handleHeaderClick}>
        <span>My Rooms</span>
        <div className="roomsPanelHeaderRight">
          {rooms.length > 0 && (
            <span className="roomsCount">{rooms.length}</span>
          )}
          <button
            className="refreshBtn"
            title="Refresh"
            onClick={(e) => { e.stopPropagation(); fetchRooms(); }}
          >
            ↻
          </button>
          <span className={`room-chevron ${roomsOpen ? "open" : ""}`}>▾</span>
        </div>
      </div>

      {/* List */}
      <div className="roomsList">
        {!roomsOpen ? (
          <div className="roomsEmpty">Click to load your rooms</div>
        ) : roomsLoading ? (
          <div className="roomsEmpty">Loading…</div>
        ) : rooms.length === 0 ? (
          <div className="roomsEmpty">No rooms yet. Create one!</div>
        ) : (
          rooms.map((room) => (
            <RoomCard 
              key={room.room_id} 
              room={room} 
              onDelete={handleDeleteRoom} 
            />
          ))
        )}
      </div>

    </div>
  );
}

export default RoomsList;