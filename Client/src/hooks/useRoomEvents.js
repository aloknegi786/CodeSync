import { useEffect } from "react";
import ACTIONS from "../Actions";
import toast from "react-hot-toast";

export default function useRoomEvents({
  socketRef,
  roomId,
  username,
  email,
  description,
  setClients,
  setRole,
  navigate,
  isConnected,
  setIsConnected,
  setIsExecuting,
}) {

  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.emit(ACTIONS.JOIN, {
      roomId,
      username,
      email,
      description
    });


    socketRef.current.on(ACTIONS.JOINED, ({ clients, username: joinedUser, email: joinedEmail, Role, action }) => {
      console.log(`${joinedUser} (${joinedEmail}) has ${action} the room as ${Role}, isConnected: ${isConnected}`);
      if(!isConnected) {
        setIsConnected(true);
      }
      if(!(joinedEmail === email && action === "promoted as editor")){
        toast.success(`${joinedUser} ${action}`);
      }

      const currentUser = clients.find(c => c.email === email);
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
      setIsExecuting(false);
      toast.error(message);
    });

    socketRef.current.on(ACTIONS.CLOSE, ({ message }) => {
      toast.error(message);
      setTimeout(() => navigate("/join-room"), 2000);
    });

    return () => {
      socketRef.current.off(ACTIONS.JOINED);
      socketRef.current.off(ACTIONS.NOTIFICATION);
      socketRef.current.off(ACTIONS.ACTION_ERROR);
      socketRef.current.off(ACTIONS.CLOSE);
    };

  }, [socketRef.current]);
}