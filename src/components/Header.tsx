
import { Calendar, Settings } from 'lucide-react';
import { format } from 'date-fns';

interface HeaderProps {
  title: string;
  showSettings?: boolean;
  onSettingsClick?: () => void;
}

export function Header({ title, showSettings = false, onSettingsClick }: HeaderProps) {
  const today = new Date();
  
  return (
    <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 pt-8">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-purple-100 text-sm">
            {format(today, 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        {showSettings && (
          <button
            onClick={onSettingsClick}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Settings size={20} />
          </button>
        )}
      </div>
    </header>
  );
}
