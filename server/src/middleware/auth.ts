import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { supabase } from '../config/database'
import { logger } from '../config/logger'

interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    display_name: string
  }
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' })
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured')
    }

    // Verify JWT token
    const decoded = jwt.verify(token, jwtSecret) as { userId: string }

    // Get user from Supabase
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, display_name')
      .eq('id', decoded.userId)
      .single()

    if (error || !profile) {
      return res.status(401).json({ error: 'Invalid token or user not found' })
    }

    // Get user email from auth.users
    const { data: authUser } = await supabase.auth.admin.getUserById(decoded.userId)

    if (!authUser.user) {
      return res.status(401).json({ error: 'User not found' })
    }

    req.user = {
      id: profile.id,
      email: authUser.user.email || '',
      display_name: profile.display_name,
    }

    next()
  } catch (error) {
    logger.error('Authentication error:', error)
    return res.status(403).json({ error: 'Invalid token' })
  }
}

export const authenticateSocket = async (token: string) => {
  try {
    if (!token) {
      throw new Error('No token provided')
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured')
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string }

    // Get user from Supabase
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, display_name')
      .eq('id', decoded.userId)
      .single()

    if (error || !profile) {
      throw new Error('Invalid token or user not found')
    }

    return {
      id: profile.id,
      display_name: profile.display_name,
    }
  } catch (error) {
    logger.error('Socket authentication error:', error)
    throw error
  }
}