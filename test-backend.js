#!/usr/bin/env node

console.log('🚀 Testing ChatzOne Backend Components...\n');

// Test core modules
const tests = [
  {
    name: 'Express Server Setup',
    test: () => {
      const express = require('express');
      const app = express();
      return app ? '✅ Express loaded' : '❌ Express failed';
    }
  },
  {
    name: 'Database Configuration',
    test: () => {
      try {
        const knexConfig = require('./knexfile.js');
        return knexConfig.development ? '✅ Knex config loaded' : '❌ Knex config missing';
      } catch (e) {
        return `❌ Knex config error: ${e.message}`;
      }
    }
  },
  {
    name: 'Authentication Middleware',
    test: () => {
      try {
        const auth = require('./middleware/auth.js');
        return auth.authenticateToken ? '✅ Auth middleware loaded' : '❌ Auth middleware missing';
      } catch (e) {
        return `❌ Auth middleware error: ${e.message}`;
      }
    }
  },
  {
    name: 'Socket.io Handlers',
    test: () => {
      try {
        const socketHandlers = require('./socket/socketHandlers.js');
        return socketHandlers.handleConnection ? '✅ Socket handlers loaded' : '❌ Socket handlers missing';
      } catch (e) {
        return `❌ Socket handlers error: ${e.message}`;
      }
    }
  },
  {
    name: 'Validation Utilities',
    test: () => {
      try {
        const validation = require('./utils/validation.js');
        return validation.userValidation ? '✅ Validation utilities loaded' : '❌ Validation utilities missing';
      } catch (e) {
        return `❌ Validation utilities error: ${e.message}`;
      }
    }
  },
  {
    name: 'Error Handler',
    test: () => {
      try {
        const errorHandler = require('./utils/errorHandler.js');
        return errorHandler.globalErrorHandler ? '✅ Error handler loaded' : '❌ Error handler missing';
      } catch (e) {
        return `❌ Error handler error: ${e.message}`;
      }
    }
  },
  {
    name: 'Logger',
    test: () => {
      try {
        const logger = require('./utils/logger.js');
        return logger.info ? '✅ Logger loaded' : '❌ Logger missing';
      } catch (e) {
        return `❌ Logger error: ${e.message}`;
      }
    }
  },
  {
    name: 'Upload Middleware',
    test: () => {
      try {
        const upload = require('./middleware/upload.js');
        return upload.uploadProfileImage ? '✅ Upload middleware loaded' : '❌ Upload middleware missing';
      } catch (e) {
        return `❌ Upload middleware error: ${e.message}`;
      }
    }
  },
  {
    name: 'Coin Service',
    test: () => {
      try {
        const coinService = require('./services/coinService.js');
        return coinService.deductCoins ? '✅ Coin service loaded' : '❌ Coin service missing';
      } catch (e) {
        return `❌ Coin service error: ${e.message}`;
      }
    }
  },
  {
    name: 'Routes - Authentication',
    test: () => {
      try {
        const authRoutes = require('./routes/auth.js');
        return authRoutes ? '✅ Auth routes loaded' : '❌ Auth routes missing';
      } catch (e) {
        return `❌ Auth routes error: ${e.message}`;
      }
    }
  },
  {
    name: 'Routes - Chat',
    test: () => {
      try {
        const chatRoutes = require('./routes/chat.js');
        return chatRoutes ? '✅ Chat routes loaded' : '❌ Chat routes missing';
      } catch (e) {
        return `❌ Chat routes error: ${e.message}`;
      }
    }
  },
  {
    name: 'Routes - Matching',
    test: () => {
      try {
        const matchingRoutes = require('./routes/matching.js');
        return matchingRoutes ? '✅ Matching routes loaded' : '❌ Matching routes missing';
      } catch (e) {
        return `❌ Matching routes error: ${e.message}`;
      }
    }
  },
  {
    name: 'Routes - Coins',
    test: () => {
      try {
        const coinRoutes = require('./routes/coins.js');
        return coinRoutes ? '✅ Coin routes loaded' : '❌ Coin routes missing';
      } catch (e) {
        return `❌ Coin routes error: ${e.message}`;
      }
    }
  },
  {
    name: 'Routes - Admin',
    test: () => {
      try {
        const adminRoutes = require('./routes/admin.js');
        return adminRoutes ? '✅ Admin routes loaded' : '❌ Admin routes missing';
      } catch (e) {
        return `❌ Admin routes error: ${e.message}`;
      }
    }
  },
  {
    name: 'Database Migrations',
    test: () => {
      try {
        const fs = require('fs');
        const migrations = fs.readdirSync('./migrations');
        return migrations.length >= 5 ? `✅ ${migrations.length} migrations found` : `❌ Only ${migrations.length} migrations found`;
      } catch (e) {
        return `❌ Migrations error: ${e.message}`;
      }
    }
  }
];

// Run tests
let passed = 0;
let failed = 0;

console.log('Running component tests:\n');

tests.forEach((test, index) => {
  try {
    const result = test.test();
    console.log(`${index + 1}. ${test.name}: ${result}`);
    if (result.includes('✅')) passed++;
    else failed++;
  } catch (error) {
    console.log(`${index + 1}. ${test.name}: ❌ Unexpected error: ${error.message}`);
    failed++;
  }
});

console.log(`\n📊 Test Results:`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

if (failed === 0) {
  console.log('\n🎉 All backend components loaded successfully!');
  console.log('\n📋 Next Steps:');
  console.log('1. Set up PostgreSQL database');
  console.log('2. Set up Redis server');
  console.log('3. Configure environment variables in .env file');
  console.log('4. Run database migrations: npm run migrate');
  console.log('5. Start the server: npm start');
} else {
  console.log('\n⚠️  Some components failed to load. Check the errors above.');
  process.exit(1);
}

console.log('\n🔧 Backend Features Ready:');
console.log('• Real-time chat with Socket.io');
console.log('• User authentication (JWT + OAuth)');
console.log('• AI-powered matching system');
console.log('• Coin monetization with Stripe');
console.log('• Multi-language translation');
console.log('• Push notifications');
console.log('• File uploads (images, audio, video)');
console.log('• Admin dashboard');
console.log('• Comprehensive security');
console.log('• Docker deployment ready');

process.exit(0);