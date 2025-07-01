# Learnify - Mac Support

The Learnify iOS app now supports running natively on Mac using "Mac (Designed for iPad)" mode.

## Features

- ✅ **Cross-platform compatibility**: The same SwiftUI codebase runs on both iOS and Mac
- ✅ **Native Mac app**: Runs as a native macOS application (not Catalyst)
- ✅ **Platform-specific optimizations**: iOS-specific UI elements are conditionally compiled
- ✅ **Proper window sizing**: Optimized window dimensions for Mac desktop experience
- ✅ **Network connectivity**: Full API integration works on Mac

## Building and Running

### Method 1: Using Xcode
1. Open `Learnify.xcodeproj` in Xcode
2. Select "My Mac (Designed for iPad)" as the destination
3. Build and run (⌘+R)

### Method 2: Using Command Line
```bash
# Build for Mac
xcodebuild -project Learnify.xcodeproj -scheme Learnify -destination "platform=macOS" build

# Or use the convenience script
./run-mac.sh
```

## Technical Details

### Platform Configuration
- **Deployment Target**: macOS 14.0+
- **Architecture**: arm64 (Apple Silicon) and x86_64 (Intel)
- **Mode**: "Designed for iPad" (not Mac Catalyst)
- **Bundle ID**: `com.buildwithharry.Learnify`

### Code Adaptations
The following iOS-specific SwiftUI modifiers are conditionally compiled:
- `.autocapitalization()` - Only available on iOS
- `.disableAutocorrection()` - Only available on iOS  
- `.submitLabel()` - Only available on iOS
- `UIApplication.shared.sendAction()` for keyboard dismissal - iOS only

### Window Management
- **Minimum size**: 400x600 points
- **Ideal size**: 500x700 points
- **Resizability**: Content-based resizing enabled

## API Integration

The app connects to the same backend API (`https://learnify-api.zeabur.app`) and maintains full functionality:
- Student check-in
- Real-time API communication
- Error handling and retry logic
- Network security (ATS) configuration

## Supported Platforms

| Platform | Status | Notes |
|----------|--------|-------|
| iOS 18.4+ | ✅ Primary | Native iOS experience |
| macOS 14.0+ | ✅ Supported | "Designed for iPad" mode |
| iPad | ✅ Supported | Optimized for tablet |

## Development Notes

- The app uses conditional compilation (`#if os(iOS)`, `#if os(macOS)`) to handle platform differences
- SwiftUI provides excellent cross-platform compatibility
- No separate Mac-specific codebase required
- Maintains single source of truth for UI and business logic 