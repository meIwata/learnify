# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Learnify** is a gamified learning system consisting of:
- **Frontend**: macOS native app built with Swift/SwiftUI 
- **Backend**: Supabase (PostgreSQL database, Auth, Storage) deployed on Zeabur

## Project Structure

```
FCU/
├── PRD.md              # Product Requirements Document
├── Learnify/           # macOS SwiftUI application (Xcode project)
├── frontend/           # Web frontend (currently empty)
└── backend/            # Supabase configuration and edge functions
```

## Architecture

- **macOS Client**: SwiftUI app in `Learnify/` directory using supabase-swift SDK
- **Web Frontend**: Located in `frontend/` directory (currently empty)
- **Authentication**: Student ID-based auto-registration (no JWT required for check-ins)
- **Database**: Supabase PostgreSQL with simplified schema for auto-registration
- **Storage**: Supabase Storage for file uploads (screenshots)
- **Deployment**: Zeabur hosting platform

## Development Commands

### Backend (Express.js + TypeScript)
```bash
cd backend

# Local development with local Supabase
npm run dev:local

# Production development with remote Supabase  
npm run dev

# Supabase local management
npm run supabase:start    # Start local Supabase stack
npm run supabase:stop     # Stop local Supabase
npm run supabase:reset    # Reset local database

# Build and deployment
npm run build            # Build TypeScript
npm start               # Run production build
npm run type-check      # TypeScript validation
npm run lint            # Code linting
```

### macOS App (Learnify/)
- **Build**: Open `Learnify.xcodeproj` in Xcode and build (⌘+B)
- **Run**: Run from Xcode (⌘+R) or use `xcodebuild` command line
- **Test**: Run tests in Xcode (⌘+U)

### Local Development URLs
- **Backend API**: http://localhost:3000
- **Supabase Studio**: http://localhost:54323 (Database admin UI)
- **Health Check**: http://localhost:3000/health

### Current Implementation Status
- ✅ **Backend**: Complete check-in API with Supabase integration
- ✅ **Local Dev**: Full local Supabase development stack
- ✅ **Deployment**: Zeabur deployment configuration ready
- 🔄 **macOS app**: Uses SwiftData for local storage (needs Supabase integration)
- 📝 **Web frontend**: Directory structure created but empty

## Key Features

1. **Auto-Registration**: Student ID-based check-ins with automatic student creation
2. **Gamification**: Daily check-ins, points system, leaderboards
3. **Submissions**: Screenshot uploads and GitHub repository linking
4. **Quizzes**: Multiple-choice quizzes with automatic grading
5. **Admin Dashboard**: Instructor view with class-wide analytics
6. **Awards System**: Instructor-awarded badges and recognition

## Data Models

Core entities include:
- `students` - Student data with auto-registration support
- `student_check_ins` - Daily engagement tracking without cooldown restrictions
- `submissions` - Screenshots and GitHub links
- `quizzes/questions/quiz_attempts` - Assessment system
- `awards` - Recognition and badges

## Development Notes

### Backend Development
- **Framework**: Express.js with TypeScript for type safety
- **Database**: Supabase PostgreSQL with simplified schema (no auth.users dependency)
- **Authentication**: Student ID-based auto-registration (no JWT required)
- **Local Development**: Use `npm run dev:local` with local Supabase instance
- **Production**: Use `npm run dev` with remote Supabase cloud (loads `.env`)
- **API Testing**: Use Supabase Studio at http://localhost:54323 for database inspection
- **Migrations**: Database schema managed through Supabase migrations

### macOS App Development
- Use `supabase-swift` library for all backend interactions
- Student ID-based check-ins (no authentication tokens required)
- Follow SwiftUI best practices for macOS apps
- Integrate with auto-registration API endpoints

#### SwiftUI Modern API Guidelines
- **Navigation**: Use `NavigationStack` instead of `NavigationView` for iOS 16+
- **State Management**: Use `@Observable` macro and `Observation` framework instead of `ObservableObject` and `@Published`
- **Data Binding**: Use `@State` and `@Bindable` with Observable objects
- **Animations**: Prefer new animation APIs with `withAnimation` and `Animation` struct
- **Lists**: Use modern `List` APIs with `ForEach` and proper identifiers
- **Sheets/Presentations**: Use new presentation APIs like `sheet(item:)` and `fullScreenCover(item:)`
- **Minimum Deployment**: Target iOS 16+ / macOS 13+ for modern SwiftUI features

### Available Documentation
- **LOCAL_DEVELOPMENT.md**: Complete local development setup guide
- **DEPLOYMENT.md**: Production deployment steps for Supabase + Zeabur
- **API_DESIGN.md**: API endpoints and request/response formats
- **TASKS.md**: Current development progress tracking

## User Roles

- **Student**: Can check-in, submit work, take quizzes, view leaderboards
- **Instructor**: Can view analytics, create quizzes, award badges

Refer to PRD.md for detailed feature specifications and user stories.