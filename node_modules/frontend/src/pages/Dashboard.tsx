import { Link } from 'react-router-dom';

interface FeatureCard {
  title: string;
  description: string;
  path: string;
  icon: string;
}

const features: FeatureCard[] = [
  {
    title: 'Anniversaries',
    description: 'Track special dates and milestones in your relationship',
    path: '/anniversaries',
    icon: '🎉',
  },
  {
    title: 'Period Tracker',
    description: 'Track and predict periods',
    path: '/menstrual-tracker',
    icon: '📅',
  },
  {
    title: 'Flower Tracker',
    description: 'Keep track of flowers given and their lifespan',
    path: '/flower-tracker',
    icon: '🌸',
  },
  {
    title: 'Date Nights',
    description: 'Plan and remember your special moments together',
    path: '/date-nights',
    icon: '💑',
  },
  {
    title: 'Mood Tracker',
    description: 'Monitor and understand emotional patterns',
    path: '/mood-tracker',
    icon: '😊',
  },
  {
    title: 'Favorite Things',
    description: 'Remember preferences and create wishlists',
    path: '/favorite-things',
    icon: '❤️',
  },
  {
    title: 'Shared Goals',
    description: 'Set and track relationship goals together',
    path: '/shared-goals',
    icon: '🎯',
  },
  {
    title: 'Events',
    description: 'Plan for special occasions',
    path: '/seasonal-events',
    icon: '🌟',
  },
  {
    title: 'AI Advice',
    description: 'Get personalized relationship suggestions',
    path: '/ai-advice',
    icon: '🤖',
  },
];

const Dashboard = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 space-y-6 pt-8 pb-16">
      <h1 className="text-4xl font-display text-primary-dark font-bold text-center mb-8">
        Welcome to SweetSync
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => (
          <Link
            key={feature.path}
            to={feature.path}
            className="card group hover:border-primary-light border-2 border-transparent max-w-sm mx-auto w-full"
          >
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h2 className="text-2xl font-display text-primary-dark mb-2">
              {feature.title}
            </h2>
            <p className="text-gray-600">{feature.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard; 