# 🚀 ChatzOne Backend Deployment Guide

## 📋 Prerequisites

Before deploying ChatzOne, ensure you have:

- **Node.js** 18+ installed
- **PostgreSQL** 12+ database
- **Redis** 6+ server
- **Git** for version control

## 🔧 Quick Start (Local Development)

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd chat-app
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Required - Update these
DATABASE_URL=postgresql://username:password@localhost:5432/chatzone
JWT_SECRET=your-super-secure-jwt-secret-change-this
REDIS_URL=redis://localhost:6379

# Optional - Add as needed
GOOGLE_CLIENT_ID=your-google-client-id
STRIPE_SECRET_KEY=sk_test_your-stripe-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
```

### 3. Database Setup
```bash
# Create database
createdb chatzone

# Run migrations
npm run migrate
```

### 4. Test Backend
```bash
# Run component tests
node test-backend.js

# Should show 100% success rate
```

### 5. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

## 🐳 Docker Deployment

### Quick Docker Setup
```bash
# Using Docker Compose (includes PostgreSQL & Redis)
docker-compose up -d

# The setup script will handle environment variables
chmod +x scripts/setup.sh
./scripts/setup.sh --docker
```

### Manual Docker Build
```bash
# Build image
docker build -t chatzone-backend .

# Run with external database
docker run -p 5000:5000 --env-file .env chatzone-backend
```

## ☁️ Cloud Deployment

### Railway Deployment
1. **Connect Repository**
   - Go to [Railway](https://railway.app)
   - Connect your GitHub repository
   - Select this backend folder

2. **Add Services**
   ```bash
   # Add PostgreSQL
   railway add postgresql
   
   # Add Redis
   railway add redis
   ```

3. **Environment Variables**
   - Copy variables from `.env.example`
   - Set in Railway dashboard
   - Update `DATABASE_URL` and `REDIS_URL` from Railway

4. **Deploy**
   ```bash
   railway up
   ```

### Render Deployment
1. **Create Web Service**
   - Connect GitHub repository
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Add Database**
   - Create PostgreSQL service
   - Copy connection string to `DATABASE_URL`

3. **Add Redis**
   - Create Redis service
   - Copy connection string to `REDIS_URL`

### Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

## 🔐 Production Configuration

### Required Environment Variables
```env
# Core
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=your-secure-secret

# Security
FRONTEND_URL=https://your-frontend-domain.com
ADMIN_EMAILS=admin@yourdomain.com
```

### Optional Services (Enable as needed)
```env
# OAuth
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret
FACEBOOK_APP_ID=your-facebook-id

# Payments
STRIPE_SECRET_KEY=sk_live_your-live-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# File Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# AI Features
OPENAI_API_KEY=sk-your-openai-key

# Translation
GOOGLE_TRANSLATE_API_KEY=your-translate-key

# Push Notifications
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
```

## 📊 Health Checks

### Backend Status
```bash
# Check if server is running
curl http://localhost:5000/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45,
  "services": {
    "database": "connected",
    "redis": "connected"
  }
}
```

### Component Tests
```bash
# Run comprehensive tests
node test-backend.js

# Should show 15/15 components passing
```

## 🛠️ Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql $DATABASE_URL

# Run migrations
npm run migrate
```

#### Redis Connection Failed
```bash
# Check Redis is running
redis-cli ping

# Should return PONG
```

#### Firebase Errors
```bash
# Firebase is optional - app works without it
# Check FIREBASE_PRIVATE_KEY format:
# - Must be valid PEM format
# - Include \n characters properly
# - Wrap in quotes in .env file
```

#### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### Performance Optimization

#### Production Settings
```env
NODE_ENV=production
LOG_LEVEL=error
RATE_LIMIT_MAX_REQUESTS=1000
BCRYPT_ROUNDS=12
```

#### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_matches_users ON matches(user1_id, user2_id);
```

## 📈 Monitoring

### Logs
```bash
# View logs
tail -f logs/app.log

# Or use PM2 for production
npm install -g pm2
pm2 start server.js --name chatzone-backend
pm2 logs chatzone-backend
```

### Analytics Endpoints
- `GET /api/admin/analytics` - User and message statistics
- `GET /api/admin/health` - System health metrics
- `GET /api/admin/logs` - Recent application logs

## 🔄 Updates

### Updating the Backend
```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Run migrations
npm run migrate

# Restart server
pm2 restart chatzone-backend
```

## 🌟 Features Included

✅ **Real-time Chat** - Socket.io with message history  
✅ **User Authentication** - JWT + Google/Facebook OAuth  
✅ **AI Matching** - OpenAI-powered compatibility scoring  
✅ **Coin System** - Stripe payments with transaction history  
✅ **File Uploads** - Images, voice, video via Cloudinary  
✅ **Push Notifications** - Firebase Cloud Messaging  
✅ **Multi-language** - Google Translate API integration  
✅ **Admin Dashboard** - User management and analytics  
✅ **Security** - Rate limiting, input validation, CORS  
✅ **Docker Ready** - Complete containerization setup  

## 🆘 Support

If you encounter issues:

1. **Check the logs** for error details
2. **Run the test script** to verify components
3. **Verify environment variables** are set correctly
4. **Check external service status** (database, Redis, APIs)

The backend is designed to work gracefully even if optional services (Firebase, OpenAI, etc.) are not configured.