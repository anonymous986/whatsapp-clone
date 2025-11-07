import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { supabase } from '../config/database'
import { validateBody } from '../middleware/validation'
import { asyncHandler } from '../middleware/errorHandler'
import Joi from 'joi'
import { logger } from '../config/logger'

const router = Router()

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
})

const signUpSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  displayName: Joi.string().min(2).max(50).required(),
})

const updateProfileSchema = Joi.object({
  display_name: Joi.string().min(2).max(50).optional(),
  avatar_url: Joi.string().uri().optional(),
})

// Generate JWT token
const generateToken = (userId: string) => {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured')
  }

  return jwt.sign({ userId }, jwtSecret, { expiresIn: '7d' })
}

// Sign up / Register
router.post('/signup', validateBody(signUpSchema), asyncHandler(async (req, res) => {
  const { email, password, displayName } = req.body

  try {
    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        return res.status(400).json({ error: 'Email already registered' })
      }
      return res.status(400).json({ error: error.message })
    }

    // If user created but email confirmation required
    if (data.user && !data.session) {
      return res.status(201).json({
        message: 'Account created successfully. Please check your email to verify your account.',
        requiresEmailConfirmation: true
      })
    }

    // If session created (email confirmation not required)
    if (data.user && data.session) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          display_name: displayName,
        })

      if (profileError) {
        logger.error('Error creating user profile:', profileError)
        return res.status(500).json({ error: 'Failed to create user profile' })
      }

      // Generate JWT token
      const token = generateToken(data.user.id)

      res.status(201).json({
        message: 'Account created successfully',
        user: {
          id: data.user.id,
          email: data.user.email,
          display_name: displayName,
        },
        token,
      })
    }
  } catch (error) {
    logger.error('Signup error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

// Sign in / Login
router.post('/login', validateBody(loginSchema), asyncHandler(async (req, res) => {
  const { email, password } = req.body

  try {
    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return res.status(401).json({ error: 'Invalid email or password' })
      }
      if (error.message.includes('Email not confirmed')) {
        return res.status(401).json({ error: 'Please check your email to verify your account' })
      }
      return res.status(400).json({ error: error.message })
    }

    if (!data.user) {
      return res.status(401).json({ error: 'Authentication failed' })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('display_name, avatar_url, status')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      logger.error('Error fetching user profile:', profileError)
      // Create profile if it doesn't exist
      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          display_name: data.user.user_metadata?.display_name || email.split('@')[0],
        })

      if (createError) {
        logger.error('Error creating user profile:', createError)
        return res.status(500).json({ error: 'Failed to load user profile' })
      }
    }

    // Update last seen and status
    await supabase
      .from('profiles')
      .update({
        status: 'online',
        last_seen: new Date().toISOString()
      })
      .eq('id', data.user.id)

    // Generate JWT token
    const token = generateToken(data.user.id)

    res.json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        display_name: profile?.display_name || data.user.user_metadata?.display_name || email.split('@')[0],
        avatar_url: profile?.avatar_url || null,
        status: profile?.status || 'online',
      },
      token,
    })
  } catch (error) {
    logger.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}))

// Get current user profile
router.get('/profile', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured')
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string }

    // Get user profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, status, last_seen')
      .eq('id', decoded.userId)
      .single()

    if (error || !profile) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Get user email from auth.users
    const { data: authUser } = await supabase.auth.admin.getUserById(decoded.userId)

    res.json({
      id: profile.id,
      email: authUser.user?.email,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      status: profile.status,
      last_seen: profile.last_seen,
    })
  } catch (error) {
    logger.error('Get profile error:', error)
    res.status(403).json({ error: 'Invalid token' })
  }
}))

// Update user profile
router.put('/profile', validateBody(updateProfileSchema), asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured')
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string }
    const { display_name, avatar_url } = req.body

    // Update profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        display_name,
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', decoded.userId)
      .select()
      .single()

    if (error) {
      logger.error('Error updating profile:', error)
      return res.status(500).json({ error: 'Failed to update profile' })
    }

    // Also update user metadata if display name changed
    if (display_name) {
      await supabase.auth.updateUser({
        data: { display_name }
      })
    }

    res.json({
      message: 'Profile updated successfully',
      profile,
    })
  } catch (error) {
    logger.error('Update profile error:', error)
    res.status(403).json({ error: 'Invalid token' })
  }
}))

// Sign out / Logout
router.post('/logout', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (token) {
    try {
      const jwtSecret = process.env.JWT_SECRET
      if (jwtSecret) {
        const decoded = jwt.verify(token, jwtSecret) as { userId: string }

        // Update user status to offline
        await supabase
          .from('profiles')
          .update({
            status: 'offline',
            last_seen: new Date().toISOString()
          })
          .eq('id', decoded.userId)
      }
    } catch (error) {
      logger.error('Logout error:', error)
    }
  }

  res.json({ message: 'Logout successful' })
}))

export default router