import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
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
import PageLayout from './components/PageLayout';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-pink-50">
        <Navbar />
        <PageLayout>
          <Routes>
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
          </Routes>
        </PageLayout>
      </div>
    </Router>
  );
}

export default App;
