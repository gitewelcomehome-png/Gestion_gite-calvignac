#!/usr/bin/env bash

set -e

echo "🔧 Applying Podfile fix for Folly..."

# Add post_install fix to Podfile
if [ -f "ios/Podfile" ]; then
  # Check if our fix is already applied
  if ! grep -q "fix_folly_config" "ios/Podfile"; then
    cat >> "ios/Podfile" << 'EOF'

  # Fix for folly/coro/Coroutine.h error
  def fix_folly_config(installer)
    installer.pods_project.targets.each do |target|
      if target.name == 'RCT-Folly'
        target.build_configurations.each do |config|
          config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'c++17'
          config.build_settings['CLANG_CXX_LIBRARY'] = 'libc++'
        end
      end
    end
  end
  
  post_install do |installer|
    fix_folly_config(installer)
  end
EOF
    echo "✅ Folly fix applied to Podfile"
  else
    echo "✅ Folly fix already present in Podfile"
  fi
else
  echo "⚠️  ios/Podfile not found, run expo prebuild first"
fi
