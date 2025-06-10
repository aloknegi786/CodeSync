import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import Client from '../components/Client';
import Editor from '../components/Editor';
import { initSocket, resetSocket } from '../socket';
import ACTIONS from '../Actions';
import toast from 'react-hot-toast';
import 'react-toastify/dist/ReactToastify.css';
import OutputPanel from '../components/OutputPanel';

function EditorPage() {
    const [role, setRole] = useState("viewer");
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

            const navType = performance.getEntriesByType("navigation")[0]?.type;
            if (navType === "reload") {
                window.location.href = "/";
            }
    
            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });
    
            socketRef.current.on(ACTIONS.JOINED, ({ clients, username, Role, socketId }) => {
                const currentUsername = location.state?.username;

                if (username !== currentUsername) {
                    if (Role === 'viewer') toast.success(`${username} joined the room`);
                }

                const currentUser = clients.find(client => client.username === currentUsername);
                if (currentUser) {
                    setRole(currentUser.role);
                }

                setClients(clients);

                socketRef.current.emit(ACTIONS.SYNC_CODE, {
                    code: codeRef.current,
                    socketId,
                });
            });

            socketRef.current.on("notification", ({message}) => {
                console.log(message);
                toast(message);
            });

            socketRef.current.on("action_error", ({message}) => {
                toast.error(message);
            });

            socketRef.current.on("close", ({ message }) => {
                toast.error(message);
                setTimeout(() => {
                    reactNavigator('/')
                }, 2000);
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
                resetSocket();
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

    function requestPromotion() {
        const username = location.state?.username;
        if (!username || !roomId || !socketRef.current?.connected) return;

        socketRef.current.emit(ACTIONS.REQUEST_PROMOTION, {
            roomId,
            username
        });
    }

    function promote(socketId, userRole) {
        console.log("promotion process pending");
        if(role !== "host" || userRole != "pending"){
            return ;
        }

        socketRef.current.emit(ACTIONS.PROMOTE, {
            roomId,
            socketId
        });
    }


    async function leaveRoom(){
        reactNavigator('/');
    }

    if(!location.state){
        return <Navigate to="/" />
    }

  return (
    <div className='mainWrap flex overflow-x-auto'>
        <div className='aside w-[230px] flex-shrink-0'>
            <div className='asideInner'>
                <div className='logo'>
                    <img 
                        className='logoImage' 
                        src="/code-sync-logo.png" 
                        alt="code-sync-logo" 
                    />
                </div>
                
                <div className='w-full text-center my-4 text-lg '>
                    <h3>
                        Host
                    </h3>
                </div>
                <div className='clientsList'>
                    {clients?.map((client) => (
                        <>
                            {client?.role?.toLowerCase() === 'host' && (
                                <Client 
                                    key={client?.socketId}
                                    client={client}
                                    promote={promote} 
                                />
                            )}

                        </>
                    ))}
                </div>
                <div className='w-full text-center my-4 text-lg '>
                    <h3>
                        Editor
                    </h3>
                </div>
                <div className='clientsList'>
                    {clients?.some(client => client?.role?.toLowerCase() === 'editor') ? (
                        clients.map(client =>
                        client?.role?.toLowerCase() === 'editor' && (
                            <Client 
                                key={client.socketId} 
                                client={client}
                                promote={promote}
                            />
                        )
                        )
                    ) : (
                        <small className="block w-full text-center text-sm text-gray-400 mt-2">
                            No editors connected.
                        </small>
                    )}
                </div>

                <div className='w-full text-center my-4 text-lg '>
                    <h3>
                        Requests
                    </h3>
                </div>
                <div className="clientsList">
                    {clients?.some(client => client?.role?.toLowerCase() === 'pending') ? (
                        clients
                            .filter(client => client?.role?.toLowerCase() === 'pending')
                            .map(client => (
                                <Client
                                    key={client.socketId}
                                    client={client}
                                    promote={promote}
                                />
                            ))
                    ) : (
                        <small className="block w-full text-center text-sm text-gray-400 mt-2">
                            No requests till now.
                        </small>
                    )}
                </div>


            </div>

            {role === "host" && (
                <button className="btn copyBtn" onClick={copyRoomId}>
                    Copy ROOM ID
                </button>
            )}
            {role === "viewer" && (
                <button className="btn copyBtn" onClick={requestPromotion}>
                    Request Promotion
                </button>
            )}
            <button className='btn leaveBtn' onClick={leaveRoom}>
                Leave
            </button>
        </div>
        <div className='flex-1 editorWrap w-2/5 border border-red rounded-xlg'>
            <Editor 
                socketRef={socketRef} 
                roomId={roomId} 
                onCodeChange={(code) => {codeRef.current = code}}
            />
        </div>

        <div className='w-3/10 bg-red-500'>
            <div>
                {/* {output pannel to be added} */}
            </div>
            <div>
                {/* group chat section to be added */}
            </div>
        </div>
    </div>
  )
}

export default EditorPage
