
import { useState } from 'react';
import { Plus, Check, Flame, Target, TrendingUp, Edit2, Trash2, Search, Filter, Download, Upload } from 'lucide-react';
import { Habit, HabitCompletion } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

export function HabitTrackerEnhanced() {
  const [habits, setHabits] = useLocalStorage<Habit[]>('habitsEnhanced', []);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);
  const [selectedHabits, setSelectedHabits] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showBulkActions, setShowBulkActions] = useState(false);

  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    target: 1,
    unit: 'times',
    color: '#8B5CF6',
    category: 'other' as const,
    difficulty: 'medium' as const,
    streakTarget: 7,
    frequency: 'daily' as const
  });

  const categories = ['health', 'fitness', 'learning', 'productivity', 'personal', 'other'];

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
      category: newHabit.category,
      difficulty: newHabit.difficulty,
      frequency: newHabit.frequency,
      isActive: true,
      reminderTime: null,
      createdAt: new Date(),
      completions: [],
      icon: '🎯',
      streakTarget: newHabit.streakTarget
    };

    setHabits(prev => [...prev, habit]);
    resetForm();
    
    // Trigger data update event
    window.dispatchEvent(new Event('dataUpdated'));
  };

  const updateHabit = () => {
    if (!editingHabit) return;

    setHabits(prev =>
      prev.map(habit =>
        habit.id === editingHabit.id ? editingHabit : habit
      )
    );
    setEditingHabit(null);
    
    // Trigger data update event
    window.dispatchEvent(new Event('dataUpdated'));
  };

  const confirmDeleteHabit = (habitId: string) => {
    setDeletingHabitId(habitId);
    setShowDeleteConfirm(true);
  };

  const deleteHabit = () => {
    if (!deletingHabitId) return;
    
    setHabits(prev => prev.filter(habit => habit.id !== deletingHabitId));
    setShowDeleteConfirm(false);
    setDeletingHabitId(null);
    
    // Trigger data update event
    window.dispatchEvent(new Event('dataUpdated'));
  };

  const bulkDelete = () => {
    setHabits(prev => prev.filter(habit => !selectedHabits.has(habit.id)));
    setSelectedHabits(new Set());
    setShowBulkActions(false);
    
    // Trigger data update event
    window.dispatchEvent(new Event('dataUpdated'));
  };

  const exportData = () => {
    const dataStr = JSON.stringify(habits, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `habits-${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
  };

  const resetForm = () => {
    setNewHabit({
      name: '',
      description: '',
      target: 1,
      unit: 'times',
      color: '#8B5CF6',
      category: 'other',
      difficulty: 'medium',
      streakTarget: 7,
      frequency: 'daily'
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
                ? { ...c, count: c.count >= habit.target ? 0 : c.count + 1, completed: c.count + 1 >= habit.target }
                : c
            )
          : [...habit.completions, { date: today, count: 1, completed: 1 >= habit.target }];
        
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

  const filteredHabits = habits.filter(habit => {
    const matchesSearch = habit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         habit.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'all' || habit.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleSelectHabit = (habitId: string) => {
    const newSelected = new Set(selectedHabits);
    if (newSelected.has(habitId)) {
      newSelected.delete(habitId);
    } else {
      newSelected.add(habitId);
    }
    setSelectedHabits(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const selectAll = () => {
    if (selectedHabits.size === filteredHabits.length) {
      setSelectedHabits(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedHabits(new Set(filteredHabits.map(h => h.id)));
      setShowBulkActions(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Enhanced Habit Tracker</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportData}>
            <Download size={16} className="mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsAddingHabit(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus size={16} className="mr-2" />
            Add Habit
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search habits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedHabits.size} habit{selectedHabits.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedHabits(new Set())}>
                Clear Selection
              </Button>
              <Button variant="destructive" size="sm" onClick={bulkDelete}>
                Delete Selected
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {habits.length} habits • {habits.reduce((sum, h) => sum + h.completions.length, 0)} total completions
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                {selectedHabits.size === filteredHabits.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => setHabits([])}
                disabled={habits.length === 0}
              >
                Clear All Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {habits.length === 0 ? (
        <div className="text-center py-12">
          <Target size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No habits yet</h3>
          <p className="text-gray-500">Start building better habits by adding your first one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHabits.map((habit) => {
            const todayCompletion = getTodayCompletion(habit);
            const streak = getStreakCount(habit);
            const weekProgress = getWeekProgress(habit);
            const progressPercentage = (todayCompletion.count / habit.target) * 100;

            return (
              <div key={habit.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedHabits.has(habit.id)}
                      onCheckedChange={() => toggleSelectHabit(habit.id)}
                    />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{habit.name}</h3>
                      {habit.description && (
                        <p className="text-sm text-gray-600">{habit.description}</p>
                      )}
                      <Badge variant="secondary" className="mt-1">{habit.category}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingHabit(habit)}>
                      <Edit2 size={12} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => confirmDeleteHabit(habit.id)}>
                      <Trash2 size={12} className="text-red-500" />
                    </Button>
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

      {/* Add Habit Dialog */}
      <Dialog open={isAddingHabit} onOpenChange={setIsAddingHabit}>
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
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={newHabit.category} onValueChange={(value: typeof newHabit.category) => setNewHabit(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={addHabit}>Add Habit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Habit Dialog */}
      <Dialog open={!!editingHabit} onOpenChange={() => setEditingHabit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Habit</DialogTitle>
          </DialogHeader>
          {editingHabit && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Habit Name</Label>
                <Input
                  id="edit-name"
                  value={editingHabit.name}
                  onChange={(e) => setEditingHabit(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editingHabit.description}
                  onChange={(e) => setEditingHabit(prev => prev ? { ...prev, description: e.target.value } : null)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-target">Daily Target</Label>
                  <Input
                    id="edit-target"
                    type="number"
                    min="1"
                    value={editingHabit.target}
                    onChange={(e) => setEditingHabit(prev => prev ? { ...prev, target: parseInt(e.target.value) || 1 } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-unit">Unit</Label>
                  <Input
                    id="edit-unit"
                    value={editingHabit.unit}
                    onChange={(e) => setEditingHabit(prev => prev ? { ...prev, unit: e.target.value } : null)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingHabit(null)}>
                  Cancel
                </Button>
                <Button onClick={updateHabit}>Update Habit</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to delete this habit? This action cannot be undone and will remove all completion data.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteHabit}>
              Delete Habit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
