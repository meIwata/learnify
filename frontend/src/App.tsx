
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import LoginScreen from './components/LoginScreen';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import ReviewsPage from './pages/ReviewsPage';
import ProfilePage from './components/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import LessonsPage from './pages/LessonsPage';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <Router>
      <div className="min-h-screen">
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/lessons" element={<LessonsPage />} />
          <Route path="/profile/:studentId" element={<ProfilePage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App; 