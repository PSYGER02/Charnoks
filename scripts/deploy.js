#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Firebase deployment...');

try {
  // Change to functions directory
  process.chdir(path.join(__dirname, '../functions'));
  
  console.log('📦 Installing function dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Go back to root
  process.chdir('..');
  
  console.log('🔧 Building project...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('🚀 Deploying to Firebase...');
  execSync('firebase deploy', { stdio: 'inherit' });
  
  console.log('✅ Deployment completed successfully!');
  console.log('🌐 Your app should now be accessible at your Firebase hosting URL');
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}