import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Home from './pages/Home'
import EditorPage from './pages/EditorPage';
import Login from './pages/LoginPge';
import AuthGuard from './lib/authGuard.jsx';

function App() {

  return (
    <>
      <div>
        <Toaster 
          position='top-right' 
          toastOptions={{
            success: {
              theme: {
                primary: '#4aed88'
              }
            }
          }}
        ></Toaster>
      </div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route element={<AuthGuard />}>
              <Route path="/join-room" element={<Home />} />
              <Route path="/editor/:roomId" element={<EditorPage />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;

