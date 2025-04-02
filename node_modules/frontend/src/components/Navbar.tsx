import { Link } from 'react-router-dom';

const Navbar = () => {
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
  ];

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="font-display text-2xl text-primary-dark">
            SweetSync
          </Link>
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="text-gray-600 hover:text-primary-dark px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 