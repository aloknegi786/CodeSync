import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket } from '../socket';
import ACTIONS from '../Actions';
import toast from 'react-hot-toast';

function EditorPage() {
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const location = useLocation();
    const reactNavigator = useNavigate();
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
                reactNavigator('/');
            }
    
            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });
    
            socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
                if (username !== location.state?.username) {
                    toast.success(`${username} joined the room`);
                }
                setClients(clients);
                console.log(codeRef.current);
                socketRef.current.emit(ACTIONS.SYNC_CODE, {
                    code: codeRef.current,
                    socketId,
                });
            });

            socketRef.current.on(ACTIONS.DISCONNECTED, ({socketId, username}) => {
                toast.success(`${username} left the room`);
                setClients((prev) => {
                    return prev.filter(client => client.socketId != socketId);
                });
            });
        };
    
        init();
    
        // cleaning functions
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current.off(ACTIONS.JOINED);
                socketRef.current.off(ACTIONS.DISCONNECTED);
                socketRef.current.off('connect_error');
                socketRef.current.off('connect_failed');
            }
        };
    }, []);

    useEffect(()=>{
        if (socketRef.current) {
          socketRef.current.on(ACTIONS.CODE_CHANGE, ({ code }) => {
            if (code != null) {
              cmInstanceRef.current.setValue(code);
            }
          });
        }
    
        return () => {
          socketRef.current.off(ACTIONS.CODE_CHANGE);
        }
      },[socketRef.current]);
    
    async function copyRoomId(){
        try{
            await navigator.clipboard.writeText(roomId);
            toast.success(`Room ID has been copied to your clipboard`);
        } catch(err){
            toast.error(`Could not copy Room ID`);
            console.log("Error: ", err);
        }
    }

    function leaveRoom(){
        reactNavigator('/');
    }

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

            <button className="btn copyBtn" onClick={copyRoomId}>
                Copy ROOM ID
            </button>
            <button className='btn leaveBtn' onClick={leaveRoom}>
                Leave
            </button>
        </div>
        <div className='editorWrap'>
            <Editor 
                socketRef={socketRef} 
                roomId={roomId} 
                onCodeChange={(code) => {codeRef.current = code}}
            />
        </div>
    </div>
  )
}

export default EditorPage
