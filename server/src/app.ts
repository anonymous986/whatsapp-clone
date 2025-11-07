import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import dotenv from 'dotenv'

import { logger } from './config/logger'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'

// Routes
import authRoutes from './routes/auth'
import chatRoutes from './routes/chats'

// Socket handlers
import { setupSocketHandlers } from './socket/socketHandlers'

// Load environment variables
dotenv.config()

const app = express()
const server = createServer(app)

// Setup Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})

// Setup socket handlers
setupSocketHandlers(io)

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
}))

// CORS configuration
app.use(cors({
  origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))

// Compression middleware
app.use(compression())

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  })
  next()
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  })
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/chats', chatRoutes)

// 404 handler
app.use(notFoundHandler)

// Error handling middleware
app.use(errorHandler)

// Create logs directory if it doesn't exist
import fs from 'fs'
import path from 'path'

const logsDir = path.join(process.cwd(), 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

export { app, server, io }