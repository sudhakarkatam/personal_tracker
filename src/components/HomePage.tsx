import { QuoteCard } from './QuoteCard';
import { TaskManager } from './TaskManager';
import { HabitTracker } from './HabitTracker';
import { WellnessWidget } from './WellnessWidget';
import { FocusWidget } from './FocusWidget';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, Zap, Calendar, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export function HomePage() {
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [habitsEnhanced, setHabitsEnhanced] = useState([]);
  const [focusSessions, setFocusSessions] = useState([]);
  const [wellness, setWellness] = useState([]);
  const [overallScore, setOverallScore] = useState(0);

  // Auto-refresh data when component mounts or localStorage changes
  useEffect(() => {
    const loadData = () => {
      try {
        const storedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const storedHabits = JSON.parse(localStorage.getItem('habits') || '[]');
        const storedHabitsEnhanced = JSON.parse(localStorage.getItem('habitsEnhanced') || '[]');
        const storedFocusSessions = JSON.parse(localStorage.getItem('focusSessions') || '[]');
        const storedWellness = JSON.parse(localStorage.getItem('wellness') || '[]');
        
        setTasks(storedTasks);
        setHabits(storedHabits);
        setHabitsEnhanced(storedHabitsEnhanced);
        setFocusSessions(storedFocusSessions);
        setWellness(storedWellness);
        
        // Calculate overall life score
        calculateOverallScore(storedTasks, storedHabitsEnhanced, storedWellness, storedFocusSessions);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();

    // Listen for storage changes
    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('dataUpdated', handleStorageChange);

    // Set up interval to refresh data every 5 seconds
    const interval = setInterval(loadData, 5000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('dataUpdated', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const calculateOverallScore = (tasks: any[], habits: any[], wellness: any[], focus: any[]) => {
    const today = new Date().toDateString();
    
    // Task completion score
    const todayTasks = tasks.filter((task: any) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === today;
    });
    const taskScore = todayTasks.length > 0 ? (todayTasks.filter((t: any) => t.completed).length / todayTasks.length) * 100 : 0;
    
    // Habit completion score
    const activeHabits = habits.filter((h: any) => h.isActive);
    const todayDate = format(new Date(), 'yyyy-MM-dd');
    const habitScore = activeHabits.length > 0 ? 
      (activeHabits.filter((h: any) => {
        const completion = h.completions?.find((c: any) => c.date === todayDate);
        return completion?.completed;
      }).length / activeHabits.length) * 100 : 0;
    
    // Wellness score
    const todayWellness = wellness.find((w: any) => w.date === todayDate);
    const wellnessScore = todayWellness ? 
      ((todayWellness.mood || 0) / 10) * 100 : 0;
    
    // Focus score
    const todayFocus = focus.filter((f: any) => {
      const sessionDate = new Date(f.createdAt || f.date).toDateString();
      return sessionDate === today;
    });
    const focusScore = todayFocus.length > 0 ? 
      (todayFocus.reduce((sum: number, f: any) => sum + (f.quality || 5), 0) / (todayFocus.length * 5)) * 100 : 0;
    
    const overall = Math.round((taskScore + habitScore + wellnessScore + focusScore) / 4);
    setOverallScore(overall);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Overall Life Score */}
      <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target size={24} />
            Today's Life Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold">{overallScore}%</div>
            <div className="flex-1">
              <Progress value={overallScore} className="h-3" />
              <p className="text-sm mt-1 opacity-90">
                {overallScore >= 80 ? 'Excellent day!' : 
                 overallScore >= 60 ? 'Good progress!' : 
                 'Keep pushing forward!'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <QuoteCard />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WellnessWidget />
        <FocusWidget />
      </div>
      
      {/* Enhanced Task Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <CheckCircle size={20} />
          Today's Tasks
        </h3>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <TaskSummary tasks={tasks} />
        </div>
      </div>

      {/* Enhanced Habit Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <Zap size={20} />
          Habit Progress
        </h3>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <HabitSummary habits={habits} habitsEnhanced={habitsEnhanced} />
        </div>
      </div>

      {/* Weekly Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={20} />
            Weekly Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyOverview 
            tasks={tasks} 
            habits={[...habits, ...habitsEnhanced.filter(h => h.isActive)]} 
            wellness={wellness}
            focus={focusSessions}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function TaskSummary({ tasks }: { tasks: any[] }) {
  const today = new Date().toDateString();
  const todayTasks = tasks.filter((task: any) => {
    if (!task.dueDate) return false;
    const taskDate = new Date(task.dueDate);
    return taskDate.toDateString() === today;
  });
  const completedTasks = todayTasks.filter((task: any) => task.completed);
  const overdueTasks = tasks.filter((task: any) => {
    if (!task.dueDate || task.completed) return false;
    const taskDate = new Date(task.dueDate);
    return taskDate < new Date() && taskDate.toDateString() !== today;
  });

  if (todayTasks.length === 0 && overdueTasks.length === 0) {
    return <p className="text-gray-500 text-center py-4">No tasks due today</p>;
  }

  return (
    <div className="space-y-4">
      {/* Today's Tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600">
            {completedTasks.length} of {todayTasks.length} completed
          </span>
          <span className="text-sm font-medium text-purple-600">
            {todayTasks.length > 0 ? Math.round((completedTasks.length / todayTasks.length) * 100) : 0}%
          </span>
        </div>
        <div className="space-y-2">
          {todayTasks.slice(0, 3).map((task: any) => (
            <div key={task.id} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${task.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className={`text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                {task.title}
              </span>
              {task.priority && (
                <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}>
                  {task.priority}
                </Badge>
              )}
            </div>
          ))}
          {todayTasks.length > 3 && (
            <p className="text-xs text-gray-500 mt-2">
              +{todayTasks.length - 3} more tasks
            </p>
          )}
        </div>
      </div>

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <div className="border-t pt-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-red-600">Overdue Tasks</span>
            <Badge variant="destructive">{overdueTasks.length}</Badge>
          </div>
          <div className="space-y-1">
            {overdueTasks.slice(0, 2).map((task: any) => (
              <div key={task.id} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-sm text-red-700">{task.title}</span>
              </div>
            ))}
            {overdueTasks.length > 2 && (
              <p className="text-xs text-red-500">+{overdueTasks.length - 2} more overdue</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function HabitSummary({ habits, habitsEnhanced }: { habits: any[], habitsEnhanced: any[] }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const allHabits = [...habits, ...habitsEnhanced.filter(h => h.isActive)];
  
  if (allHabits.length === 0) {
    return <p className="text-gray-500 text-center py-4">No habits to track</p>;
  }

  const completedHabits = allHabits.filter(habit => {
    const completion = habit.completions?.find((c: any) => c.date === today);
    return completion?.completed;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">
          {completedHabits.length} of {allHabits.length} completed
        </span>
        <span className="text-sm font-medium text-purple-600">
          {Math.round((completedHabits.length / allHabits.length) * 100)}%
        </span>
      </div>
      
      <div className="space-y-3">
        {allHabits.slice(0, 4).map((habit: any) => {
          const todayCompletion = habit.completions?.find((c: any) => c.date === today);
          const progress = todayCompletion ? (todayCompletion.count / habit.target) * 100 : 0;
          const streak = calculateHabitStreak(habit);
          
          return (
            <div key={habit.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">{habit.icon || '🎯'}</span>
                <div>
                  <span className="text-sm text-gray-700">{habit.name}</span>
                  {streak > 0 && (
                    <div className="flex items-center gap-1 text-xs text-orange-600">
                      <Zap size={12} />
                      <span>{streak} day streak</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-8">
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          );
        })}
        {allHabits.length > 4 && (
          <p className="text-xs text-gray-500 mt-2">
            +{allHabits.length - 4} more habits
          </p>
        )}
      </div>
    </div>
  );
}

function WeeklyOverview({ tasks, habits, wellness, focus }: any) {
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + i);
    return date;
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, index) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayTasks = tasks.filter((t: any) => {
            if (!t.dueDate) return false;
            const taskDate = new Date(t.dueDate);
            return taskDate.toDateString() === day.toDateString();
          });
          const completedTasks = dayTasks.filter((t: any) => t.completed);
          const dayHabits = habits.filter((h: any) => {
            const completion = h.completions?.find((c: any) => c.date === dateStr);
            return completion?.completed;
          });
          const dayWellness = wellness.find((w: any) => w.date === dateStr);
          const dayFocus = focus.filter((f: any) => {
            const sessionDate = new Date(f.createdAt || f.date).toDateString();
            return sessionDate === day.toDateString();
          });

          const taskScore = dayTasks.length > 0 ? (completedTasks.length / dayTasks.length) * 100 : 0;
          const habitScore = habits.length > 0 ? (dayHabits.length / habits.length) * 100 : 0;
          const wellnessScore = dayWellness ? ((dayWellness.mood || 0) / 10) * 100 : 0;
          const focusScore = dayFocus.length > 0 ? 
            (dayFocus.reduce((sum: number, f: any) => sum + (f.quality || 5), 0) / (dayFocus.length * 5)) * 100 : 0;
          
          const overallDayScore = Math.round((taskScore + habitScore + wellnessScore + focusScore) / 4);

          return (
            <div key={index} className="text-center">
              <div className="text-xs text-gray-500 mb-1">
                {format(day, 'EEE')}
              </div>
              <div className="text-xs text-gray-400 mb-2">
                {format(day, 'MMM d')}
              </div>
              <div className={`w-full h-16 rounded-lg flex flex-col items-center justify-center text-xs font-medium
                ${overallDayScore >= 80 ? 'bg-green-100 text-green-800' :
                  overallDayScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                  overallDayScore >= 40 ? 'bg-orange-100 text-orange-800' :
                  overallDayScore > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-500'}`}
              >
                <div className="text-lg font-bold">{overallDayScore}%</div>
                <div className="flex gap-1 mt-1">
                  {dayTasks.length > 0 && <div className="w-1 h-1 bg-blue-500 rounded-full" />}
                  {dayHabits.length > 0 && <div className="w-1 h-1 bg-purple-500 rounded-full" />}
                  {dayWellness && <div className="w-1 h-1 bg-pink-500 rounded-full" />}
                  {dayFocus.length > 0 && <div className="w-1 h-1 bg-green-500 rounded-full" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-center gap-6 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
          <span>Tasks</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-purple-500 rounded-full" />
          <span>Habits</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-pink-500 rounded-full" />
          <span>Wellness</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span>Focus</span>
        </div>
      </div>
    </div>
  );
}

function calculateHabitStreak(habit: any) {
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const completion = habit.completions?.find((c: any) => c.date === dateStr);
    if (completion?.completed) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}
