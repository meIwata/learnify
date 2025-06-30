import WelcomeSection from '../components/WelcomeSection';
import QuickStats from '../components/QuickStats';
import CurrentCourses from '../components/CurrentCourses';
import RecentActivity from '../components/RecentActivity';
import QuickActions from '../components/QuickActions';
import Leaderboard from '../components/Leaderboard';
import Achievements from '../components/Achievements';
import UpcomingQuizzes from '../components/UpcomingQuizzes';

const HomePage: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 font-sans min-h-screen">
      <main className="pt-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          <WelcomeSection />
          
          <QuickStats />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              <CurrentCourses />
              <RecentActivity />
              <QuickActions />
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              <Leaderboard />
              <Achievements />
              <UpcomingQuizzes />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomePage;