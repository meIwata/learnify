


const QuickActions: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Submit Screenshot */}
          <button className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all group">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200">
              <i className="fas fa-camera text-blue-600"></i>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Submit Screenshot</p>
              <p className="text-sm text-gray-600">Upload your design work</p>
            </div>
          </button>

          {/* Link GitHub */}
          <button className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all group">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200">
              <i className="fab fa-github text-purple-600"></i>
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">Link Repository</p>
              <p className="text-sm text-gray-600">Submit your code project</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickActions; 