import { useEffect, useRef, useState } from "react";
import { initSocket, resetSocket } from "../socket";
import toast from "react-hot-toast";

export default function useSocket(navigate) {

  const socketRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {

    const handleErrors = (err) => {
      console.log("Socket error", err);
      toast.error("Socket connection failed, try again later");
      navigate("/");
    };

    const init = async () => {
      const socket = await initSocket();
      socketRef.current = socket;

      socket.on("connect_error", handleErrors);
      socket.on("connect_failed", handleErrors);

      setReady(true); 
    };

    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect_error", handleErrors);
        socketRef.current.off("connect_failed", handleErrors);
        socketRef.current.disconnect();
        resetSocket();
      }
    };

  }, [navigate]);

  return { socketRef, ready };
}