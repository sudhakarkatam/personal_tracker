
import { 
  BookOpen, 
  DollarSign, 
  Lightbulb, 
  Heart, 
  GraduationCap, 
  BarChart3,
  FileText,
  Calendar,
  Settings,
  Sparkles
} from 'lucide-react';

interface MoreFeaturesProps {
  onFeatureSelect: (feature: string) => void;
}

export function MoreFeatures({ onFeatureSelect }: MoreFeaturesProps) {
  const features = [
    {
      id: 'notes',
      title: 'Notes & Journal',
      description: 'Write and organize your thoughts',
      icon: FileText,
      color: 'bg-purple-50 text-purple-600'
    },
    {
      id: 'calendar',
      title: 'Calendar & Events',
      description: 'Manage your schedule and reminders',
      icon: Calendar,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      id: 'reading',
      title: 'Reading Tracker',
      description: 'Track your books and reading progress',
      icon: BookOpen,
      color: 'bg-emerald-50 text-emerald-600'
    },
    {
      id: 'expenses',
      title: 'Expense Tracker',
      description: 'Monitor your spending and budget',
      icon: DollarSign,
      color: 'bg-yellow-50 text-yellow-600'
    },
    {
      id: 'ideas',
      title: 'Idea Vault',
      description: 'Capture and organize your ideas',
      icon: Lightbulb,
      color: 'bg-red-50 text-red-600'
    },
    {
      id: 'wellness',
      title: 'Wellness Tracker',
      description: 'Monitor sleep, mood, and health',
      icon: Heart,
      color: 'bg-pink-50 text-pink-600'
    },
    {
      id: 'learning',
      title: 'Learning Tracker',
      description: 'Track skills and courses',
      icon: GraduationCap,
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'View your progress and insights',
      icon: BarChart3,
      color: 'bg-cyan-50 text-cyan-600'
    }
  ];

  const comingSoonFeatures = [
    'Full CRUD operations',
    'Data visualization',
    'Export capabilities',
    'Smart insights',
    'Customizable settings'
  ];

  return (
    <div className="space-y-6 pb-20">
      <h2 className="text-2xl font-bold text-gray-800">More Features</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <button
              key={feature.id}
              onClick={() => onFeatureSelect(feature.id)}
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-left"
            >
              <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center mb-3`}>
                <Icon size={20} />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm mb-1">{feature.title}</h3>
              <p className="text-xs text-gray-600">{feature.description}</p>
            </button>
          );
        })}
      </div>

      {/* Coming Soon Section */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-100">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="text-purple-600" size={20} />
          <h3 className="text-lg font-semibold text-purple-800">Coming Soon</h3>
        </div>
        <p className="text-purple-600 mb-4">
          We're working hard to bring you these amazing features. Each section will include:
        </p>
        <ul className="space-y-1">
          {comingSoonFeatures.map((feature, index) => (
            <li key={index} className="text-sm text-purple-700 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Settings */}
      <button
        onClick={() => onFeatureSelect('settings')}
        className="w-full bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-center gap-3"
      >
        <div className="w-12 h-12 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center">
          <Settings size={20} />
        </div>
        <div className="text-left">
          <h3 className="font-semibold text-gray-800">Settings</h3>
          <p className="text-sm text-gray-600">App preferences and configuration</p>
        </div>
      </button>
    </div>
  );
}
