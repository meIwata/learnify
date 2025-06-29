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
- **Authentication**: Supabase Auth with JWT tokens stored in Keychain
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Storage**: Supabase Storage for file uploads (screenshots)
- **Deployment**: Zeabur hosting platform

## Development Commands

### macOS App (Learnify/)
- **Build**: Open `Learnify.xcodeproj` in Xcode and build (⌘+B)
- **Run**: Run from Xcode (⌘+R) or use `xcodebuild` command line
- **Test**: Run tests in Xcode (⌘+U)

### Current Implementation Status
- macOS app uses SwiftData for local storage (basic template)
- No Supabase integration yet implemented
- Web frontend directory is empty

## Key Features

1. **Authentication**: Student ID-based registration and login
2. **Gamification**: Daily check-ins, points system, leaderboards
3. **Submissions**: Screenshot uploads and GitHub repository linking
4. **Quizzes**: Multiple-choice quizzes with automatic grading
5. **Admin Dashboard**: Instructor view with class-wide analytics
6. **Awards System**: Instructor-awarded badges and recognition

## Data Models

Core entities include:
- `users/profiles` - Student and instructor data
- `check_ins` - Daily engagement tracking
- `submissions` - Screenshots and GitHub links
- `quizzes/questions/quiz_attempts` - Assessment system
- `awards` - Recognition and badges

## Development Notes

- Use `supabase-swift` library for all backend interactions
- Store JWT tokens securely in macOS Keychain
- Implement RLS policies for data security
- Support multi-device authentication
- Follow SwiftUI best practices for macOS apps

## User Roles

- **Student**: Can check-in, submit work, take quizzes, view leaderboards
- **Instructor**: Can view analytics, create quizzes, award badges

Refer to PRD.md for detailed feature specifications and user stories.