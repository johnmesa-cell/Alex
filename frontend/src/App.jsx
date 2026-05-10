import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Chat from './pages/Chat.jsx';
import Settings from './pages/Settings.jsx';
import Profile from './pages/Profile.jsx';
import Soporte from './pages/Soporte.jsx';
import Informacion from './pages/Informacion.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import NotFound from './pages/NotFound.jsx';

function App() {
  return (
    <div className="app-root">
      <Navbar />
      <Routes>
        {/* Públicas */}
        <Route path="/"                element={<Home />} />
        <Route path="/login"           element={<Login />} />
        <Route path="/register"        element={<Register />} />
        <Route path="/chat"            element={<Chat />} />
        <Route path="/soporte"         element={<Soporte />} />
        <Route path="/informacion"     element={<Informacion />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Settings — sin wrapper, ocupa todo */}
        <Route path="/settings" element={
          <ProtectedRoute><Settings /></ProtectedRoute>
        } />

        {/* Profile — sin wrapper, mismo layout que Settings */}
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
