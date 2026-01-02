# Railway Deployment Guide

## Why Railway for This Project

### Advantages for Custom Server + WebSockets
- **Custom Server Support:** Railway handles Node.js custom servers better than Vercel
- **WebSocket Support:** Native support for Socket.io without additional configuration
- **Automatic SSL:** HTTPS/WSS termination handled automatically
- **Simple Environment Variables:** Easy management for API keys
- **Cost Effective:** $5/month base tier sufficient for POC

### Railway vs Alternatives
| Feature | Railway | Vercel | Heroku | DigitalOcean |
|---------|---------|---------|---------|--------------|
| Custom Server | ✅ Native | ❌ Workarounds | ✅ Dynos | ✅ Complex Setup |
| WebSocket | ✅ Auto | ❌ Limited | ✅ Yes | ✅ Manual Config |
| Next.js | ✅ Optimized | ✅ Native | ❌ Manual | ❌ Manual |
| Cost (POC) | $5/month | $20+/month | $25+/month | $12+/month |

## Pre-Deployment Setup

### 1. Railway CLI Installation
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

### 2. Project Configuration
```bash
# Initialize Railway project
railway init

# Link to existing project (if already created in web)
railway link [PROJECT_ID]
```

### 3. Environment Variables Setup
```bash
# Set environment variables
railway variables set DEEPGRAM_API_KEY=your_key_here
railway variables set OPENAI_API_KEY=your_key_here
railway variables set NODE_ENV=production
railway variables set PORT=3000

# For Twilio (Phase 2)
railway variables set TWILIO_ACCOUNT_SID=your_sid
railway variables set TWILIO_AUTH_TOKEN=your_token
```

## Deployment Configuration

### 1. Railway Configuration File
Create `railway.json` in project root:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2. Package.json Scripts
Ensure these scripts are in `package.json`:
```json
{
  "scripts": {
    "build": "next build",
    "start": "node server.js",
    "dev": "node server.js",
    "test": "vitest",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  }
}
```

### 3. Health Check Endpoint
Create `app/api/health/route.ts`:
```typescript
export async function GET() {
  return Response.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.RAILWAY_GIT_COMMIT_SHA || 'unknown'
  });
}
```

## Production Server Configuration

### 1. Enhanced server.js for Production
```javascript
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Socket.io with production settings
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? [process.env.FRONTEND_URL] 
        : ["http://localhost:3000"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Production error handling
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
```

### 2. Production Environment Variables
```bash
# Required for production
NODE_ENV=production
PORT=3000

# API Keys (set via Railway dashboard)
DEEPGRAM_API_KEY=your_production_key
OPENAI_API_KEY=your_production_key

# Optional: Frontend URL for CORS
FRONTEND_URL=https://your-app.railway.app

# Logging level
LOG_LEVEL=info
```

## Deployment Steps

### Step 1: Initial Deployment
```bash
# Deploy to Railway
railway up

# Monitor deployment
railway logs

# Check deployment status
railway status
```

### Step 2: Custom Domain (Optional)
```bash
# Add custom domain via Railway dashboard
# Configure DNS records:
# CNAME: your-domain.com -> your-app.railway.app
# A: @ -> Railway IP (provided in dashboard)
```

### Step 3: SSL Configuration
- Railway automatically provides SSL certificates
- HTTPS/WSS termination handled at edge
- No additional configuration needed

## Environment-Specific Configurations

### Development
```javascript
// server.js - dev-specific settings
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"],
    credentials: true
  },
  // More permissive settings for development
  transports: ['websocket', 'polling']
});
```

### Production
```javascript
// server.js - production-specific settings
const io = new Server(server, {
  cors: {
    origin: [process.env.FRONTEND_URL],
    credentials: true
  },
  // Optimized for production
  transports: ['websocket'],
  pingTimeout: 60000,
  pingInterval: 25000
});
```

## Monitoring & Logging

### Railway Built-in Monitoring
- **Metrics:** CPU, Memory, Network usage
- **Logs:** Real-time application logs
- **Alerts:** Set up via Railway dashboard

### Application-Level Logging
```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  },
  error: (message: string, error?: Error, meta?: any) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      error: error?.message,
      stack: error?.stack,
      timestamp: new Date().toISOString(),
      ...meta
    }));
  }
};
```

### Socket.io Connection Monitoring
```javascript
// In server.js
io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });

  socket.on('disconnect', (reason) => {
    logger.info('Client disconnected', { 
      socketId: socket.id, 
      reason 
    });
  });

  socket.on('error', (error) => {
    logger.error('Socket error', error, { 
      socketId: socket.id 
    });
  });
});
```

## Scaling Considerations

### Single Server Limitations
- **Concurrent Users:** ~50-100 simultaneous calls
- **Memory:** 512MB should handle 50 connections
- **CPU:** Single core sufficient for POC

### Multi-Server Scaling (Future)
```javascript
// Redis adapter for Socket.io clustering
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

if (process.env.REDIS_URL) {
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();
  
  io.adapter(createAdapter(pubClient, subClient));
}
```

## Deployment Automation

### GitHub Actions (Optional)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway deploy --service your-service-id
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## Troubleshooting Common Issues

### 1. WebSocket Connection Failures
```javascript
// Debug WebSocket issues
io.engine.on("connection_error", (err) => {
  logger.error("WebSocket connection error", err);
});

// Check CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.FRONTEND_URL]
  : ["http://localhost:3000"];
```

### 2. Environment Variable Issues
```bash
# Check variables are set
railway variables

# Test locally with production variables
railway run npm start
```

### 3. Build Failures
```bash
# Check build logs
railway logs --tail

# Test build locally
npm run build
npm start
```

### 4. Performance Issues
```bash
# Monitor resource usage
railway metrics

# Check for memory leaks
# Add to server.js:
setInterval(() => {
  const used = process.memoryUsage();
  logger.info('Memory usage', {
    rss: Math.round(used.rss / 1024 / 1024) + 'MB',
    heapUsed: Math.round(used.heapUsed / 1024 / 1024) + 'MB'
  });
}, 30000);
```

## Cost Management

### Railway Pricing Tiers
- **Hobby:** $5/month - 512MB RAM, 1GB storage
- **Pro:** $20/month - 8GB RAM, 100GB storage  
- **Team:** Custom pricing

### Cost Optimization
1. **Start with Hobby tier** for POC
2. **Monitor resource usage** via dashboard
3. **Upgrade only when needed** (>80% memory usage)
4. **Set usage alerts** to avoid overages

### External API Costs (Not Railway)
- **Deepgram:** $0.0059/minute
- **OpenAI:** $0.03/1K tokens
- Monitor these separately via API provider dashboards