import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import { validateBody, validateParams, validateQuery } from '../middleware/validation'
import { asyncHandler } from '../middleware/errorHandler'
import { ChatService } from '../services/chatService'
import { MessageService } from '../services/messageService'
import Joi from 'joi'
import multer from 'multer'
import { supabase } from '../config/database'
import { logger } from '../config/logger'

const router = Router()

// Validation schemas
const createChatSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  isGroup: Joi.boolean().required(),
  participantIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
})

const sendMessageSchema = Joi.object({
  content: Joi.string().required(),
  messageType: Joi.string().valid('text', 'image', 'file').default('text'),
  fileUrl: Joi.string().uri().optional(),
  fileName: Joi.string().optional(),
  fileSize: Joi.number().integer().optional(),
  replyToId: Joi.string().uuid().optional(),
})

const chatIdSchema = Joi.object({
  chatId: Joi.string().uuid().required(),
})

const messagesQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(50),
  offset: Joi.number().integer().min(0).default(0),
})

const searchUsersSchema = Joi.object({
  q: Joi.string().min(1).max(100).required(),
})

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    // Allow images and common file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('File type not allowed'))
    }
  },
})

// All chat routes require authentication
router.use(authenticateToken)

// Get user's chats
router.get('/', asyncHandler(async (req: any, res) => {
  try {
    const userId = req.user.id
    const chats = await ChatService.getUserChats(userId)

    res.json({
      success: true,
      data: chats,
    })
  } catch (error) {
    logger.error('Error fetching user chats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chats',
    })
  }
}))

// Create new chat
router.post('/', validateBody(createChatSchema), asyncHandler(async (req: any, res) => {
  try {
    const userId = req.user.id
    const { name, isGroup, participantIds } = req.body

    // For one-on-one chats, check if chat already exists
    if (!isGroup && participantIds.length === 1) {
      const userChats = await ChatService.getUserChats(userId)
      const existingChat = userChats.find(chat =>
        !chat.is_group &&
        chat.participants.length === 1 &&
        chat.participants[0].id === participantIds[0]
      )

      if (existingChat) {
        return res.json({
          success: true,
          data: existingChat,
          message: 'Chat already exists',
        })
      }
    }

    const chat = await ChatService.createChat({
      name,
      isGroup,
      createdBy: userId,
      participantIds,
    })

    res.status(201).json({
      success: true,
      data: chat,
      message: 'Chat created successfully',
    })
  } catch (error) {
    logger.error('Error creating chat:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create chat',
    })
  }
}))

// Get specific chat details
router.get('/:chatId', validateParams(chatIdSchema), asyncHandler(async (req: any, res) => {
  try {
    const userId = req.user.id
    const { chatId } = req.params

    const chat = await ChatService.getChatById(chatId, userId)

    res.json({
      success: true,
      data: chat,
    })
  } catch (error) {
    logger.error('Error fetching chat:', error)
    if (error instanceof Error && error.message === 'Access denied') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      })
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat',
    })
  }
}))

// Get chat messages
router.get('/:chatId/messages', validateParams(chatIdSchema), validateQuery(messagesQuerySchema), asyncHandler(async (req: any, res) => {
  try {
    const userId = req.user.id
    const { chatId } = req.params
    const { limit, offset } = req.query

    const messages = await MessageService.getMessages(chatId, userId, Number(limit), Number(offset))

    res.json({
      success: true,
      data: messages,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        hasMore: messages.length === Number(limit),
      },
    })
  } catch (error) {
    logger.error('Error fetching messages:', error)
    if (error instanceof Error && error.message === 'Access denied') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      })
    }
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages',
    })
  }
}))

// Send message
router.post('/:chatId/messages', validateParams(chatIdSchema), validateBody(sendMessageSchema), asyncHandler(async (req: any, res) => {
  try {
    const userId = req.user.id
    const { chatId } = req.params
    const { content, messageType, fileUrl, fileName, fileSize, replyToId } = req.body

    const message = await MessageService.sendMessage({
      chatId,
      senderId: userId,
      content,
      messageType,
      fileUrl,
      fileName,
      fileSize,
      replyToId,
    })

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent successfully',
    })
  } catch (error) {
    logger.error('Error sending message:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to send message',
    })
  }
}))

// Upload file and send message
router.post('/:chatId/messages/upload', validateParams(chatIdSchema), upload.single('file'), asyncHandler(async (req: any, res) => {
  try {
    const userId = req.user.id
    const { chatId } = req.params
    const file = req.file
    const { replyToId } = req.body

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      })
    }

    // Upload file to Supabase Storage
    const fileExt = file.originalname.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `chat-files/${chatId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      })

    if (uploadError) {
      logger.error('Error uploading file:', uploadError)
      throw new Error('Failed to upload file')
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(filePath)

    // Determine message type based on file type
    const messageType = file.mimetype.startsWith('image/') ? 'image' : 'file'

    // Send message with file
    const message = await MessageService.sendMessage({
      chatId,
      senderId: userId,
      content: file.originalname,
      messageType,
      fileUrl: publicUrl,
      fileName: file.originalname,
      fileSize: file.size,
      replyToId,
    })

    res.status(201).json({
      success: true,
      data: message,
      message: 'File uploaded and message sent successfully',
    })
  } catch (error) {
    logger.error('Error uploading file:', error)
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload file',
    })
  }
}))

// Mark messages as read
router.post('/:chatId/read', validateParams(chatIdSchema), asyncHandler(async (req: any, res) => {
  try {
    const userId = req.user.id
    const { chatId } = req.params

    await MessageService.markChatAsRead(chatId, userId)

    res.json({
      success: true,
      message: 'Messages marked as read',
    })
  } catch (error) {
    logger.error('Error marking messages as read:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to mark messages as read',
    })
  }
}))

// Delete message
router.delete('/messages/:messageId', validateParams(Joi.object({ messageId: Joi.string().uuid().required() })), asyncHandler(async (req: any, res) => {
  try {
    const userId = req.user.id
    const { messageId } = req.params

    await MessageService.deleteMessage(messageId, userId)

    res.json({
      success: true,
      message: 'Message deleted successfully',
    })
  } catch (error) {
    logger.error('Error deleting message:', error)
    if (error instanceof Error && error.message === 'Access denied') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      })
    }
    res.status(500).json({
      success: false,
      error: 'Failed to delete message',
    })
  }
}))

// Add participant to group chat
router.post('/:chatId/participants', validateParams(chatIdSchema), validateBody(Joi.object({
  userId: Joi.string().uuid().required(),
})), asyncHandler(async (req: any, res) => {
  try {
    const userId = req.user.id
    const { chatId } = req.params
    const { userId: newUserId } = req.body

    await ChatService.addParticipant(chatId, userId, newUserId)

    res.json({
      success: true,
      message: 'Participant added successfully',
    })
  } catch (error) {
    logger.error('Error adding participant:', error)
    if (error instanceof Error && error.message === 'Access denied') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      })
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add participant',
    })
  }
}))

// Remove participant from group chat
router.delete('/:chatId/participants/:userId', validateParams(Joi.object({
  chatId: Joi.string().uuid().required(),
  userId: Joi.string().uuid().required(),
})), asyncHandler(async (req: any, res) => {
  try {
    const userId = req.user.id
    const { chatId, userId: targetUserId } = req.params

    await ChatService.removeParticipant(chatId, userId, targetUserId)

    res.json({
      success: true,
      message: 'Participant removed successfully',
    })
  } catch (error) {
    logger.error('Error removing participant:', error)
    if (error instanceof Error && error.message === 'Access denied') {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      })
    }
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove participant',
    })
  }
}))

// Leave chat
router.post('/:chatId/leave', validateParams(chatIdSchema), asyncHandler(async (req: any, res) => {
  try {
    const userId = req.user.id
    const { chatId } = req.params

    await ChatService.leaveChat(chatId, userId)

    res.json({
      success: true,
      message: 'Left chat successfully',
    })
  } catch (error) {
    logger.error('Error leaving chat:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to leave chat',
    })
  }
}))

// Search users
router.get('/search/users', validateQuery(searchUsersSchema), asyncHandler(async (req: any, res) => {
  try {
    const userId = req.user.id
    const { q } = req.query

    const users = await ChatService.searchUsers(String(q), userId)

    res.json({
      success: true,
      data: users,
    })
  } catch (error) {
    logger.error('Error searching users:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to search users',
    })
  }
}))

// Get unread message count
router.get('/unread/count', asyncHandler(async (req: any, res) => {
  try {
    const userId = req.user.id

    const result = await MessageService.getUnreadCount(userId)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    logger.error('Error getting unread count:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get unread count',
    })
  }
}))

export default router