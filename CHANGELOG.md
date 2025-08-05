# Changelog

All notable changes to the Learnify project will be documented in this file.

---

## [Unreleased] - 2025-08-08 18:00

### Added
- **Project Showcase & Voting System**:
    - Students can submit projects with titles, descriptions, and multiple screenshots.
    - A gallery to view all submitted projects.
    - Students can vote for their favorite projects, contributing to their leaderboard score.
    - Admin controls for managing submissions and voting periods (partially complete).
- **Project Notes & Collaboration**:
    - Students can add notes to their own project submissions.
    - Instructors can add private feedback notes to student projects.
- **Multiple Screenshot Uploads**:
    - Enhanced the submission process to allow for multiple screenshots.

## [Released] - 2025-07-31

### Added
- **Smart Learning Quiz System**:
    - Adaptive algorithm: 60% incorrect questions, 30% new, 10% reinforcement.
    - 25 SwiftUI questions with difficulty levels.
    - Cross-platform support (Web & iOS) with real-time progress sync.
    - Complete documentation in `QUIZ_SYSTEM.md`.

## [Released] - 2025-07-16

### Added
- **Submissions System**:
    - Students can submit screenshots and GitHub repositories.
    - Instructors can review and mark submissions.
- **Admin Dashboard**:
    - Class-wide analytics and student progress monitoring.
- **Awards System**:
    - Instructors can award badges for achievements.

## [Released] - 2025-06-29 18:00

### Added
- Complete check-in feature backend implementation
- API endpoints: POST /api/check-in, GET /api/check-ins
- **🆕 Student ID Check-in API: POST /api/simple/check-in**
- **🆕 Student ID History API: POST /api/simple/check-ins**
- Supabase integration with JWT authentication
- 4-hour check-in cooldown system
- TypeScript types and comprehensive error handling
- Zeabur deployment configuration
- Complete API documentation
- **Step-by-step deployment guide (DEPLOYMENT.md)**
- **Local development setup (LOCAL_DEVELOPMENT.md)**
- **Student ID API documentation (STUDENT_API.md)**

### Student ID Features
- **No password required**: Check-in with just student_id
- **Auto-registration**: Students auto-registered on first check-in
- **4-hour cooldown**: Prevents spam check-ins
- **Simple integration**: Easy for any client to use

### Documentation
- **DEPLOYMENT.md**: 1-2-3 deployment steps for Supabase + Zeabur
- **LOCAL_DEVELOPMENT.md**: Complete local Supabase setup guide
- Database schema with RLS policies and migrations
- Environment variables configuration for multiple environments
- Troubleshooting guide and deployment checklist

### Development Environment
- **Local Supabase**: Full local development stack with CLI
- **Environment Management**: Separate .env files for local/production
- **Database Migrations**: Proper schema versioning with Supabase migrations
- **Enhanced Scripts**: npm scripts for local development workflow

### Technical Implementation
- **Authentication**: Supabase JWT middleware with user context
- **Validation**: Zod schemas for request/response validation
- **Database**: Optimized queries with proper indexing
- **Security**: Helmet, CORS, request size limits
- **Architecture**: Service layer pattern for business logic

---

## [Initial] - 2025-06-29 12:00

### Added
- Initial project setup with PRD documentation
- CLAUDE.md for development guidance
- .gitignore files for all project components
- Task tracking system (TASKS.md)
- Changelog system (CHANGELOG.md)
- Backend development planning for check-in feature

### Technical Decisions
- **Backend Stack**: Node.js + TypeScript + Express
- **Database**: Supabase PostgreSQL
- **Deployment**: Zeabur
- **Architecture**: Simple REST API with spam prevention

---

*Format: [Unreleased] | [Version] - YYYY-MM-DD*