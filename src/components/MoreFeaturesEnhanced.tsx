
import { Calendar, BookOpen, DollarSign, Lightbulb, Heart, GraduationCap, BarChart, Settings, Dumbbell, ChefHat } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface MoreFeaturesProps {
  onFeatureSelect: (feature: string) => void;
}

const features = [
  {
    id: 'notes',
    name: 'Notes & Journal',
    description: 'Rich text notes with tags and search',
    icon: Calendar,
    color: 'bg-blue-500',
    features: ['Rich text editor', 'Tags & categories', 'Search functionality', 'Journal templates']
  },
  {
    id: 'calendar',
    name: 'Calendar & Events',
    description: 'Manage events and appointments',
    icon: Calendar,
    color: 'bg-green-500',
    features: ['Multiple views', 'Recurring events', 'Color coding', 'Reminders']
  },
  {
    id: 'reading',
    name: 'Reading Tracker',
    description: 'Track books and reading progress',
    icon: BookOpen,
    color: 'bg-purple-500',
    features: ['Reading analytics', 'Book collections', 'Progress tracking', 'Reading goals']
  },
  {
    id: 'expenses',
    name: 'Expense Tracker',
    description: 'Monitor spending and budgets',
    icon: DollarSign,
    color: 'bg-yellow-500',
    features: ['Budget management', 'Category tracking', 'Financial goals', 'Receipt storage']
  },
  {
    id: 'ideas',
    name: 'Idea Vault',
    description: 'Capture and develop ideas',
    icon: Lightbulb,
    color: 'bg-orange-500',
    features: ['Idea development', 'Action planning', 'Linking system', 'Priority scoring']
  },
  {
    id: 'wellness',
    name: 'Wellness Tracker',
    description: 'Comprehensive health monitoring',
    icon: Heart,
    color: 'bg-red-500',
    features: ['Biometric tracking', 'Mental health', 'Activity logging', 'Health goals']
  },
  {
    id: 'learning',
    name: 'Learning Tracker',
    description: 'Manage courses and skill development',
    icon: GraduationCap,
    color: 'bg-indigo-500',
    features: ['Skill assessments', 'Learning paths', 'Progress tracking', 'Certificates']
  },
  {
    id: 'gym',
    name: 'Gym & Fitness',
    description: 'Complete workout and fitness tracking',
    icon: Dumbbell,
    color: 'bg-orange-600',
    features: ['Workout planning', 'Exercise library', 'Progress tracking', 'Personal records']
  },
  {
    id: 'recipes',
    name: 'Recipe Manager',
    description: 'Store recipes and plan meals',
    icon: ChefHat,
    color: 'bg-amber-500',
    features: ['Recipe storage', 'Meal planning', 'Nutrition tracking', 'Shopping lists']
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Insights and performance metrics',
    icon: BarChart,
    color: 'bg-teal-500',
    features: ['Cross-feature analytics', 'Predictive insights', 'Performance metrics', 'Data visualization']
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Customize your experience',
    icon: Settings,
    color: 'bg-gray-500',
    features: ['Theme customization', 'Data privacy', 'Export/import', 'Notification settings']
  }
];

export function MoreFeaturesEnhanced({ onFeatureSelect }: MoreFeaturesProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Enhanced Features</h2>
        <p className="text-gray-600">Explore all the advanced tools available in your personal tracker</p>
      </div>

      <div className="grid gap-4">
        {features.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <Card 
              key={feature.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              onClick={() => onFeatureSelect(feature.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center`}>
                    <IconComponent size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">{feature.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{feature.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {feature.features.map((item, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="text-center py-8">
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">🚀 Production Ready</h3>
          <p className="text-gray-600 text-sm">
            All features are fully functional with real-time data synchronization, 
            advanced analytics, and production-ready quality.
          </p>
        </div>
      </div>
    </div>
  );
}
