import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'

interface SocketContextType {
  socket: Socket | null
  connected: boolean
  emitTyping: (chatId: string) => void
  emitStopTyping: (chatId: string) => void
  emitOnline: () => void
  emitOffline: () => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: React.ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const { user, session } = useAuth()

  useEffect(() => {
    if (user && session) {
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001'

      const newSocket = io(socketUrl, {
        auth: {
          token: session.access_token,
          userId: user.id,
        },
        transports: ['websocket', 'polling'],
      })

      newSocket.on('connect', () => {
        console.log('Connected to socket server')
        setConnected(true)
        newSocket.emit('user:online')
      })

      newSocket.on('disconnect', () => {
        console.log('Disconnected from socket server')
        setConnected(false)
      })

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
        setConnected(false)
      })

      setSocket(newSocket)

      return () => {
        newSocket.emit('user:offline')
        newSocket.close()
      }
    } else {
      if (socket) {
        socket.close()
        setSocket(null)
        setConnected(false)
      }
    }
  }, [user, session])

  const emitTyping = (chatId: string) => {
    if (socket && connected) {
      socket.emit('user:typing', { chatId })
    }
  }

  const emitStopTyping = (chatId: string) => {
    if (socket && connected) {
      socket.emit('user:stop_typing', { chatId })
    }
  }

  const emitOnline = () => {
    if (socket && connected) {
      socket.emit('user:online')
    }
  }

  const emitOffline = () => {
    if (socket) {
      socket.emit('user:offline')
    }
  }

  const value = {
    socket,
    connected,
    emitTyping,
    emitStopTyping,
    emitOnline,
    emitOffline,
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}