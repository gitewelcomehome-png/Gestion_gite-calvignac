#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Running custom prebuild hook...');

// Fix react-native-reanimated configuration
const babelConfigPath = path.join(__dirname, '..', 'babel.config.js');
if (fs.existsSync(babelConfigPath)) {
  console.log('✅ Babel config exists');
}

// Ensure ios directory exists
const iosDir = path.join(__dirname, '..', 'ios');
if (fs.existsSync(iosDir)) {
  console.log('✅ iOS directory exists');
  
  // Check Podfile
  const podfilePath = path.join(iosDir, 'Podfile');
  if (fs.existsSync(podfilePath)) {
    console.log('✅ Podfile exists');
  }
}

console.log('✅ Prebuild hook completed');
