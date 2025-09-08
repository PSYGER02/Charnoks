#!/usr/bin/env node

/**
 * Environment Setup Script
 * Helps users configure their environment variables
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function log(message, color = 'reset') {
  console.log(colorize(message, color));
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(colorize(prompt, 'cyan'), resolve);
  });
}

async function main() {
  log('\n🚀 Charnoks Manager Environment Setup', 'bright');
  log('=====================================\n', 'bright');
  
  log('This script will help you configure your environment variables.\n', 'yellow');
  
  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  let existingEnv = {};
  if (fs.existsSync(envPath)) {
    log('📄 Found existing .env file', 'green');
    const envContent = fs.readFileSync(envPath, 'utf8');
    existingEnv = parseEnvFile(envContent);
  } else {
    log('📄 No .env file found, creating new one', 'yellow');
  }
  
  // Read .env.example for reference
  let exampleEnv = {};
  if (fs.existsSync(envExamplePath)) {
    const exampleContent = fs.readFileSync(envExamplePath, 'utf8');
    exampleEnv = parseEnvFile(exampleContent);
  }
  
  log('\n🔧 Required Environment Variables:', 'bright');
  log('==================================\n', 'bright');
  
  const requiredVars = [
    {
      key: 'VITE_SUPABASE_URL',
      description: 'Your Supabase project URL',
      example: 'https://your-project-id.supabase.co',
      required: true
    },
    {
      key: 'VITE_SUPABASE_ANON_KEY',
      description: 'Your Supabase anonymous key',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      required: true
    },
    {
      key: 'GEMINI_API_KEY',
      description: 'Google Gemini API key (for AI features)',
      example: 'AIzaSyC...',
      required: false
    },
    {
      key: 'SUPABASE_SERVICE_ROLE_KEY',
      description: 'Supabase service role key (for admin operations)',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      required: false
    }
  ];
  
  const newEnv = { ...existingEnv };
  
  for (const variable of requiredVars) {
    const current = existingEnv[variable.key];
    const example = exampleEnv[variable.key] || variable.example;
    
    log(`\n${variable.required ? '🔴' : '🟡'} ${variable.key}`, variable.required ? 'red' : 'yellow');
    log(`   ${variable.description}`, 'reset');
    
    if (current && current !== '<REDACTED>' && current !== 'your_value_here') {
      log(`   Current: ${maskValue(current)}`, 'green');
      const keep = await question('   Keep current value? (y/n): ');
      if (keep.toLowerCase() === 'y' || keep.toLowerCase() === 'yes' || keep === '') {
        continue;
      }
    }
    
    if (example && example !== '<REDACTED>') {
      log(`   Example: ${example}`, 'blue');
    }
    
    const value = await question(`   Enter value${variable.required ? ' (required)' : ' (optional)'}: `);
    
    if (value.trim()) {
      newEnv[variable.key] = value.trim();
    } else if (variable.required) {
      log('   ❌ This variable is required!', 'red');
      const retry = await question('   Try again? (y/n): ');
      if (retry.toLowerCase() === 'y' || retry.toLowerCase() === 'yes') {
        // Repeat this iteration
        const retryValue = await question(`   Enter ${variable.key}: `);
        if (retryValue.trim()) {
          newEnv[variable.key] = retryValue.trim();
        }
      }
    }
  }
  
  // Generate .env file content
  const envContent = Object.entries(newEnv)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  log('\n📝 Generated .env file:', 'bright');
  log('=====================\n', 'bright');
  
  // Show preview with masked values
  Object.entries(newEnv).forEach(([key, value]) => {
    log(`${key}=${maskValue(value)}`, 'green');
  });
  
  const save = await question('\n💾 Save this configuration? (y/n): ');
  
  if (save.toLowerCase() === 'y' || save.toLowerCase() === 'yes') {
    fs.writeFileSync(envPath, envContent);
    log('\n✅ Environment configuration saved to .env', 'green');
    
    log('\n🎯 Next Steps:', 'bright');
    log('=============', 'bright');
    log('1. Start the development server: npm run dev', 'cyan');
    log('2. Open your browser to http://localhost:5173', 'cyan');
    log('3. For production deployment, add these variables to Vercel:', 'cyan');
    log('   - Go to your Vercel dashboard', 'cyan');
    log('   - Navigate to Project Settings → Environment Variables', 'cyan');
    log('   - Add each variable for all environments', 'cyan');
    
  } else {
    log('\n❌ Configuration not saved', 'yellow');
  }
  
  log('\n🚀 Setup complete! Happy coding!', 'green');
  rl.close();
}

function parseEnvFile(content) {
  const env = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  }
  
  return env;
}

function maskValue(value) {
  if (!value || value.length < 8) return value;
  return value.substring(0, 4) + '••••••••' + value.substring(value.length - 4);
}

// Handle errors gracefully
process.on('SIGINT', () => {
  log('\n\n👋 Setup cancelled by user', 'yellow');
  rl.close();
  process.exit(0);
});

// Run the setup
main().catch((error) => {
  log('\n❌ Setup failed:', 'red');
  log(error.message, 'red');
  rl.close();
  process.exit(1);
});