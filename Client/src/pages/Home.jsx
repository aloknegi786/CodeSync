import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import {v4 as uuidV4} from 'uuid';
import toast from 'react-hot-toast';

function Home() {
    const navigate = useNavigate();

    const [roomId, setRoomId] = useState(null);
    const [username, setUsername] = useState('');

    const createNewRoom = (e) => {
        e.preventDefault();
        const id = uuidV4();
        setRoomId(id);
        toast.success("Created a new room");
    };

    const joinRoom = () => {
        if(!roomId || !username){
            toast.error("ROOM ID & username is required");
            return ;
        }

        // redirect
        navigate(`/editor/${roomId}`,{
            state: {
                username,
            },
        }
        )
    }

    const handleInputEnter = (e) => {
        if(e.code === 'Enter'){
            joinRoom();
        }
    }

  return (
    <div className='homePageWrapper'>
        <div className='formWrapper'>
            <img src="/code-sync-logo.png" alt="code-sync-logo" className='code-sync-logo' />
            <h4 className='mainLabel'>Paste invitation RoomId</h4>
            <div className='inputGroup'>
                <input 
                    type="text" 
                    className='inputBox' 
                    placeholder='ROOMID'
                    onChange={(e) => {
                        setRoomId(e.target.value)
                    }}
                    value={roomId}
                    onKeyUp={handleInputEnter}
                />
                <input 
                    type="text" 
                    className='inputBox' 
                    placeholder='User-name'
                    onChange={(e) => {
                        setUsername(e.target.value)
                    }}
                    value={username}
                    onKeyUp={handleInputEnter}
                />

                <button className='btn joinBtn' onClick={joinRoom}>Join</button>
                <span className='createInfo'>
                    If you don't have an invite then create &nbsp;
                    <a onClick={createNewRoom} href="" className='createNewBtn'>
                        new room
                    </a>
                </span>
            </div>
        </div>

        <footer>
            <h4>
                Built with 💛 by <a href="https://github.com/aloknegi786">Alok Negi</a>
            </h4>
        </footer>
    </div>
  )
}

export default Home
