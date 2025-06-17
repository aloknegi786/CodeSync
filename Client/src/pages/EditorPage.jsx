import React, { useState ,useCallback, useRef, useEffect } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import Client from '../components/Client';
import MonacoEditor from '../components/MonacoEditor';
import OutputInput from '../components/OutputInput';
import { initSocket, resetSocket } from '../socket';
import ACTIONS from '../Actions';
import toast from 'react-hot-toast';
import 'react-toastify/dist/ReactToastify.css';
import { Box } from '@chakra-ui/react';
import { Splitter, SplitterPanel } from 'primereact/splitter';

import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense
} from "@liveblocks/react/suspense";

function EditorPage() {
    const [role, setRole] = useState("viewer");
    const socketRef = useRef(null);
    const codeRef = useRef(null);
    const editorRef = useRef(null);
    const location = useLocation();
    const reactNavigator = useNavigate();
    const { roomId } = useParams();
    const [output, setOutput] = useState('click "Run" to run the code')
    const [isLoading, setIsLoading] = useState(false);
    const [input, setInput] = useState('')
    const [error, setError] = useState(false)
    
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
                    currentUser.username = "You";
                }

                setClients(clients);
            });

            socketRef.current.on("input_change", ({newInput}) => {
                setInput(newInput);
            });

            socketRef.current.on("output_change", ({output, isError}) => {
                setOutput(output);
                setError(isError);
                setIsLoading(false);
            });

            socketRef.current.on("notification", ({message}) => {
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
                socketRef.current.off("output_change");
                socketRef.current.off("input_change");
                socketRef.current.off('connect_error');
                socketRef.current.off('connect_failed');
                resetSocket();
            }
        };
    }, []);


    useEffect(() => {
        if (!socketRef.current) return;

        const handleCodeChange = ({ code }) => {
            if (code != null && editorRef.current) {
                const currentCode = editorRef.current.getValue();
                if (currentCode !== code) {
                    const position = editorRef.current.getPosition();
                    editorRef.current.setValue(code);
                    editorRef.current.setPosition(position);
                }
            }
        };

        socketRef.current.on(ACTIONS.CODE_CHANGE, handleCodeChange);

        return () => {
            socketRef.current.off(ACTIONS.CODE_CHANGE, handleCodeChange);
        };
    }, [socketRef.current]);

    const handleSetEditor = useCallback((editor) => {
        editorRef.current = editor;
    }, []);


    
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
    // <LiveblocksProvider publicApiKey="pk_dev_eH0HjUegNKo0QzkeHi5PA3pY74qPGUp5ELD63bJ2t4aST-rDVct5UjCEkaG_uPPW">
    //             <RoomProvider
    //             id={roomId}
    //             initialPresence={{
    //                 cursor: null,
    //                 name: location.state?.username,
    //                 isTyping: false,
    //             }}
    //             >
    //             <ClientSideSuspense fallback={<div>Loading…</div>}>
                    <div className='mainWrap flex h-screen'>
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
                                    {clients?.map((client, index) => (
                                        <>
                                            {client?.role?.toLowerCase() === 'host' && (
                                                <Client 
                                                    key={index}
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
                                        clients.map((client, index) =>
                                        client?.role?.toLowerCase() === 'editor' && (
                                            <Client 
                                                key={index} 
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
                                            .map((client, index) => (
                                                <Client
                                                    key={index}
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
                        <div className="flex">
                            {/* Editor Section */}
                            <div className="h-full w-1/2 pt-8">
                            <Box
                                width="95%"
                                height="93%"
                                overflow="auto"
                                bg="gray.800"
                                color="white"
                                p={4}
                                border="1px"
                                borderRadius="10"
                                mt='2'
                                ml='0.5'
                                >                                        
                                    <MonacoEditor
                                        socketRef={socketRef}
                                        roomId={roomId}
                                        onCodeChange={(code) => {
                                            codeRef.current = code;
                                        }}
                                        role={role}
                                        setEditorInstance={handleSetEditor}
                                        setOutput={setOutput} 
                                        input={input} 
                                        setError={setError}
                                        isLoading={isLoading}
                                        setIsLoading = {setIsLoading}
                                    />
                            </Box>
                            </div>

                            {/* Output Panel */}
                            <div className='h-full w-1/2'>
                                    <Box
                                        width="100%"
                                        height="100%"
                                        overflow="auto"
                                        bg="gray.800"
                                        color="white"
                                        p={4}
                                        >
                                        <OutputInput output={output} input={input} setInput={setInput} error={error} role={role} socketRef={socketRef} roomId={roomId} />
                                    </Box>
                            </div>
                        </div>
                    </div>
            //     </ClientSideSuspense>
            //     </RoomProvider>
            // </LiveblocksProvider>
  )
}

export default EditorPage
