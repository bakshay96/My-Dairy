# Milkify - MERN Stack Setup & Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Environment Configuration](#environment-configuration)
4. [Running the Application](#running-the-application)
5. [Database Setup](#database-setup)
6. [Payment Gateway Setup](#payment-gateway-setup)
7. [Email Configuration](#email-configuration)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js** (v16.x or higher) - [Download](https://nodejs.org/)
- **npm** (v8.x or higher) - Comes with Node.js
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
  - OR use **MongoDB Atlas** (Cloud) - [Free Tier](https://www.mongodb.com/cloud/atlas)
- **Git** - [Download](https://git-scm.com/)

### Verification
```bash
node --version    # Should be v16+
npm --version     # Should be v8+
mongo --version   # If local MongoDB installed
```

---

## Local Development Setup

### Step 1: Clone & Navigate to Project
```bash
cd d:\MASAI\My-Dairy
```

### Step 2: Backend Setup
```bash
cd Backend
npm install
```

### Step 3: Frontend Setup
```bash
cd ../Frontend
npm install
```

### Step 4: Create Environment Files
- Backend: Copy `.env.example` to `.env` and fill in values
- Frontend: Copy `.env.example` to `.env` and fill in values

---

## Environment Configuration

### Backend `.env` Configuration

```env
# Server
PORT=3030
NODE_ENV=development

# Database
# Option 1: Local MongoDB
mongo_url=mongodb://localhost:27017/milkify

# Option 2: MongoDB Atlas (Cloud)
mongo_url=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/milkify

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRY=12h

# CORS
origin=http://localhost:5173

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_FLAG=true
SMTP_EMAIL=your_email@gmail.com
SMTP_PASS=your_app_password

# Cloudinary (Image Storage)
CLOUDINARY_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Razorpay (Payment Gateway)
# Use TEST keys for development
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_test_secret_key
```

### Frontend `.env` Configuration

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3030/api

# Razorpay Public Key (Test)
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxx

# Environment
VITE_ENV=development
VITE_ENABLE_PAYMENT=true
```

---

## Database Setup

### Option A: Local MongoDB Setup

#### Windows
1. Download MongoDB Community Edition from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the installation wizard
3. MongoDB will run as a Windows Service (automatic start)
4. Verify: `mongo --version`

#### macOS
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get install -y mongodb
sudo systemctl start mongodb
```

#### Verify Local MongoDB
```bash
# Open a terminal/command prompt
mongo

# You should see: MongoDB shell version v5.x.x...
```

### Option B: MongoDB Atlas (Recommended for Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new project
4. Create a cluster (Free tier available)
5. Create a database user with username/password
6. Get connection string:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/milkify
   ```
7. Add your IP to "Network Access" whitelist
8. Use this connection string in `.env`

---

## Running the Application

### Terminal 1: Backend Server
```bash
cd Backend
npm run dev
```
Expected output:
```
Server is running at port 3030
MongoDB connected successfully
```

### Terminal 2: Frontend Application
```bash
cd Frontend
npm run dev
```
Expected output:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### Access the Application
- **Frontend**: http://localhost:5173/
- **Backend API**: http://localhost:3030/api

---

## Payment Gateway Setup

### Razorpay Test Keys (Development)

1. Visit [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Sign up or log in
3. Go to **Settings → API Keys**
4. You'll see **Test Keys** and **Live Keys**
5. For development, use **Test Keys**:
   - Copy `Key ID` (starts with `rzp_test_`)
   - Copy `Key Secret`

### Add to `.env` Files

**Backend `.env`:**
```env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_test_secret
```

**Frontend `.env`:**
```env
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

### Test Payments
Razorpay provides test payment details:
- **Card Number**: 4111 1111 1111 1111
- **Expiry**: Any future date (e.g., 12/25)
- **CVV**: Any 3 digits (e.g., 123)

---

## Email Configuration

### Using Gmail (Recommended)

1. Enable 2-factor authentication on your Google Account
2. Create an [App Password](https://myaccount.google.com/apppasswords):
   - Select "Mail" and "Windows Computer" (or your device)
   - Google will generate a 16-character password
3. Use this password in `.env`:
   ```env
   SMTP_EMAIL=your_gmail@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   ```

### Test Email Sending
```bash
# After backend is running, test endpoint:
POST http://localhost:3030/api/admin/test-email

Body:
{
  "email": "recipient@example.com",
  "subject": "Test Email",
  "message": "This is a test email"
}
```

---

## Troubleshooting

### Backend Issues

#### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3030
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3030
kill -9 <PID>
```

#### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Ensure MongoDB is running
```bash
# Check status
sudo systemctl status mongodb  # Linux
brew services list             # macOS
# Check in Services app        # Windows
```

#### JWT Secret Mismatch
```
JsonWebTokenError: invalid signature
```
**Solution**: Ensure `JWT_SECRET` in `.env` matches what was used to create the token

### Frontend Issues

#### Port 5173 Already in Use
```bash
npm run dev -- --port 5174
```

#### API Connection Issues
- Check that backend is running on http://localhost:3030
- Verify `VITE_API_BASE_URL` in `.env`
- Check browser console for CORS errors
- Ensure CORS is enabled in backend `app.js`

#### Module Not Found
```bash
cd Frontend
rm -rf node_modules package-lock.json
npm install
```

### Database Issues

#### MongoDB Authentication Failed
- Check username/password
- Ensure IP is whitelisted (MongoDB Atlas)
- Verify connection string format

#### Cannot Connect to MongoDB Atlas
```
Error: MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```
- Check internet connection
- Verify connection string in `.env`
- Ensure VPN is not blocking MongoDB connection

---

## Development Workflow

### Making API Calls from Frontend
```javascript
// Use the API_BASE_URL from environment
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
});
```

### Backend Route Example
```javascript
// Create a new route with validation
router.post('/create', validateInput, async (req, res) => {
  // Implementation
});
```

---

## Production Deployment

### Before Going Live

1. **Update Environment Variables**
   - Change `JWT_SECRET` to a secure random string
   - Use production MongoDB Atlas connection
   - Use Razorpay **LIVE** keys instead of test keys
   - Configure production email service

2. **Security Checklist**
   - [ ] CORS configured for production domain only
   - [ ] All sensitive data in environment variables
   - [ ] HTTPS enabled
   - [ ] Database backups configured
   - [ ] Rate limiting enabled
   - [ ] Input validation on all endpoints

3. **Testing**
   - [ ] All features tested with production-like data
   - [ ] Payment flow tested with live keys
   - [ ] Email notifications working
   - [ ] File uploads to production storage
   - [ ] Database queries optimized

4. **Deployment**
   - Backend: Deploy to Heroku, Railway, Render, or AWS
   - Frontend: Deploy to Vercel, Netlify, or AWS S3 + CloudFront

---

## Useful Commands

```bash
# Backend
npm run dev          # Start with auto-reload (development)
npm start            # Start production build
npm run build        # Install dependencies

# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Check code quality
```

---

## Support & Documentation

- **Express.js**: https://expressjs.com/
- **React.js**: https://react.dev/
- **MongoDB**: https://docs.mongodb.com/
- **Mongoose**: https://mongoosejs.com/
- **Razorpay**: https://razorpay.com/docs/
- **Vite**: https://vitejs.dev/

---

## Next Steps

After successful setup:
1. Test the login/registration flow
2. Create test farmers and milk records
3. Verify email notifications
4. Test Razorpay integration with test keys
5. Review code quality and run linting

For next phases, see the Phase 2 documentation.
