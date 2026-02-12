# WatchNest - Complete Setup & Production Guide

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Local Development Setup](#local-development-setup)
3. [Production Deployment](#production-deployment)
4. [Docker Deployment](#docker-deployment)
5. [Troubleshooting](#troubleshooting)

---

## Project Overview

**WatchNest** is a full-stack video streaming platform with:

### Backend (Express.js + MongoDB)
- User authentication & JWT
- Video upload & streaming
- Comments system
- Playlists & subscriptions
- Like system
- Cloudinary integration

### Frontend (React + Vite)
- Clean, modern UI
- Video discovery & search
- Authentication flows
- Video player with comments
- User profiles
- Upload interface

---

## Local Development Setup

### Prerequisites

```bash
# Check Node.js version
node --version  # Should be 16+

# Check npm version
npm --version   # Should be 8+
```

### Step 1: Backend Setup

```bash
cd Backend/Project

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update .env with your values:
# - MongoDB URI
# - Cloudinary credentials
# - JWT secrets
```

#### MongoDB Setup (Local)

**Option A: Local MongoDB**
```bash
# Install MongoDB Community Edition
# macOS: brew install mongodb-community
# Windows: Download from https://www.mongodb.com/try/download/community

# Start MongoDB
mongod

# In another terminal, test connection
mongosh
```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Get connection string
5. Update `MONGODB_URI` in `.env`

#### Cloudinary Setup

1. Create account at https://cloudinary.com
2. Get credentials from dashboard
3. Update these in `.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

#### Start Backend

```bash
npm run dev
# Backend runs on http://localhost:8000
```

### Step 2: Frontend Setup

```bash
cd WatchNest

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Ensure this in .env:
VITE_API_BASE=http://localhost:8000
```

#### Start Frontend

```bash
npm run dev
# Frontend runs on http://localhost:5173
```

### Step 3: Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000

### Test Features

1. **Register** - Create new account
2. **Upload** - Upload a test video
3. **Browse** - Discover videos
4. **Watch** - Play video with comments
5. **Profile** - View user profile

---

## Production Deployment

### Option 1: Vercel + Render (Recommended for Beginners)

#### Deploy Frontend to Vercel

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com/import
   - Select your GitHub repo
   - Add environment variable:
     ```
     VITE_API_BASE=https://your-backend-api.com
     ```
   - Deploy

#### Deploy Backend to Render

1. **Create Render account** at https://render.com

2. **Create Web Service**
   - Connect GitHub repo
   - Build command: `npm install`
   - Start command: `npm run dev`
   - Add environment variables:
     ```
     MONGODB_URI=mongodb+srv://...
     CLOUDINARY_CLOUD_NAME=...
     CLOUDINARY_API_KEY=...
     CLOUDINARY_API_SECRET=...
     CORS_ORIGIN=https://your-frontend-domain.com
     ```

3. **Deploy**
   - Click Deploy
   - Wait for build to complete
   - Get your API URL

3. **Update Frontend**
   - Add Render API URL to Vercel environment:
     ```
     VITE_API_BASE=https://your-render-api-url.com
     ```
   - Redeploy on Vercel

### Option 2: Docker + Cloud Server

#### Prepare for Docker

1. **Create `.env.production`** in project root:
   ```env
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/videotube
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   CORS_ORIGIN=https://yourdomain.com
   VITE_API_BASE=https://yourdomain.com/api
   ```

2. **Build Docker images**
   ```bash
   # Backend
   cd Backend/Project
   docker build -t watchnest-backend:latest .

   # Frontend
   cd ../../WatchNest
   docker build -t watchnest-frontend:latest .
   ```

3. **Test locally**
   ```bash
   cd ..
   docker-compose up
   ```

#### Deploy to Cloud Server

**DigitalOcean / AWS / Azure / Linode**

1. **Create VM Instance**
   - 2GB RAM minimum
   - 30GB storage
   - Ubuntu 20.04+

2. **SSH into server**
   ```bash
   ssh root@your-server-ip
   ```

3. **Install Docker**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

4. **Clone and deploy**
   ```bash
   git clone https://github.com/your-username/watchnest.git
   cd watchnest
   cp .env.example .env
   # Edit .env with production values
   docker-compose up -d
   ```

5. **Setup SSL (Let's Encrypt)**
   ```bash
   docker-compose exec nginx certbot certonly --standalone -d yourdomain.com
   ```

---

## Docker Deployment

### Full Stack Deployment (Recommended)

```bash
# 1. Clone repository
git clone <your-repo>
cd watchnest

# 2. Setup environment
cp .env.example .env
# Edit .env with your configuration

# 3. Start all services
docker-compose up -d

# 4. Verify services
docker ps
# Should see: mongodb, backend, frontend

# 5. Check logs
docker-compose logs -f backend
```

### Access Services

- Frontend: http://localhost
- Backend API: http://localhost:8000
- MongoDB: localhost:27017

### Useful Docker Commands

```bash
# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down

# Rebuild images
docker-compose build --no-cache

# Execute command in container
docker exec watchnest-backend npm test

# Monitor container stats
docker stats
```

---

## Environment Variables

### Backend (.env)

```env
# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/videotube
DB_NAME=videotube

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT
ACCESS_TOKEN_SECRET=your-secret-key-min-32-chars
REFRESH_TOKEN_SECRET=your-refresh-secret-min-32-chars
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Server
PORT=8000
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### Frontend (.env)

```env
VITE_API_BASE=http://localhost:8000
VITE_PORT=5173
```

---

## Production Checklist

### Before Deploying

- [ ] **Security**
  - [ ] Change all default secrets & passwords
  - [ ] Enable HTTPS/SSL
  - [ ] Configure CORS for specific domains
  - [ ] Set `NODE_ENV=production`
  - [ ] Enable rate limiting
  - [ ] Setup input validation

- [ ] **Database**
  - [ ] Use MongoDB Atlas (cloud) or secured server
  - [ ] Enable authentication
  - [ ] Setup backups
  - [ ] Create database indexes
  - [ ] Monitor query performance

- [ ] **Performance**
  - [ ] Build frontend for production
  - [ ] Enable caching
  - [ ] Setup CDN for static files
  - [ ] Compress responses
  - [ ] Monitor API response times

- [ ] **Monitoring**
  - [ ] Setup error tracking (Sentry)
  - [ ] Enable logging
  - [ ] Monitor server resources
  - [ ] Setup health checks
  - [ ] Configure alerts

### After Deploying

- [ ] Test all features end-to-end
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify backups are working
- [ ] Document deployment steps

---

## Troubleshooting

### Backend Issues

**MongoDB connection failed**
```bash
# Check MongoDB is running
mongosh

# Verify connection string
echo $MONGODB_URI

# Check firewall
sudo ufw status
```

**Port 8000 already in use**
```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>
```

**Cloudinary upload fails**
```bash
# Verify credentials
echo $CLOUDINARY_API_KEY

# Test upload manually
curl -X POST https://api.cloudinary.com/v1_1/your_cloud_name/upload
```

### Frontend Issues

**API connection fails**
```bash
# Check API is running
curl http://localhost:8000/health

# Verify VITE_API_BASE
console.log(import.meta.env.VITE_API_BASE)

# Check CORS headers
curl -i http://localhost:8000
```

**Blank page on load**
```bash
# Check browser console for errors
# Open DevTools > Console tab

# Verify build
npm run build
npm run preview
```

### Docker Issues

**Container won't start**
```bash
# Check logs
docker-compose logs backend

# Rebuild image
docker-compose build --no-cache backend

# Remove stopped containers
docker-compose rm
```

**Port conflicts**
```bash
# Change port in docker-compose.yml
# Or kill the process using the port

# Find process on port 8000
sudo lsof -i :8000
```

---

## Performance Tips

### Backend Optimization
- Use indexes on frequently queried fields
- Implement pagination for large datasets
- Cache responses where appropriate
- Use compression middleware
- Monitor slow queries

### Frontend Optimization
- Lazy load components
- Optimize images
- Use CDN for static assets
- Implement service workers
- Monitor bundle size

### Database Optimization
- Create proper indexes
- Archive old data
- Monitor query performance
- Optimize aggregation pipelines
- Use MongoDB Atlas performance advisor

---

## Support & Resources

- **Documentation**: See README.md files
- **Issues**: Check GitHub issues
- **API**: See Backend API documentation
- **Deployment**: See DEPLOYMENT.md

### Useful Links

- [Express.js Docs](https://expressjs.com)
- [React Docs](https://react.dev)
- [MongoDB Docs](https://docs.mongodb.com)
- [Vite Docs](https://vitejs.dev)
- [Docker Docs](https://docs.docker.com)

---

## Next Steps

1. **Customize**: Add your branding and features
2. **Scale**: Optimize for more users
3. **Monetize**: Add subscription plans
4. **Analyze**: Track user behavior
5. **Grow**: Marketing and user acquisition

---

**Happy building! 🚀 If you need help, check the docs or create an issue.**
