import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Moon, Droplets, Activity, TrendingUp, Zap, Target, Scale, Footprints, Pill, Calendar, Brain, Battery } from 'lucide-react';
import { WellnessEntry } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, subDays, startOfWeek, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface WellnessTrackerProps {
  onBack: () => void;
}

export function WellnessTracker({ onBack }: WellnessTrackerProps) {
  const [wellnessData, setWellnessData] = useLocalStorage<WellnessEntry[]>('wellness', []);
  const [dailyWaterGoal] = useLocalStorage('dailyWaterGoal', 8);
  const [habits, setHabits] = useState([]);
  const [habitsEnhanced, setHabitsEnhanced] = useState([]);
  const [medications, setMedications] = useLocalStorage('medications', []);
  const [symptoms, setSymptoms] = useLocalStorage('symptoms', []);
  
  // Load habits data
  useEffect(() => {
    const loadHabits = () => {
      try {
        const storedHabits = JSON.parse(localStorage.getItem('habits') || '[]');
        const storedHabitsEnhanced = JSON.parse(localStorage.getItem('habitsEnhanced') || '[]');
        setHabits(storedHabits);
        setHabitsEnhanced(storedHabitsEnhanced.filter((h: any) => h.isActive));
      } catch (error) {
        console.error('Error loading habits:', error);
      }
    };

    loadHabits();
    
    // Listen for habit updates
    const handleHabitsUpdate = () => {
      loadHabits();
    };

    window.addEventListener('dataUpdated', handleHabitsUpdate);
    return () => window.removeEventListener('dataUpdated', handleHabitsUpdate);
  }, []);
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayEntry = wellnessData.find(entry => entry.date === today) || {
    id: Date.now().toString(),
    date: today,
    waterGlasses: 0,
    sleepHours: 0,
    mood: 'neutral' as const,
    notes: '',
    weight: undefined,
    energyLevel: 5,
    stressLevel: 5,
    steps: 0,
    heartRate: undefined,
    symptoms: [],
    medications: []
  };

  const updateWellness = (updates: Partial<WellnessEntry>) => {
    const newEntry = { ...todayEntry, ...updates };
    setWellnessData(prev => {
      const filtered = prev.filter(entry => entry.date !== today);
      return [...filtered, newEntry];
    });
    
    // Trigger data update event
    window.dispatchEvent(new Event('dataUpdated'));
  };

  const getWeeklyData = () => {
    const startWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startWeek, i));
    
    return weekDays.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const entry = wellnessData.find(e => e.date === dateStr);
      
      // Get habits completion for this day
      const allHabits = [...habits, ...habitsEnhanced];
      const dayHabits = allHabits.map(habit => {
        const completion = habit.completions?.find((c: any) => c.date === dateStr);
        return {
          ...habit,
          completed: completion?.completed || false,
          progress: completion ? (completion.count / habit.target) * 100 : 0
        };
      });
      
      return {
        date: day,
        entry: entry || { id: '', date: dateStr, waterGlasses: 0, sleepHours: 0, mood: 'neutral' as const },
        habits: dayHabits
      };
    });
  };

  const getAverages = () => {
    const lastWeek = wellnessData.filter(entry => {
      const entryDate = new Date(entry.date);
      const weekAgo = subDays(new Date(), 7);
      return entryDate >= weekAgo;
    });

    if (lastWeek.length === 0) return { 
      sleep: 0, 
      water: 0, 
      mood: 0, 
      energy: 0, 
      stress: 0, 
      habitCompletion: 0,
      steps: 0
    };

    // Calculate habit completion average
    const allHabits = [...habits, ...habitsEnhanced];
    let habitCompletionSum = 0;
    let habitCompletionCount = 0;

    lastWeek.forEach(entry => {
      allHabits.forEach(habit => {
        const completion = habit.completions?.find((c: any) => c.date === entry.date);
        if (completion) {
          habitCompletionSum += completion.completed ? 100 : 0;
          habitCompletionCount++;
        }
      });
    });

    const habitCompletion = habitCompletionCount > 0 ? habitCompletionSum / habitCompletionCount : 0;

    // Convert mood strings to numbers for calculation
    const getMoodValue = (mood: string | undefined) => {
      if (!mood) return 5;
      switch (mood) {
        case 'terrible': return 1;
        case 'poor': return 3;
        case 'neutral': return 5;
        case 'good': return 7;
        case 'excellent': return 10;
        default: return 5;
      }
    };

    return {
      sleep: lastWeek.reduce((sum, e) => sum + (e.sleepHours || 0), 0) / lastWeek.length,
      water: lastWeek.reduce((sum, e) => sum + e.waterGlasses, 0) / lastWeek.length,
      mood: lastWeek.reduce((sum, e) => sum + getMoodValue(e.mood), 0) / lastWeek.length,
      energy: lastWeek.reduce((sum, e) => sum + (e.energyLevel || 0), 0) / lastWeek.length,
      stress: lastWeek.reduce((sum, e) => sum + (e.stressLevel || 0), 0) / lastWeek.length,
      steps: lastWeek.reduce((sum, e) => sum + (e.steps || 0), 0) / lastWeek.length,
      habitCompletion
    };
  };

  const getWellnessScore = () => {
    const averages = getAverages();
    
    // Calculate overall wellness score (0-100)
    const sleepScore = Math.min((averages.sleep / 8) * 100, 100);
    const waterScore = Math.min((averages.water / dailyWaterGoal) * 100, 100);
    const moodScore = (averages.mood / 10) * 100;
    const energyScore = (averages.energy / 10) * 100;
    const stressScore = ((10 - averages.stress) / 10) * 100; // Lower stress is better
    const habitScore = averages.habitCompletion;
    const activityScore = Math.min((averages.steps / 10000) * 100, 100);
    
    const overallScore = (sleepScore + waterScore + moodScore + energyScore + stressScore + habitScore + activityScore) / 7;
    return Math.round(overallScore);
  };

  const weeklyData = getWeeklyData();
  const averages = getAverages();
  const wellnessScore = getWellnessScore();
  const waterProgress = (todayEntry.waterGlasses / dailyWaterGoal) * 100;

  const adjustWater = (delta: number) => {
    const newCount = Math.max(0, todayEntry.waterGlasses + delta);
    updateWellness({ waterGlasses: newCount });
  };

  const moodEmojis = ['😢', '😕', '😐', '🙂', '😊', '😄', '🤩', '🥳', '🌟', '✨'];
  const moodLabels = ['Terrible', 'Bad', 'Poor', 'Fair', 'OK', 'Good', 'Great', 'Excellent', 'Amazing', 'Perfect'];

  const getMoodIndex = (mood: string | undefined) => {
    switch (mood) {
      case 'terrible': return 0;
      case 'poor': return 2;
      case 'neutral': return 4;
      case 'good': return 6;
      case 'excellent': return 8;
      default: return 4;
    }
  };

  const getMoodFromIndex = (index: number): 'excellent' | 'good' | 'neutral' | 'poor' | 'terrible' => {
    if (index <= 1) return 'terrible';
    if (index <= 3) return 'poor';
    if (index <= 5) return 'neutral';
    if (index <= 7) return 'good';
    return 'excellent';
  };

  const currentMoodIndex = getMoodIndex(todayEntry.mood);

  const addMedication = (medication: string) => {
    if (!medication.trim()) return;
    const newMed = {
      id: Date.now().toString(),
      name: medication,
      dosage: '',
      frequency: 'daily',
      time: '',
      createdAt: new Date()
    };
    setMedications(prev => [...prev, newMed]);
  };

  const addSymptom = (symptom: string, severity: number) => {
    if (!symptom.trim()) return;
    const newSymptom = {
      id: Date.now().toString(),
      name: symptom,
      severity,
      date: today,
      notes: ''
    };
    setSymptoms(prev => [...prev, newSymptom]);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <h2 className="text-2xl font-bold text-gray-800 flex-1">Comprehensive Wellness Tracker</h2>
        <div className="flex items-center gap-2">
          <Target className="text-purple-500" size={20} />
          <span className="text-sm font-medium">Wellness Score: {wellnessScore}%</span>
        </div>
      </div>

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
          <TabsTrigger value="habits">Habits</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          {/* Water Intake */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Droplets className="text-blue-500" size={20} />
                Water Intake
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>{todayEntry.waterGlasses} / {dailyWaterGoal} glasses</span>
                    <span>{Math.round(waterProgress)}%</span>
                  </div>
                  <Progress value={waterProgress} className="h-3" />
                </div>
                
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustWater(-1)}
                    disabled={todayEntry.waterGlasses <= 0}
                  >
                    -
                  </Button>
                  <div className="text-2xl font-bold text-blue-600 min-w-[3rem] text-center">
                    {todayEntry.waterGlasses}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustWater(1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sleep, Energy, and Mood Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Moon className="text-purple-500" size={20} />
                  Sleep
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={todayEntry.sleepHours || ''}
                    onChange={(e) => updateWellness({ sleepHours: parseFloat(e.target.value) || 0 })}
                    placeholder="Hours"
                    className="text-center"
                  />
                  {todayEntry.sleepHours && todayEntry.sleepHours > 0 && (
                    <div className="text-xs text-center">
                      {todayEntry.sleepHours >= 7 && todayEntry.sleepHours <= 9 ? (
                        <span className="text-green-600">✓ Optimal range</span>
                      ) : todayEntry.sleepHours < 7 ? (
                        <span className="text-orange-600">⚠ Consider more sleep</span>
                      ) : (
                        <span className="text-blue-600">ℹ That's a lot!</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Battery className="text-yellow-500" size={20} />
                  Energy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Input
                    type="range"
                    min="1"
                    max="10"
                    value={todayEntry.energyLevel || 5}
                    onChange={(e) => updateWellness({ energyLevel: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Low</span>
                    <span className="font-medium">{todayEntry.energyLevel || 5}</span>
                    <span>High</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="text-pink-500" size={20} />
                  Mood
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-center">
                    <div className="text-3xl mb-1">
                      {moodEmojis[currentMoodIndex]}
                    </div>
                    <p className="text-xs text-gray-600">
                      {moodLabels[currentMoodIndex]}
                    </p>
                  </div>
                  <Input
                    type="range"
                    min="0"
                    max="8"
                    value={currentMoodIndex}
                    onChange={(e) => updateWellness({ mood: getMoodFromIndex(parseInt(e.target.value)) })}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity and Stress */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Footprints className="text-green-500" size={20} />
                  Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Steps</Label>
                    <Input
                      type="number"
                      value={todayEntry.steps || ''}
                      onChange={(e) => updateWellness({ steps: parseInt(e.target.value) || 0 })}
                      placeholder="10,000"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="text-red-500" size={20} />
                  Stress & Weight
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Stress Level (1-10)</Label>
                    <Input
                      type="range"
                      min="1"
                      max="10"
                      value={todayEntry.stressLevel || 5}
                      onChange={(e) => updateWellness({ stressLevel: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Low</span>
                      <span className="font-medium">{todayEntry.stressLevel || 5}</span>
                      <span>High</span>
                    </div>
                  </div>
                  <div>
                    <Label>Weight (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={todayEntry.weight || ''}
                      onChange={(e) => updateWellness({ weight: parseFloat(e.target.value) || undefined })}
                      placeholder="70.5"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Daily Notes & Reflections</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={todayEntry.notes || ''}
                onChange={(e) => updateWellness({ notes: e.target.value })}
                placeholder="How are you feeling today? Any observations about your wellness, energy, or mood..."
                rows={3}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Keep existing trends, health, and habits tabs with similar fixes */}
        
        <TabsContent value="trends" className="space-y-4">
          {/* Enhanced Weekly Overview with Habits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="text-blue-500" size={20} />
                Weekly Overview & Habits Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Week Averages with Habits */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-xs text-blue-600 mb-1">Avg Sleep</div>
                    <div className="text-lg font-bold text-blue-800">
                      {averages.sleep.toFixed(1)}h
                    </div>
                  </div>
                  <div className="bg-cyan-50 rounded-lg p-3">
                    <div className="text-xs text-cyan-600 mb-1">Avg Water</div>
                    <div className="text-lg font-bold text-cyan-800">
                      {averages.water.toFixed(1)}
                    </div>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-3">
                    <div className="text-xs text-pink-600 mb-1">Avg Mood</div>
                    <div className="text-lg font-bold text-pink-800">
                      {averages.mood.toFixed(1)}/10
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-xs text-purple-600 mb-1">Habit Success</div>
                    <div className="text-lg font-bold text-purple-800">
                      {averages.habitCompletion.toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Daily Habits Overview */}
                {(habits.length > 0 || habitsEnhanced.length > 0) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Daily Habits Integration</h4>
                    <div className="space-y-3">
                      {[...habits, ...habitsEnhanced].slice(0, 6).map((habit: any) => (
                        <div key={habit.id} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{habit.icon}</span>
                            <span className="font-medium text-sm">{habit.name}</span>
                            <Badge variant="outline" className="text-xs">{habit.category}</Badge>
                          </div>
                          <div className="grid grid-cols-7 gap-1">
                            {weeklyData.map((day, index) => {
                              const dayHabit = day.habits.find(h => h.id === habit.id);
                              const completed = dayHabit?.completed || false;
                              const progress = dayHabit?.progress || 0;
                              return (
                                <div
                                  key={index}
                                  className={cn(
                                    "h-8 rounded flex items-center justify-center text-xs font-medium relative",
                                    completed 
                                      ? "bg-green-500 text-white" 
                                      : progress > 0
                                      ? "bg-yellow-300 text-yellow-800"
                                      : "bg-gray-200 text-gray-500"
                                  )}
                                >
                                  {format(day.date, 'EEE')[0]}
                                  {progress > 0 && progress < 100 && (
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-400 rounded-b" 
                                         style={{ width: `${progress}%` }} />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weekly Wellness Chart */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Wellness Metrics This Week</h4>
                  <div className="space-y-3">
                    {weeklyData.map((day, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-12 text-xs text-gray-500">
                          {format(day.date, 'EEE')}
                        </div>
                        <div className="flex-1 grid grid-cols-4 gap-2">
                          <div className="flex items-center gap-1">
                            <Moon size={12} className="text-purple-400" />
                            <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
                              <div 
                                className="h-full bg-purple-400"
                                style={{ width: `${Math.min((day.entry.sleepHours || 0) / 10 * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-8">
                              {day.entry.sleepHours || 0}h
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Droplets size={12} className="text-blue-400" />
                            <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
                              <div 
                                className="h-full bg-blue-400"
                                style={{ width: `${Math.min((day.entry.waterGlasses / dailyWaterGoal) * 100, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-6">
                              {day.entry.waterGlasses}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart size={12} className="text-pink-400" />
                            <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
                              <div 
                                className="h-full bg-pink-400"
                                style={{ width: `${(getMoodIndex(day.entry.mood) / 8) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-6">
                              {getMoodIndex(day.entry.mood)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap size={12} className="text-purple-400" />
                            <div className="flex-1 h-2 bg-gray-200 rounded overflow-hidden">
                              <div 
                                className="h-full bg-purple-400"
                                style={{ 
                                  width: `${day.habits.length > 0 
                                    ? (day.habits.filter(h => h.completed).length / day.habits.length) * 100 
                                    : 0}%` 
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-8">
                              {day.habits.length > 0 
                                ? `${day.habits.filter(h => h.completed).length}/${day.habits.length}`
                                : '0/0'
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          {/* Health Metrics */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="text-red-500" size={20} />
                  Vital Signs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Heart Rate (bpm)</Label>
                  <Input
                    type="number"
                    value={todayEntry.heartRate || ''}
                    onChange={(e) => updateWellness({ heartRate: parseInt(e.target.value) || undefined })}
                    placeholder="70"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="text-blue-500" size={20} />
                  Medications & Symptoms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Today's Symptoms</Label>
                  <div className="flex gap-2 mt-1">
                    <Input placeholder="Add symptom..." />
                    <Button size="sm">Add</Button>
                  </div>
                </div>
                <div>
                  <Label>Medications Taken</Label>
                  <div className="mt-2 space-y-2">
                    {medications.slice(0, 3).map((med: any) => (
                      <div key={med.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{med.name}</span>
                        <Switch />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="habits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Habit-Wellness Correlation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...habits, ...habitsEnhanced].slice(0, 5).map((habit: any) => {
                  // Calculate correlation between habit completion and wellness metrics
                  const habitData = wellnessData.slice(-7).map(entry => {
                    const completion = habit.completions?.find((c: any) => c.date === entry.date);
                    return {
                      completed: completion?.completed || false,
                      mood: getMoodIndex(entry.mood),
                      energy: entry.energyLevel || 0,
                      sleep: entry.sleepHours || 0
                    };
                  });

                  const avgMoodWhenCompleted = habitData.filter(d => d.completed).reduce((sum, d) => sum + d.mood, 0) / 
                    (habitData.filter(d => d.completed).length || 1);
                  const avgMoodWhenNotCompleted = habitData.filter(d => !d.completed).reduce((sum, d) => sum + d.mood, 0) / 
                    (habitData.filter(d => !d.completed).length || 1);

                  return (
                    <div key={habit.id} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{habit.icon}</span>
                        <span className="font-medium">{habit.name}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p>Mood when completed: {avgMoodWhenCompleted.toFixed(1)}/10</p>
                        <p>Mood when not completed: {avgMoodWhenNotCompleted.toFixed(1)}/10</p>
                        <p className={`font-medium ${avgMoodWhenCompleted > avgMoodWhenNotCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                          {avgMoodWhenCompleted > avgMoodWhenNotCompleted ? 
                            `+${(avgMoodWhenCompleted - avgMoodWhenNotCompleted).toFixed(1)} mood boost` :
                            'No clear correlation'
                          }
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
