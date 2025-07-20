# ChatzOne - Real-time Social Chat App

ChatzOne is a comprehensive real-time social chat application with AI-powered matching, video/voice calls, translation, and a coin-based monetization system.

## 🚀 Features

### Core Features
- **Real-time Chat**: Text, voice, video, and media messaging with Socket.io
- **AI-Powered Matching**: Smart user matching based on interests and behavior
- **Video/Voice Calls**: WebRTC-powered calling system
- **Multi-language Support**: Auto-translation with Google Translate API
- **Coin System**: Monetization through virtual coins for premium features
- **Push Notifications**: Firebase-powered notifications

### Authentication
- Email/Password registration and login
- Google OAuth integration
- Facebook OAuth support (configurable)
- JWT-based session management with refresh tokens
- Password reset functionality

### User Features
- Comprehensive user profiles with photos
- Privacy settings and blocking/reporting
- Location-based matching
- Interest-based filtering
- Premium subscriptions
- Daily login rewards and streak tracking

### Admin Features
- User management dashboard
- Coin transaction monitoring
- Content moderation tools
- Analytics and reporting

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** for primary database
- **Redis** for sessions and real-time features
- **Socket.io** for real-time communication
- **Knex.js** for database migrations and queries

### Services & APIs
- **Google Translate API** for message translation
- **Firebase Admin SDK** for push notifications
- **Cloudinary** for image uploads and processing
- **Stripe** for payment processing
- **OpenAI API** for AI matching (optional)

### Security & Monitoring
- **JWT** for authentication
- **bcrypt** for password hashing
- **Helmet** for security headers
- **Rate limiting** and request validation
- **Winston** for comprehensive logging

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- Redis 6+
- npm or yarn

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd chatzone-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Copy the environment template and configure your settings:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/chatzone
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# OpenAI Configuration (Optional)
OPENAI_API_KEY=sk-your-openai-api-key

# Google Translate API
GOOGLE_TRANSLATE_API_KEY=your-google-translate-api-key

# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-firebase-private-key\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-firebase-client-email

# Coins System
DAILY_LOGIN_COINS=10
MESSAGE_COST_COINS=1
VIDEO_CALL_COST_COINS=5
VOICE_CALL_COST_COINS=3
```

### 4. Database Setup
Create your PostgreSQL database and run migrations:
```bash
# Create database
createdb chatzone

# Run migrations
npm run migrate

# Optional: Run seeds
npm run seed
```

### 5. Start the Application

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## 🔧 API Documentation

### Authentication Endpoints

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "username": "johndoe",
  "display_name": "John Doe",
  "date_of_birth": "1995-01-15",
  "gender": "male",
  "location": "New York, NY",
  "interests": ["music", "travel", "technology"],
  "bio": "Love to travel and meet new people"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

#### Google OAuth
```http
POST /api/auth/google
Content-Type: application/json

{
  "token": "google-id-token"
}
```

### User Management

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <jwt-token>
```

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "display_name": "John Smith",
  "bio": "Updated bio",
  "interests": ["photography", "hiking"]
}
```

#### Upload Profile Picture
```http
POST /api/users/profile-picture
Authorization: Bearer <jwt-token>
Content-Type: multipart/form-data

image: <image-file>
```

### Chat & Messaging

#### Get Conversations
```http
GET /api/chat/conversations
Authorization: Bearer <jwt-token>
```

#### Get Messages
```http
GET /api/chat/conversations/:conversationId/messages
Authorization: Bearer <jwt-token>
```

#### Send Message (via Socket.io)
```javascript
socket.emit('send_message', {
  conversationId: 'conversation-uuid',
  content: 'Hello there!',
  type: 'text'
});
```

### Matching System

#### Get Potential Matches
```http
GET /api/matching/discover
Authorization: Bearer <jwt-token>
```

#### Like/Pass User
```http
POST /api/matching/action
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "targetUserId": "user-uuid",
  "action": "like" // or "pass"
}
```

### Coins System

#### Get Coin Balance
```http
GET /api/coins/balance
Authorization: Bearer <jwt-token>
```

#### Purchase Coins
```http
POST /api/coins/purchase
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "package": "small", // small, medium, large
  "paymentMethod": "stripe"
}
```

## 🔌 Socket.io Events

### Client to Server Events

- `join_conversations` - Join user's active conversations
- `send_message` - Send a message
- `mark_messages_read` - Mark messages as read
- `start_typing` - Start typing indicator
- `stop_typing` - Stop typing indicator
- `initiate_video_call` - Start video/voice call
- `accept_call` - Accept incoming call
- `reject_call` - Reject incoming call
- `end_call` - End active call

### Server to Client Events

- `new_message` - Receive new message
- `message_sent` - Message delivery confirmation
- `messages_read` - Messages read by recipient
- `user_typing` - User typing indicator
- `incoming_call` - Incoming call notification
- `call_accepted` - Call accepted
- `call_rejected` - Call rejected
- `call_ended` - Call ended

## 🚀 Deployment

### Environment Setup

1. **Production Environment Variables**
   - Set `NODE_ENV=production`
   - Use strong JWT secrets
   - Configure production database URLs
   - Set up proper CORS origins

2. **Database Migration**
   ```bash
   npm run migrate
   ```

### Deployment Platforms

#### Railway
1. Connect your GitHub repository
2. Add environment variables
3. Deploy automatically

#### Render
1. Create new web service
2. Connect repository
3. Add environment variables
4. Deploy

#### AWS/DigitalOcean
1. Set up server instance
2. Install Node.js, PostgreSQL, Redis
3. Clone repository and install dependencies
4. Configure PM2 for process management
5. Set up reverse proxy with Nginx

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis
  
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: chatzone
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **JWT Secrets**: Use strong, unique secrets in production
3. **Rate Limiting**: Configured for API protection
4. **Input Validation**: All inputs are validated and sanitized
5. **CORS**: Configure allowed origins properly
6. **HTTPS**: Always use HTTPS in production
7. **Database**: Use connection pooling and prepared statements

## 📊 Monitoring & Logging

- **Winston**: Structured logging to files and console
- **Health Check**: `/health` endpoint for monitoring
- **Error Tracking**: Comprehensive error logging
- **Performance**: Database query optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check PostgreSQL is running
   - Verify DATABASE_URL format
   - Ensure database exists

2. **Redis Connection Error**
   - Check Redis is running
   - Verify REDIS_URL format

3. **Socket.io Connection Issues**
   - Check CORS configuration
   - Verify client connection URL
   - Check firewall settings

4. **File Upload Issues**
   - Verify Cloudinary credentials
   - Check file size limits
   - Ensure proper file types

### Getting Help

- Check the logs in the `logs/` directory
- Enable debug mode with `NODE_ENV=development`
- Check database connectivity
- Verify all environment variables are set

## 🎯 Next Steps

After setting up the backend, you can:

1. **Frontend Development**: Build React Native app or web client
2. **Testing**: Add comprehensive test suite
3. **CI/CD**: Set up automated deployment pipeline
4. **Monitoring**: Add APM tools like New Relic or DataDog
5. **Scaling**: Implement horizontal scaling and load balancing

---

**Happy Coding! 🚀**

For more information or support, please check the documentation or create an issue in the repository.