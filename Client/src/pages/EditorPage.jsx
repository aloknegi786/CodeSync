import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import ACTIONS from '../Actions';
import toast from 'react-hot-toast';

function EditorPage() {
    const socketRef = useRef(null);
    const location = useLocation();
    const navigator = useNavigate();
    const { roomId } = useParams();
    
    const [clients, setClients] = useState([]);
    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();
    
            socketRef.current.on('connect_error', handleErrors);
            socketRef.current.on('connect_failed', handleErrors);
    
            function handleErrors(err) {
                console.log('Socket error', err);
                toast.error('Socket connection failed, try again later');
                navigator('/');
            }
    
            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });
    
            socketRef.current.off(ACTIONS.JOINED);
            socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
                if (username !== location.state?.username) {
                    console.log("socketId: ", socketId);
                    toast.success(`${username} joined the room`);
                }
                setClients(clients);
            });
        };
    
        if(socketRef.current === null) init();
    
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current.off(ACTIONS.JOINED);
                socketRef.current.off('connect_error');
                socketRef.current.off('connect_failed');
            }
        };
    }, []);
    


    if(!location.state){
        return <Navigate to="/" />
    }

  return (
    <div className='mainWrap'>
        <div className='aside'>
            <div className='asideInner'>
                <div className='logo'>
                    <img 
                        className='logoImage' 
                        src="/code-sync-logo.png" 
                        alt="code-sync-logo" 
                    />
                </div>
                
                <h3>Connected</h3>
                <div className='clientsList'>
                    {clients?.map((client) => (
                         <Client key = {client.socketId} username = {client.username}/> 
                    ))}
                </div>
            </div>

            <button className="btn copyBtn">
                Copy ROOM ID
            </button>
            <button className='btn leaveBtn'>
                Leave
            </button>
        </div>
        <div className='editorWrap'>
            <Editor />
        </div>
    </div>
  )
}

export default EditorPage
