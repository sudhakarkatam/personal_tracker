
import { useState } from 'react';
import { Plus, Edit2, Trash2, Dumbbell, Target, TrendingUp, Calendar } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

interface Exercise {
  id: string;
  name: string;
  category: 'strength' | 'cardio' | 'flexibility' | 'sports';
  muscleGroups: string[];
  equipment?: string;
}

interface WorkoutSet {
  reps: number;
  weight: number;
  duration?: number;
  restTime?: number;
}

interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
  notes?: string;
}

interface Workout {
  id: string;
  name: string;
  date: Date;
  exercises: WorkoutExercise[];
  duration: number;
  notes?: string;
  createdAt: Date;
}

export function GymTrackerEnhanced() {
  const [workouts, setWorkouts] = useLocalStorage<Workout[]>('workoutsEnhanced', []);
  const [exercises] = useLocalStorage<Exercise[]>('exercisesDatabase', [
    { id: '1', name: 'Bench Press', category: 'strength', muscleGroups: ['chest', 'triceps'], equipment: 'barbell' },
    { id: '2', name: 'Squat', category: 'strength', muscleGroups: ['quadriceps', 'glutes'], equipment: 'barbell' },
    { id: '3', name: 'Deadlift', category: 'strength', muscleGroups: ['hamstrings', 'back'], equipment: 'barbell' },
    { id: '4', name: 'Running', category: 'cardio', muscleGroups: ['legs'], equipment: 'none' },
    { id: '5', name: 'Pull-ups', category: 'strength', muscleGroups: ['back', 'biceps'], equipment: 'pull-up bar' }
  ]);
  
  const [isAddingWorkout, setIsAddingWorkout] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingWorkoutId, setDeletingWorkoutId] = useState<string | null>(null);

  const [newWorkout, setNewWorkout] = useState({
    name: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    exercises: [] as WorkoutExercise[],
    duration: 60,
    notes: ''
  });

  const addWorkout = () => {
    if (!newWorkout.name.trim() || newWorkout.exercises.length === 0) return;

    const workout: Workout = {
      id: Date.now().toString(),
      name: newWorkout.name,
      date: new Date(newWorkout.date),
      exercises: newWorkout.exercises,
      duration: newWorkout.duration,
      notes: newWorkout.notes,
      createdAt: new Date()
    };

    setWorkouts(prev => [...prev, workout]);
    resetForm();
    
    // Trigger data update event
    window.dispatchEvent(new Event('dataUpdated'));
  };

  const updateWorkout = () => {
    if (!editingWorkout) return;

    setWorkouts(prev =>
      prev.map(workout =>
        workout.id === editingWorkout.id ? editingWorkout : workout
      )
    );
    setEditingWorkout(null);
    
    // Trigger data update event
    window.dispatchEvent(new Event('dataUpdated'));
  };

  const confirmDeleteWorkout = (workoutId: string) => {
    setDeletingWorkoutId(workoutId);
    setShowDeleteConfirm(true);
  };

  const deleteWorkout = () => {
    if (!deletingWorkoutId) return;
    
    setWorkouts(prev => prev.filter(workout => workout.id !== deletingWorkoutId));
    setShowDeleteConfirm(false);
    setDeletingWorkoutId(null);
    
    // Trigger data update event
    window.dispatchEvent(new Event('dataUpdated'));
  };

  const resetForm = () => {
    setNewWorkout({
      name: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      exercises: [],
      duration: 60,
      notes: ''
    });
    setIsAddingWorkout(false);
  };

  const addExerciseToWorkout = (exerciseId: string) => {
    const exercise = exercises.find(ex => ex.id === exerciseId);
    if (!exercise) return;

    const workoutExercise: WorkoutExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: [{ reps: 10, weight: 0 }],
      notes: ''
    };

    setNewWorkout(prev => ({
      ...prev,
      exercises: [...prev.exercises, workoutExercise]
    }));
  };

  const updateExerciseInWorkout = (index: number, updates: Partial<WorkoutExercise>) => {
    setNewWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => i === index ? { ...ex, ...updates } : ex)
    }));
  };

  const removeExerciseFromWorkout = (index: number) => {
    setNewWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const addSetToExercise = (exerciseIndex: number) => {
    const newSet: WorkoutSet = { reps: 10, weight: 0 };
    setNewWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => 
        i === exerciseIndex 
          ? { ...ex, sets: [...ex.sets, newSet] }
          : ex
      )
    }));
  };

  const updateSet = (exerciseIndex: number, setIndex: number, updates: Partial<WorkoutSet>) => {
    setNewWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => 
        i === exerciseIndex 
          ? {
              ...ex,
              sets: ex.sets.map((set, j) => j === setIndex ? { ...set, ...updates } : set)
            }
          : ex
      )
    }));
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    setNewWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => 
        i === exerciseIndex 
          ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIndex) }
          : ex
      )
    }));
  };

  const getWorkoutStats = () => {
    const totalWorkouts = workouts.length;
    const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
    const avgDuration = totalWorkouts > 0 ? Math.round(totalDuration / totalWorkouts) : 0;
    
    return { totalWorkouts, totalDuration, avgDuration };
  };

  const stats = getWorkoutStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Gym Tracker</h2>
        <Button onClick={() => setIsAddingWorkout(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus size={16} className="mr-2" />
          Add Workout
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="text-blue-500" size={20} />
              <span className="text-sm font-medium">Total Workouts</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalWorkouts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="text-green-500" size={20} />
              <span className="text-sm font-medium">Total Hours</span>
            </div>
            <p className="text-2xl font-bold">{Math.round(stats.totalDuration / 60)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-orange-500" size={20} />
              <span className="text-sm font-medium">Avg Duration</span>
            </div>
            <p className="text-2xl font-bold">{stats.avgDuration} min</p>
          </CardContent>
        </Card>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Data Management</h3>
          <div className="flex gap-2">
            <span className="text-sm text-gray-500">{workouts.length} workouts stored</span>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => setWorkouts([])}
              disabled={workouts.length === 0}
            >
              Clear All Data
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-600">
          All your workout data persists across months and sessions.
        </p>
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
            <Card key={workout.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {workout.name}
                      <Badge variant="outline">{format(new Date(workout.date), 'MMM d')}</Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {workout.exercises.length} exercises • {workout.duration} minutes
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditingWorkout(workout)}>
                      <Edit2 size={12} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => confirmDeleteWorkout(workout.id)}>
                      <Trash2 size={12} className="text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {workout.exercises.map((exercise, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">{exercise.exerciseName}</h4>
                      <div className="grid grid-cols-4 gap-2 text-xs text-gray-600 mb-2">
                        <span>Set</span>
                        <span>Reps</span>
                        <span>Weight</span>
                        <span>Rest</span>
                      </div>
                      {exercise.sets.map((set, setIndex) => (
                        <div key={setIndex} className="grid grid-cols-4 gap-2 text-sm">
                          <span>{setIndex + 1}</span>
                          <span>{set.reps}</span>
                          <span>{set.weight} kg</span>
                          <span>{set.restTime || '-'}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  {workout.notes && (
                    <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                      <strong>Notes:</strong> {workout.notes}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Workout Dialog */}
      <Dialog open={isAddingWorkout} onOpenChange={setIsAddingWorkout}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Workout</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="workout-name">Workout Name</Label>
                <Input
                  id="workout-name"
                  value={newWorkout.name}
                  onChange={(e) => setNewWorkout(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Upper Body Strength"
                />
              </div>
              <div>
                <Label htmlFor="workout-date">Date</Label>
                <Input
                  id="workout-date"
                  type="date"
                  value={newWorkout.date}
                  onChange={(e) => setNewWorkout(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={newWorkout.duration}
                onChange={(e) => setNewWorkout(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Exercises</Label>
                <Select onValueChange={addExerciseToWorkout}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Add exercise" />
                  </SelectTrigger>
                  <SelectContent>
                    {exercises.map(exercise => (
                      <SelectItem key={exercise.id} value={exercise.id}>
                        {exercise.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                {newWorkout.exercises.map((exercise, exerciseIndex) => (
                  <div key={exerciseIndex} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">{exercise.exerciseName}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExerciseFromWorkout(exerciseIndex)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {exercise.sets.map((set, setIndex) => (
                        <div key={setIndex} className="flex items-center gap-2">
                          <span className="w-8 text-sm">#{setIndex + 1}</span>
                          <Input
                            type="number"
                            placeholder="Reps"
                            value={set.reps}
                            onChange={(e) => updateSet(exerciseIndex, setIndex, { reps: parseInt(e.target.value) || 0 })}
                            className="w-20"
                          />
                          <Input
                            type="number"
                            placeholder="Weight"
                            value={set.weight}
                            onChange={(e) => updateSet(exerciseIndex, setIndex, { weight: parseInt(e.target.value) || 0 })}
                            className="w-24"
                          />
                          <span className="text-sm text-gray-500">kg</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSet(exerciseIndex, setIndex)}
                            disabled={exercise.sets.length === 1}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addSetToExercise(exerciseIndex)}
                      >
                        <Plus size={14} className="mr-1" />
                        Add Set
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="workout-notes">Notes</Label>
              <Input
                id="workout-notes"
                value={newWorkout.notes}
                onChange={(e) => setNewWorkout(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Workout notes..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button onClick={addWorkout}>Add Workout</Button>
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
                <Label htmlFor="edit-duration">Duration (minutes)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  value={editingWorkout.duration}
                  onChange={(e) => setEditingWorkout(prev => prev ? { ...prev, duration: parseInt(e.target.value) || 0 } : null)}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to delete this workout? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteWorkout}>
              Delete Workout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
