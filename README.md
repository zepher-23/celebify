# CelebifyPipe - Instagram Reel Automation Pipeline

A full-stack automation pipeline that generates AI hooks, drives CelebifyAI via Playwright, and publishes to Instagram Reels.

## Tech Stack
- **Frontend:** React (Vite), Tailwind CSS, Lucide Icons, Axios.
- **Backend:** Node.js, Express, Firebase Admin (Firestore), Cloudinary SDK, Playwright.
- **AI:** Google Generative AI (Gemini).

## Prerequisites
- Node.js (v18+)
- Firebase Project & Service Account Key
- Cloudinary Account
- Meta Developer App (with Instagram Graph API access)

## Setup Instructions

### 1. Environment Variables
Create a `.env` file in the `backend/` directory based on `.env.example`:
```env
PORT=3000
GEMINI_API_KEY=xxx
META_ACCESS_TOKEN=xxx
IG_ACCOUNT_ID=xxx
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
FIREBASE_PROJECT_ID=celebify-automation
FIREBASE_CLIENT_EMAIL=xxx
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 2. Installation
```powershell
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Running the Application
```powershell
# Start backend (from backend folder)
node server.js

# Start frontend (from frontend folder)
npm run dev
```

## Architecture
- `backend/services/aiService.js`: Generates hooks & captions via Gemini.
- `backend/services/playwrightService.js`: Automates CelebifyAI video generation.
- `backend/services/cloudinaryService.js`: Handles video hosting and cleanup.
- `backend/services/instagramService.js`: Manages Meta Graph API container flow.
- `backend/server.js`: Orchestrates the async background pipeline.
