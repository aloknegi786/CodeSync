import { useEffect, useRef, useState } from "react";
import { initSocket, resetSocket } from "../socket";
import toast from "react-hot-toast";

export default function useSocket(navigate) {

  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {

    const handleErrors = (err) => {
      console.log("Socket error", err);
      toast.error("Socket connection failed, try again later");
      navigate("/");
    };

    const init = async () => {

      socketRef.current = await initSocket();

      // Since initSocket waits for connection, we know it's connected
      setIsConnected(true);

      socketRef.current.on("disconnect", () => {
        setIsConnected(false);
      });

      socketRef.current.on("connect_error", handleErrors);
      socketRef.current.on("connect_failed", handleErrors);
    };

    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.off("disconnect");
        socketRef.current.off("connect_error", handleErrors);
        socketRef.current.off("connect_failed", handleErrors);

        socketRef.current.disconnect();
        resetSocket();
      }
    };

  }, [navigate]);

  return { socketRef, isConnected };
}