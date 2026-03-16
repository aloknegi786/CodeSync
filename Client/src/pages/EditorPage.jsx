import { useLocation, useParams, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";

import Sidebar from "../components/Sidebar";
import EditorPanel from "../components/EditorPanel";
import SideBarRight from "../components/SideBarRight";
import ACTIONS from "../Actions";

import useSocket from "../hooks/useSocket";
import useRoomEvents from "../hooks/useRoomEvents";
import useEditorSync from "../hooks/useEditorSync";

import { Splitter, SplitterPanel } from "primereact/splitter";
import { toast } from "react-hot-toast";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";
import LoadingPage from "./LoadingPage";

function EditorPage() {

  const location = useLocation();
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u) {
        setTimeout(() => {
        navigate("/login");
      }, 1000);
      } else {
        setUser(u);
      }
    });

    return unsubscribe;
  }, [navigate]);


  const username = location.state.username;
  const email = location.state.email;

  const [clients, setClients] = useState([]);
  const [role, setRole] = useState("viewer");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const codeRef = useRef(null);
  const editorRef = useRef(null);

  const handleSetEditor = useCallback((editor) => {
    editorRef.current = editor;
  }, []);

  const handleSetCode = useCallback((code) => {
    codeRef.current = code;
  }, []);

  const { socketRef, ready } = useSocket(navigate);

  useRoomEvents({
    socketRef,
    roomId,
    username,
    email,
    setClients,
    setRole,
    navigate,
    isConnected,
    setIsConnected,
    setIsExecuting
  });

  useEditorSync({
    socketRef,
    setInput,
    setOutput,
    setError,
    setIsExecuting,
  });

  if (!ready) {
    return <LoadingPage message="waiting for socket connection..." />;
  }

   async function copyRoomId(){
        try{
            await navigator.clipboard.writeText(roomId);
            toast.success(`Room ID has been copied to your clipboard`);
        } catch(err){
            toast.error(`Could not copy Room ID`);
            console.log("Error: ", err);
        }
    }

    function requestPromotion() {
        const username = location.state?.username;
        if (!username || !roomId || !socketRef.current?.connected) return;

        socketRef.current.emit(ACTIONS.REQUEST_PROMOTION, {
            roomId,
            username,
            email,
        });
    }

    function promote(socketId, userRole, email) {
        if(role !== "host" || userRole != "pending"){
            return ;
        }

        socketRef.current.emit(ACTIONS.PROMOTE, {
            roomId,
            socketId,
            email,
        });
    }


    async function leaveRoom() {
        try {

            if (socketRef.current?.connected) {
                socketRef.current.emit(ACTIONS.LEAVE, {
                    roomId,
                    username,
                    email,
                });
            }

            navigate("/join-room");

        } catch (err) {
            console.error("Error leaving room:", err);
            navigate("/join-room");
        }
    }

  
  if (user === undefined) {
    return null;
  }

  if (!location.state) return <Navigate to="/" />;

  if (!isConnected) {
    return (
      <LoadingPage message="Connecting to server..." />
    );
  }

  return (
    <div className="mainWrap flex h-screen">

      <Sidebar
        clients={clients}
        role={role}
        socketRef={socketRef}
        roomId={roomId}
        promote={promote}
        requestPromotion={requestPromotion}
        copyRoomId={copyRoomId}
        leaveRoom={leaveRoom}
      />

      <Splitter
        style={{ flex: 1, height: "100%", border: "none", background: "transparent", overflow: "hidden" }}
        className="custom-splitter"
      >
        <SplitterPanel
          size={65}
          minSize={30}
          style={{ overflow: "hidden" }}
        >
          <EditorPanel
            socketRef={socketRef}
            roomId={roomId}
            role={role}
            handleSetEditor={handleSetEditor}
            handleSetCode={handleSetCode}
            setOutput={setOutput}
            input={input}
            setError={setError}
            isExecuting={isExecuting}
            setIsExecuting={setIsExecuting}
          />
        </SplitterPanel>

        <SplitterPanel
          size={35}
          minSize={20}
          style={{ overflow: "hidden" }}
        >
          <SideBarRight
            output={output}
            input={input}
            setInput={setInput}
            error={error}
            socketRef={socketRef}
            roomId={roomId}
            isExecuting={isExecuting}
          />
        </SplitterPanel>
      </Splitter>

    </div>
  );
}

export default EditorPage;