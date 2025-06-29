# Learnify Frontend Dashboard

React TypeScript dashboard for the Learnify gamified learning system's auto-registration API.

## Features

- ✅ **Student Check-in Form**: Register new students or check-in existing ones
- ✅ **Students List**: View all registered students with auto-refresh
- ✅ **Student History**: Search and view check-in history for individual students
- ✅ **Backend Health Status**: Real-time backend connectivity monitoring
- ✅ **Responsive Design**: Works on desktop and mobile devices
- ✅ **Real-time Updates**: Auto-refresh data every 30 seconds

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **TanStack Query** for API state management
- **Axios** for HTTP requests
- **Lucide React** for icons

## Quick Start

### Prerequisites
- Node.js 18+
- Backend API running on http://localhost:3000

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Configuration

Create `.env` file:
```bash
VITE_API_BASE_URL=http://localhost:3000
```

For production deployment, update the API URL to your deployed backend.

## API Integration

The dashboard integrates with these backend endpoints:

- `GET /health` - Backend health check
- `POST /api/auto/check-in` - Student check-in with auto-registration
- `GET /api/auto/students` - Get all registered students
- `GET /api/auto/check-ins/:student_id` - Get student check-in history

## Components

### CheckInForm
- Student ID input (required)
- Full name input (optional for existing students)
- Auto-registration for new students
- Real-time validation and feedback

### StudentsList
- Live list of all registered students
- Auto-refresh every 30 seconds
- Shows student ID, name, and registration date
- Manual refresh button

### StudentHistory
- Search by student ID
- Shows student details and all check-ins
- Formatted timestamps
- Error handling for non-existent students

### HealthStatus
- Real-time backend connectivity monitoring
- Updates every 10 seconds
- Visual status indicators (online/offline/checking)

## Development URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000 (must be running)
- **Backend Health**: http://localhost:3000/health

## Building for Production

```bash
# Build optimized production bundle
npm run build

# The built files will be in the 'dist' directory
# Deploy the 'dist' directory to your web server
```

## Deployment

The frontend can be deployed to any static hosting service:

- **Vercel**: Connect your GitHub repository
- **Netlify**: Drag and drop the `dist` folder
- **GitHub Pages**: Use the built files from `dist`
- **Any web server**: Serve the `dist` directory

**Important**: Update `VITE_API_BASE_URL` in production to point to your deployed backend API.

## Auto-refresh Behavior

- **Students List**: Refreshes every 30 seconds
- **Health Status**: Checks every 10 seconds
- **Student History**: Manual refresh only (search-based)

All components handle loading states, error states, and provide manual refresh options.