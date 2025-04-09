import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore'; // Import store
// import { logout } from '../services/authService'; // We'll call the store action directly

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Get state and the clearAuthData action from the store
  const { user, token, clearAuthData } = useAuthStore((state) => ({
    user: state.user,
    token: state.token,
    clearAuthData: state.clearAuthData, // Destructure the correct action
  }));

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/anniversaries', label: 'Anniversaries' },
    { path: '/menstrual-tracker', label: 'Period Tracker' },
    { path: '/flower-tracker', label: 'Flower Tracker' },
    { path: '/date-nights', label: 'Date Nights' },
    { path: '/mood-tracker', label: 'Wellness Tracker' },
    { path: '/favorite-things', label: 'Favorite Things' },
    { path: '/shared-goals', label: 'Shared Goals' },
    { path: '/seasonal-events', label: 'Events' },
    { path: '/ai-advice', label: 'AI Advice' },
    { path: '/account-settings', label: 'Settings' },
  ];

  const handleLogout = () => {
    clearAuthData(); // Call the correct action from the store
    navigate('/login', { replace: true }); // Redirect to login page
  };

  // Don't render Navbar on login/signup pages
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="font-display text-2xl text-primary-dark">
            SweetSync
          </Link>
          
          {token ? ( // User is logged in
            <div className="hidden md:flex items-center space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-gray-600 hover:text-primary-dark px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    location.pathname === item.path ? 'text-primary-dark font-semibold' : ''
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {user && <span className="text-sm text-gray-500">{user.email}</span>}
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          ) : ( // User is logged out
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-primary-dark px-3 py-2 rounded-md text-sm font-medium">
                Login
              </Link>
              <Link to="/signup" className="bg-primary hover:bg-primary-dark text-white px-3 py-2 rounded-md text-sm font-medium">
                Sign Up
              </Link>
          </div>
          )}
          {/* Consider adding a mobile menu toggle here for smaller screens */}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 