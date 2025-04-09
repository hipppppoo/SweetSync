import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import PageLayout from './components/PageLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './store/authStore';

// Page Imports
import Dashboard from './pages/Dashboard';
import Anniversaries from './pages/Anniversaries';
import PeriodTracker from './pages/PeriodTracker';
import FlowerTracker from './pages/FlowerTracker';
import DateNights from './pages/DateNights';
import MoodTracker from './pages/MoodTracker';
import FavoriteThings from './pages/FavoriteThings';
import SharedGoals from './pages/SharedGoals';
import Events from './pages/Events';
import AIAdvice from './pages/AIAdvice';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import AccountSettingsPage from './pages/AccountSettingsPage';

function App() {
  const token = useAuthStore((state) => state.token);

  return (
    <Router>
      <div className="min-h-screen bg-pink-50 flex flex-col">
        <Navbar />
        <div className="pt-16 flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />
            <Route path="/signup" element={token ? <Navigate to="/" replace /> : <SignupPage />} />

            {/* Protected Routes Layout */}
            <Route element={<ProtectedRoute />}>
              <Route element={<PageLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/anniversaries" element={<Anniversaries />} />
            <Route path="/menstrual-tracker" element={<PeriodTracker />} />
            <Route path="/flower-tracker" element={<FlowerTracker />} />
            <Route path="/date-nights" element={<DateNights />} />
            <Route path="/mood-tracker" element={<MoodTracker />} />
            <Route path="/favorite-things" element={<FavoriteThings />} />
            <Route path="/shared-goals" element={<SharedGoals />} />
            <Route path="/seasonal-events" element={<Events />} />
            <Route path="/ai-advice" element={<AIAdvice />} />
                <Route path="/account-settings" element={<AccountSettingsPage />} />
              </Route>
            </Route>

            {/* Optional: Add a 404 Not Found Route outside protected layout */}
            {/* <Route path="*" element={<NotFoundPage />} /> */}
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
