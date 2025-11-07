import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { AppLayout } from './components/AppLayout'
import { LoginForm } from './components/LoginForm'
import { SignUpForm } from './components/SignUpForm'
import { LoadingSpinner } from './components/LoadingSpinner'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-wa-dark-primary flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={!user ? <LoginForm /> : <Navigate to="/" replace />}
      />
      <Route
        path="/signup"
        element={!user ? <SignUpForm /> : <Navigate to="/" replace />}
      />
      <Route
        path="/"
        element={user ? <AppLayout /> : <Navigate to="/login" replace />}
      />
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  )
}

export default App