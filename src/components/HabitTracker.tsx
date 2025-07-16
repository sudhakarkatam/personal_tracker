
import { useState } from 'react';
import { Plus, Check, Flame, Target, TrendingUp } from 'lucide-react';
import { Habit, HabitCompletion } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

export function HabitTracker() {
  const [habits, setHabits] = useLocalStorage<Habit[]>('habits', []);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    target: 1,
    unit: 'times',
    color: '#8B5CF6'
  });

  const addHabit = () => {
    if (!newHabit.name.trim()) return;

    const habit: Habit = {
      id: Date.now().toString(),
      name: newHabit.name,
      description: newHabit.description,
      target: newHabit.target,
      unit: newHabit.unit,
      color: newHabit.color,
      type: 'numeric',
      category: 'other',
      frequency: 'daily',
      difficulty: 'medium',
      isActive: true,
      reminderTime: null,
      createdAt: new Date(),
      completions: [],
      icon: '🎯',
      streakTarget: 7
    };

    setHabits(prev => [...prev, habit]);
    setNewHabit({
      name: '',
      description: '',
      target: 1,
      unit: 'times',
      color: '#8B5CF6'
    });
    setIsAddingHabit(false);
  };

  const toggleHabitCompletion = (habitId: string) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    setHabits(prev =>
      prev.map(habit => {
        if (habit.id !== habitId) return habit;
        
        const existingCompletion = habit.completions.find(c => c.date === today);
        const updatedCompletions = existingCompletion
          ? habit.completions.map(c =>
              c.date === today
                ? { ...c, count: c.count >= habit.target! ? 0 : c.count + 1, completed: c.count + 1 >= habit.target! }
                : c
            )
          : [...habit.completions, { date: today, count: 1, completed: 1 >= habit.target! }];
        
        return { ...habit, completions: updatedCompletions };
      })
    );
  };

  const getStreakCount = (habit: Habit) => {
    let streak = 0;
    let currentDate = new Date();
    
    while (true) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const completion = habit.completions.find(c => c.date === dateStr);
      
      if (completion && completion.completed) {
        streak++;
        currentDate = addDays(currentDate, -1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getTodayCompletion = (habit: Habit) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return habit.completions.find(c => c.date === today) || { date: today, count: 0, completed: false };
  };

  const getWeekProgress = (habit: Habit) => {
    const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfThisWeek, i));
    
    return weekDays.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const completion = habit.completions.find(c => c.date === dateStr);
      return {
        date: day,
        completed: completion?.completed || false,
        count: completion?.count || 0
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Habits</h2>
        <Dialog open={isAddingHabit} onOpenChange={setIsAddingHabit}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus size={16} className="mr-2" />
              Add Habit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Habit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Habit Name</Label>
                <Input
                  id="name"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Drink water, Exercise"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={newHabit.description}
                  onChange={(e) => setNewHabit(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your habit"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target">Daily Target</Label>
                  <Input
                    id="target"
                    type="number"
                    min="1"
                    value={newHabit.target}
                    onChange={(e) => setNewHabit(prev => ({ ...prev, target: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={newHabit.unit}
                    onChange={(e) => setNewHabit(prev => ({ ...prev, unit: e.target.value }))}
                    placeholder="times, glasses, minutes"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddingHabit(false)}>
                  Cancel
                </Button>
                <Button onClick={addHabit}>Add Habit</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-12">
          <Target size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No habits yet</h3>
          <p className="text-gray-500">Start building better habits by adding your first one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {habits.map((habit) => {
            const todayCompletion = getTodayCompletion(habit);
            const streak = getStreakCount(habit);
            const weekProgress = getWeekProgress(habit);
            const progressPercentage = (todayCompletion.count / habit.target!) * 100;

            return (
              <div key={habit.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{habit.name}</h3>
                    {habit.description && (
                      <p className="text-sm text-gray-600">{habit.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleHabitCompletion(habit.id)}
                    className={cn(
                      "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors",
                      todayCompletion.completed
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300 hover:border-green-500"
                    )}
                  >
                    {todayCompletion.completed ? <Check size={20} /> : <Plus size={20} />}
                  </button>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Progress: {todayCompletion.count} / {habit.target} {habit.unit}</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Flame size={16} className="text-orange-500" />
                      <span className="text-gray-600">{streak} day streak</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp size={16} className="text-blue-500" />
                      <span className="text-gray-600">
                        {Math.round((habit.completions.filter(c => c.completed).length / Math.max(habit.completions.length, 1)) * 100)}% success
                      </span>
                    </div>
                  </div>
                </div>

                {/* Week Progress */}
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">This Week</p>
                  <div className="flex gap-1">
                    {weekProgress.map((day, index) => (
                      <div key={index} className="flex-1 text-center">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium mx-auto mb-1",
                          day.completed 
                            ? "bg-green-500 text-white" 
                            : isSameDay(day.date, new Date())
                            ? "bg-purple-100 text-purple-600 border-2 border-purple-300"
                            : "bg-gray-100 text-gray-400"
                        )}>
                          {format(day.date, 'd')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(day.date, 'EEE')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
