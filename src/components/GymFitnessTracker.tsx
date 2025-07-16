
import { useState } from 'react';
import { Plus, ArrowLeft, Dumbbell, Target, TrendingUp, Edit2, Trash2 } from 'lucide-react';
import { Workout } from '@/types';
import { useLocalStorageWithDates } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface GymFitnessTrackerProps {
  onBack: () => void;
}

export function GymFitnessTracker({ onBack }: GymFitnessTrackerProps) {
  const [workouts, setWorkouts] = useLocalStorageWithDates<Workout[]>('workouts', [], ['date']);
  const [isAddingWorkout, setIsAddingWorkout] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [newWorkout, setNewWorkout] = useState({
    name: '',
    type: 'strength' as 'strength' | 'cardio' | 'flexibility' | 'mixed',
    duration: 60,
    notes: '',
    exercises: ''
  });

  const addWorkout = () => {
    if (!newWorkout.name.trim()) return;

    const workout: Workout = {
      id: Date.now().toString(),
      name: newWorkout.name,
      type: newWorkout.type,
      duration: newWorkout.duration,
      date: new Date(),
      exercises: newWorkout.exercises ? newWorkout.exercises.split(',').map(ex => ({
        id: Date.now().toString() + Math.random(),
        exerciseId: '',
        exerciseName: ex.trim(),
        sets: [],
        notes: ''
      })) : [],
      notes: newWorkout.notes,
      createdAt: new Date()
    };

    setWorkouts(prev => [workout, ...prev]);
    resetForm();
  };

  const updateWorkout = () => {
    if (!editingWorkout) return;

    setWorkouts(prev => prev.map(workout => workout.id === editingWorkout.id ? editingWorkout : workout));
    setEditingWorkout(null);
  };

  const deleteWorkout = (workoutId: string) => {
    setWorkouts(prev => prev.filter(workout => workout.id !== workoutId));
  };

  const resetForm = () => {
    setNewWorkout({
      name: '',
      type: 'strength',
      duration: 60,
      notes: '',
      exercises: ''
    });
    setIsAddingWorkout(false);
  };

  const getWorkoutStats = () => {
    const totalWorkouts = workouts.length;
    const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
    const avgDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;
    
    return { totalWorkouts, totalDuration, avgDuration };
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'strength': return 'bg-red-100 text-red-800';
      case 'cardio': return 'bg-blue-100 text-blue-800';
      case 'flexibility': return 'bg-green-100 text-green-800';
      case 'mixed': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = getWorkoutStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <h2 className="text-2xl font-bold text-gray-800 flex-1">Gym & Fitness Tracker</h2>
        <Button onClick={() => setIsAddingWorkout(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus size={16} className="mr-2" />
          Add Workout
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800">Total Workouts</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.totalWorkouts}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="font-semibold text-green-800">Total Hours</h3>
          <p className="text-2xl font-bold text-green-600">{Math.round(stats.totalDuration / 60)}</p>
        </div>
      </div>

      {/* Workouts List */}
      <div className="space-y-4">
        {workouts.length === 0 ? (
          <div className="text-center py-12">
            <Dumbbell size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No workouts yet</h3>
            <p className="text-gray-500">Start tracking your fitness journey!</p>
          </div>
        ) : (
          workouts.map(workout => (
            <div key={workout.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800">{workout.name}</h3>
                    <Badge className={getTypeColor(workout.type || 'strength')}>
                      {workout.type || 'strength'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {workout.duration} minutes • {format(new Date(workout.date), 'MMM d, yyyy')}
                  </p>
                  {workout.exercises && workout.exercises.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Exercises: {workout.exercises.map(ex => ex.exerciseName).join(', ')}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingWorkout(workout)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Edit2 size={12} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteWorkout(workout.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
              
              {workout.notes && (
                <div className="bg-gray-50 p-2 rounded text-sm">
                  <p className="text-gray-700">{workout.notes}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Workout Dialog */}
      <Dialog open={isAddingWorkout} onOpenChange={setIsAddingWorkout}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Workout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Workout Name</Label>
              <Input
                id="name"
                value={newWorkout.name}
                onChange={(e) => setNewWorkout(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Upper Body Strength"
              />
            </div>
            <div>
              <Label htmlFor="type">Workout Type</Label>
              <Select value={newWorkout.type} onValueChange={(value: 'strength' | 'cardio' | 'flexibility' | 'mixed') => setNewWorkout(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strength">Strength Training</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                  <SelectItem value="flexibility">Flexibility</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={newWorkout.duration}
                onChange={(e) => setNewWorkout(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
              />
            </div>
            <div>
              <Label htmlFor="exercises">Exercises (comma separated)</Label>
              <Input
                id="exercises"
                value={newWorkout.exercises}
                onChange={(e) => setNewWorkout(prev => ({ ...prev, exercises: e.target.value }))}
                placeholder="e.g., Bench Press, Squats, Running"
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newWorkout.notes}
                onChange={(e) => setNewWorkout(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="How did the workout go?"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={addWorkout}>Add Workout</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Workout Dialog */}
      <Dialog open={!!editingWorkout} onOpenChange={() => setEditingWorkout(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Workout</DialogTitle>
          </DialogHeader>
          {editingWorkout && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Workout Name</Label>
                <Input
                  id="edit-name"
                  value={editingWorkout.name}
                  onChange={(e) => setEditingWorkout(prev => prev ? { ...prev, name: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit-type">Workout Type</Label>
                <Select value={editingWorkout.type || 'strength'} onValueChange={(value: 'strength' | 'cardio' | 'flexibility' | 'mixed') => setEditingWorkout(prev => prev ? { ...prev, type: value } : null)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strength">Strength Training</SelectItem>
                    <SelectItem value="cardio">Cardio</SelectItem>
                    <SelectItem value="flexibility">Flexibility</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-duration">Duration (minutes)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  min="1"
                  value={editingWorkout.duration}
                  onChange={(e) => setEditingWorkout(prev => prev ? { ...prev, duration: parseInt(e.target.value) || 60 } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editingWorkout.notes || ''}
                  onChange={(e) => setEditingWorkout(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingWorkout(null)}>
                  Cancel
                </Button>
                <Button onClick={updateWorkout}>Update Workout</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
