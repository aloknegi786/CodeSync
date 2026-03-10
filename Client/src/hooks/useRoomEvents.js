import { useEffect } from "react";
import ACTIONS from "../Actions";
import toast from "react-hot-toast";

export default function useRoomEvents({
  socketRef,
  roomId,
  username,
  setClients,
  setRole,
  navigate
}) {

  useEffect(() => {

    if (!socketRef.current) return;

    socketRef.current.emit(ACTIONS.JOIN, {
      roomId,
      username
    });

    socketRef.current.on(ACTIONS.JOINED, ({ clients, username: joinedUser, Role, action }) => {

      if(!(joinedUser === username && action === "promoted as editor")){
        toast.success(`${joinedUser} ${action}`);
      }

      const currentUser = clients.find(c => c.username === username);
      if (currentUser) {  
        setRole(currentUser.role);
        currentUser.username = "You";
      }

      setClients(clients);
    });

    socketRef.current.on(ACTIONS.NOTIFICATION, ({ message }) => {
      toast(message);
    });

    socketRef.current.on(ACTIONS.ACTION_ERROR, ({ message }) => {
      toast.error(message);
    });

    socketRef.current.on(ACTIONS.CLOSE, ({ message }) => {
      toast.error(message);
      setTimeout(() => navigate("/"), 2000);
    });

    return () => {
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.NOTIFICATION);
      socketRef.current.off(ACTIONS.ACTION_ERROR);
      socketRef.current.off(ACTIONS.CLOSE);
    };

  }, [socketRef.current]);
}