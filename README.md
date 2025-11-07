# WhatsApp Clone

A full-stack, responsive WhatsApp Web clone built with React, Node.js, Supabase, and Socket.io.

## Features

- 🚀 **Real-time Messaging**: Instant message delivery with Socket.io
- 👥 **One-on-One & Group Chats**: Create and manage conversations
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- 🌙 **Dark Mode**: WhatsApp-inspired dark theme with light mode option
- 🔐 **Authentication**: Secure email/password authentication with Supabase
- 📎 **File Sharing**: Share images and files up to 10MB
- 😊 **Emoji Picker**: Rich emoji support in messages
- ✅ **Read Receipts**: Message read status tracking
- 🟢 **Online Status**: Real-time online/offline indicators
- 📱 **PWA Support**: Install as a native app
- 🔍 **Search**: Find users and search through messages
- 💾 **Offline Support**: Chat history available offline

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Socket.io Client** for real-time communication
- **Supabase** for authentication and database
- **React Query** for data fetching
- **Zustand** for state management
- **React Hook Form** for form handling

### Backend
- **Node.js** with Express
- **Socket.io** for real-time events
- **Supabase** as database and auth provider
- **TypeScript** for type safety
- **Winston** for logging
- **Joi** for validation

### Database
- **Supabase PostgreSQL** with RLS (Row Level Security)
- **Realtime subscriptions** for live updates
- **Storage** for file attachments

## Project Structure

```
whatsapp-clone/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/            # Page components
│   │   ├── hooks/            # Custom React hooks
│   │   ├── context/          # React context providers
│   │   ├── services/         # API and external services
│   │   ├── utils/            # Utility functions
│   │   ├── styles/           # Global styles and themes
│   │   └── types/            # TypeScript type definitions
│   ├── public/
│   │   ├── manifest.json     # PWA manifest
│   │   └── icons/           # PWA app icons
│   └── package.json
├── server/                     # Node.js backend
│   ├── src/
│   │   ├── routes/           # API route handlers
│   │   ├── middleware/       # Express middleware
│   │   ├── services/         # Business logic services
│   │   ├── socket/           # Socket.io handlers
│   │   ├── config/           # Configuration files
│   │   └── utils/            # Server utilities
│   └── package.json
├── database/                   # Database setup
│   └── migrations/           # Supabase migration files
├── shared/                     # Shared resources
│   ├── types/                # Shared TypeScript types
│   └── constants/            # Shared constants
└── docs/                       # Documentation
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Git

### 1. Clone the Repository

```bash
git clone <repository-url>
cd whatsapp-clone
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 3. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the database migrations in the `database/migrations/` folder
3. Set up storage bucket for file attachments
4. Configure authentication settings

### 4. Environment Variables

#### Client Environment Variables

Create `client/.env`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

#### Server Environment Variables

Create `server/.env`:

```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# Authentication
JWT_SECRET=your_jwt_secret_key_here

# Server
PORT=3001
NODE_ENV=development

# Socket.io
SOCKET_CORS_ORIGIN=http://localhost:5173

# File Upload
MAX_FILE_SIZE=10485760  # 10MB

# Logging
LOG_LEVEL=info
```

### 5. Run the Application

```bash
# From the root directory, run both client and server
npm run dev

# Or run them separately:
npm run dev:client  # Runs on http://localhost:5173
npm run dev:server  # Runs on http://localhost:3001
```

### 6. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## Database Schema

### Core Tables

#### `profiles`
- Extends Supabase auth.users with profile information
- Fields: display_name, avatar_url, status, last_seen

#### `chats`
- Chat information for both one-on-one and group chats
- Fields: name, is_group, created_by, avatar_url

#### `chat_participants`
- Many-to-many relationship between users and chats
- Fields: chat_id, user_id, role, last_read_at

#### `messages`
- Message content and metadata
- Fields: chat_id, sender_id, content, message_type, file_url, reply_to_id

#### `message_read_receipts`
- Track which messages have been read by which users
- Fields: message_id, user_id, read_at

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - User logout

### Chats
- `GET /api/chats` - Get user's chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/:id` - Get chat details
- `GET /api/chats/:id/messages` - Get chat messages
- `POST /api/chats/:id/messages` - Send message
- `POST /api/chats/:id/messages/upload` - Upload file
- `POST /api/chats/:id/read` - Mark messages as read

## Socket.io Events

### Client to Server
- `user:online` - User came online
- `user:offline` - User went offline
- `user:typing` - User is typing
- `user:stop_typing` - User stopped typing
- `join_chat` - Join chat room
- `leave_chat` - Leave chat room
- `messages:read` - Mark messages as read

### Server to Client
- `user:status_changed` - User online/offline status change
- `user:typing` - User is typing in chat
- `user:stop_typing` - User stopped typing
- `message:delivered` - Message delivered notification
- `messages:read` - Messages read notification

## Features in Detail

### Real-time Messaging
- Hybrid approach: Socket.io for instant events, Supabase Realtime for message sync
- Typing indicators, online status, read receipts
- Message delivery confirmations

### Authentication
- Email/password authentication with Supabase
- JWT tokens for secure API access
- Profile management with avatar upload
- Session persistence with "remember me"

### File Sharing
- Support for images and documents
- 10MB file size limit
- Secure storage with Supabase Storage
- File type validation

### Responsive Design
- Mobile-first approach
- Breakpoint system: mobile (<768px), tablet (768px-1023px), desktop (≥1024px)
- Touch-friendly interface
- Adaptive layouts for different screen sizes

### PWA Features
- Service worker for offline functionality
- App manifest for installation
- Cached resources for fast loading
- Background sync for offline messages

## Development

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting (recommended)
- Conventional commits for git messages

### Testing
- Unit tests with Jest
- Integration tests with Supertest
- E2E tests with Playwright (planned)

### Performance
- Code splitting for faster initial load
- Lazy loading for chat data
- Image optimization
- Efficient real-time subscriptions

## Deployment

### Frontend (Vercel)
```bash
cd client
npm run build
# Deploy to Vercel
```

### Backend (Railway/Render)
```bash
cd server
npm run build
# Deploy to Railway/Render
```

### Environment Variables
Set all environment variables in your hosting platform:
- Supabase URLs and keys
- JWT secret
- CORS origins
- File upload limits

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is for educational purposes only.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.
