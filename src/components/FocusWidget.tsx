
import { useState, useEffect } from 'react';
import { Clock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FocusWidget() {
  const [todayMinutes, setTodayMinutes] = useState(0);

  useEffect(() => {
    const sessions = JSON.parse(localStorage.getItem('focusSessions') || '[]');
    const today = new Date().toDateString();
    const todaySessions = sessions.filter((s: any) => {
      return s.date && new Date(s.date).toDateString() === today && s.type === 'focus' && s.completed;
    });
    const minutes = todaySessions.reduce((acc: number, s: any) => acc + s.duration, 0);
    setTodayMinutes(minutes);
  }, []);

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Focus Time</h3>
      
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Clock size={18} className="text-purple-500" />
          <span className="text-sm font-medium text-gray-700">Today's Focus</span>
        </div>
        <p className="text-3xl font-bold text-purple-600">{todayMinutes}m</p>
        <p className="text-sm text-gray-500">
          {Math.round(todayMinutes / 25)} pomodoros completed
        </p>
      </div>

      <Button 
        className="w-full bg-purple-600 hover:bg-purple-700"
        onClick={() => {
          // This would trigger navigation to focus timer
          const event = new CustomEvent('navigate', { detail: 'focus' });
          window.dispatchEvent(event);
        }}
      >
        <Play size={16} className="mr-2" />
        Start Focus Session
      </Button>
    </div>
  );
}
