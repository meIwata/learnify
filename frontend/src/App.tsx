
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import AdminPage from './pages/AdminPage';
import ReviewsPage from './pages/ReviewsPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 