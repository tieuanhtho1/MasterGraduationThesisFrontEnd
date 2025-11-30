import { useAuthStore } from '../store/authStore';

const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Dashboard</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Welcome back, {user?.username}!
        </h2>
        <p className="text-gray-600">
          This is your dashboard. You can add more content and features here.
        </p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="font-semibold text-indigo-800 mb-2">Stats 1</h3>
            <p className="text-2xl font-bold text-indigo-600">0</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Stats 2</h3>
            <p className="text-2xl font-bold text-green-600">0</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">Stats 3</h3>
            <p className="text-2xl font-bold text-purple-600">0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
