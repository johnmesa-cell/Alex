import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Chat from './pages/Chat.jsx';
import Settings from './pages/Settings.jsx';
import Profile from './pages/Profile.jsx';

function App() {
  return (
    <div className="app-root">
      <Navbar />
      <Routes>
        {/* Rutas públicas — sin sidebar */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rutas autenticadas — con sidebar via app-shell */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <div className="app-shell">
                <main className="app-main content-wrap">
                  <Chat />
                </main>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <div className="app-shell">
                <main className="app-main content-wrap">
                  <Settings />
                </main>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <div className="app-shell">
                <main className="app-main content-wrap">
                  <Profile />
                </main>
              </div>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
