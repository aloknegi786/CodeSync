import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidV4 } from "uuid";
import toast from "react-hot-toast";

import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";

import RoomsList from "../components/RoomList";

function Home() {

  const navigate = useNavigate();

  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [isNewRoom, setIsNewRoom] = useState(false);

  useEffect(() => {

    const user = auth.currentUser;

    if (!user) {
      navigate("/login");
      return;
    }

    setEmail(user.email);
    setUsername(user.displayName?.split(" ")[0] || "");

  }, [navigate]);

  const createNewRoom = (e) => {
    e.preventDefault();

    const id = uuidV4();
    setRoomId(id);
    setIsNewRoom(true);

    toast.success("Room Id created. You can now share it with your friends!");
  };

  const joinRoom = () => {

    if (!roomId || !username || !email) {
      toast.error("ROOM ID, username, and email are required");
      return;
    }

    if(isNewRoom && !description){
      toast.error("Room description is required for new room");
      return ;
    }

    navigate(`/editor/${roomId}`, {
      state: {
        username,
        email,
        description
      }
    });

  };

  const handleLogout = async () => {
    try {
        await signOut(auth);
        navigate("/login");
    } catch (err) {
        console.error(err);
        toast.error("Logout failed");
    }
    };

  const handleInputEnter = (e) => {
    if (e.code === "Enter") {
      joinRoom();
    }
  };

  return (
    <div className="homePageWrapper">

      <div className="formWrapper">

        <img
          src="/code-sync-logo.png"
          alt="code-sync-logo"
          className="code-sync-logo"
        />

        <h4 className="mainLabel">Paste invitation RoomId</h4>

        <div className="inputGroup">

          <input
            type="text"
            className="inputBox"
            placeholder="ROOM ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyUp={handleInputEnter}
          />

          <input
            type="text"
            className="inputBox"
            placeholder="Description (optional for invite)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyUp={handleInputEnter}
          />

          {/* Auto-filled email from Google auth */}
          <input
            type="email"
            className="inputBox"
            placeholder="User-email"
            value={email}
            style={{ cursor: "not-allowed"}}
            readOnly
          />

        <div className="topActions">
            <button
                className="btn logoutBtn"
                onClick={handleLogout}
            >
                Log Out
            </button>
            <button
                className="btn joinBtn"
                onClick={joinRoom}
            >
                Join
            </button>

         </div>


          <span className="createInfo">
            If you don't have an invite then create &nbsp;

            <button
              className="createNewBtn"
              onClick={createNewRoom}
              type="button"
            >
              new room
            </button>

          </span>

        </div>


      </div>

        <RoomsList email={email} />

    </div>
  );
}

export default Home;