import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Suspense, lazy } from 'react'

import Home from './pages/Home'
import Login from './pages/LoginPge'
import AuthGuard from './lib/authGuard.jsx'
import LoadingPage from './pages/LoadingPage.jsx'

const EditorPage = lazy(() => import('./pages/EditorPage'))

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          success: {
            theme: { primary: "#4aed88" }
          }
        }}
      />

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route element={<AuthGuard />}>
            <Route path="/join-room" element={<Home />} />

            <Route
              path="/editor/:roomId"
              element={
                <Suspense fallback={<LoadingPage message="Loading Editor Page" />}>
                  <EditorPage />
                </Suspense>
              }
            />
          </Route>

        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App