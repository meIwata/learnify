import StudentsOverview from '../components/StudentsOverview';

const AdminPage: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 font-sans min-h-screen">
      <main className="pt-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Admin Header */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-purple-600 to-blue-700 rounded-2xl p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-2">Admin Dashboard 👨‍💼</h2>
                <p className="text-purple-100 text-lg">Manage and monitor all students in the learning platform</p>
              </div>
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
            </div>
          </div>

          {/* Students Overview */}
          <StudentsOverview />
        </div>
      </main>
    </div>
  );
};

export default AdminPage;