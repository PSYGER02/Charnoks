# Development Setup Guide

## Quick Start for Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Edit `.env.local` with your actual Firebase and Gemini API credentials:
- Get Firebase config from your Firebase Console
- Get Gemini API key from Google AI Studio

### 3. Start Development Server
```bash
npm run dev
```

The app will run on **http://localhost:3001** (changed from default 5173 to avoid conflicts)

### 4. Development vs Production
- **Development**: Uses localhost:3001, local environment variables
- **Production**: Deployed on Vercel with production environment variables
- **No conflicts**: Development setup won't affect your Vercel deployment

### 5. Firebase Emulator (Optional)
If you want to use Firebase emulators for local development:
```bash
firebase emulators:start
```

### 6. Key Development Features
- Hot reload enabled
- Source maps for debugging
- CORS enabled for API calls
- TypeScript type checking
- Tailwind CSS with JIT compilation

### 7. Project Structure
```
├── components/          # React components
├── pages/              # Page components
├── services/           # Firebase and API services
├── hooks/              # Custom React hooks
├── functions/          # Firebase Cloud Functions
├── utils/              # Utility functions
└── types.ts           # TypeScript type definitions
```

### 8. Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

### 9. Important Notes
- The development port is set to 3001 to avoid conflicts
- Environment variables are loaded from `.env.local`
- Firebase emulators are configured but optional
- All changes are isolated from your Vercel deployment