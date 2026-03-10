import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidV4 } from "uuid";
import toast from "react-hot-toast";

import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";

function Home() {

  const navigate = useNavigate();

  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

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

    toast.success("Room Id created. You can now share it with your friends!");
  };

  const joinRoom = () => {

    if (!roomId || !username || !email) {
      toast.error("ROOM ID, username, and email are required");
      return;
    }

    navigate(`/editor/${roomId}`, {
      state: {
        username,
        email
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
            placeholder="User-name"
            value={username}
            style={{ cursor: "not-allowed"}}
            readOnly
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

      <footer>
        <h4>
          Built with 💛 by{" "}
          <a href="https://github.com/aloknegi786">
            Alok Negi
          </a>
        </h4>
      </footer>

    </div>
  );
}

export default Home;