import React from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Home from './pages/Home'
import Watch from './pages/Watch'
import Login from './pages/Login'
import Register from './pages/Register'
import Upload from './pages/Upload'
import Search from './pages/Search'
import Profile from './pages/Profile'

function WatchRouteWrapper() {
  const { id } = useParams()
  return <Watch key={id} />
}

export default function App(){
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#080A0C] text-white">
        <Navbar />
        <main className="max-w-[1780px] mx-auto px-4 py-8">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home/>} />
            <Route path="/watch/:id" element={<WatchRouteWrapper/>} />
            <Route path="/search" element={<Search/>} />
            <Route path="/login" element={<Login/>} />
            <Route path="/register" element={<Register/>} />

            {/* Protected Routes */}
            <Route 
              path="/upload" 
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  )
}
