# Firebase Environment Configuration Setup

## For Production Deployment

### 1. Set Environment Variables using Firebase CLI

```bash
# Set your Gemini API key
firebase functions:config:set gemini.api_key="your_actual_gemini_api_key"

# Set other environment variables if needed
firebase functions:config:set app.environment="production"

# View current config
firebase functions:config:get
```

### 2. Update your Cloud Functions to use config

In your `functions/index.ts`, you can access these like:
```typescript
import { defineString } from 'firebase-functions/params';

// Define the parameter
const geminiApiKey = defineString('GEMINI_API_KEY');

// Use in your function
const genAI = new GoogleGenerativeAI(geminiApiKey.value());
```

### 3. Deploy with environment variables
```bash
firebase deploy --only functions
```

## For Local Development

### 1. Create functions/.env file (already done)
```
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. The Firebase emulator will automatically load this file

## Security Best Practices

1. **Never commit .env files to git** (already in .gitignore)
2. **Use different keys for development and production**
3. **Rotate keys regularly**
4. **Use Firebase's built-in config for production**
5. **Keep frontend API keys separate from backend secrets**

## Getting Your Keys

### Firebase Configuration
1. Go to Firebase Console → Project Settings → General
2. Scroll down to "Your apps" section
3. Click on your web app
4. Copy the config object values

### Gemini API Key
1. Go to Google AI Studio (https://aistudio.google.com/)
2. Click "Get API Key"
3. Create a new API key
4. Copy the key (keep it secure!)

## Environment File Structure

```
your-project/
├── .env                    # Frontend environment variables
├── functions/
│   ├── .env               # Backend environment variables (local)
│   └── index.ts           # Your cloud functions
└── .gitignore             # Make sure .env files are ignored
```