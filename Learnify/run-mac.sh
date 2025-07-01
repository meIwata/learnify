#!/bin/bash

# Build and run Learnify for Mac
echo "Building Learnify for Mac..."

# Build the project for macOS
xcodebuild -project Learnify.xcodeproj -scheme Learnify -destination "platform=macOS" build

if [ $? -eq 0 ]; then
    echo "Build successful! Opening Learnify.app..."
    # Find and open the built app
    APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData -name "Learnify.app" -path "*/Debug/*" | head -1)
    if [ -n "$APP_PATH" ]; then
        open "$APP_PATH"
    else
        echo "Could not find Learnify.app in DerivedData"
    fi
else
    echo "Build failed!"
    exit 1
fi 