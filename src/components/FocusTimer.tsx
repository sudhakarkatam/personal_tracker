
import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Settings, Clock, Edit2, Trash2, Plus } from 'lucide-react';
import { FocusSession } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type TimerMode = 'focus' | 'short-break' | 'long-break';

export function FocusTimer() {
  const [sessions, setSessions] = useLocalStorage<FocusSession[]>('focusSessions', []);
  const [focusDuration, setFocusDuration] = useLocalStorage('focusDuration', 25);
  const [shortBreakDuration, setShortBreakDuration] = useLocalStorage('shortBreakDuration', 5);
  const [longBreakDuration, setLongBreakDuration] = useLocalStorage('longBreakDuration', 15);
  
  const [currentMode, setCurrentMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [editingSession, setEditingSession] = useState<FocusSession | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const getModeDuration = (mode: TimerMode) => {
    switch (mode) {
      case 'focus': return focusDuration;
      case 'short-break': return shortBreakDuration;
      case 'long-break': return longBreakDuration;
    }
  };

  const getModeColor = (mode: TimerMode) => {
    switch (mode) {
      case 'focus': return 'text-red-600 bg-red-50';
      case 'short-break': return 'text-green-600 bg-green-50';
      case 'long-break': return 'text-blue-600 bg-blue-50';
    }
  };

  const getModeTitle = (mode: TimerMode) => {
    switch (mode) {
      case 'focus': return 'Focus Time';
      case 'short-break': return 'Short Break';
      case 'long-break': return 'Long Break';
    }
  };

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsRunning(false);
    
    // Save completed session
    const session: FocusSession = {
      id: Date.now().toString(),
      duration: getModeDuration(currentMode),
      type: currentMode,
      technique: 'pomodoro',
      completed: true,
      date: new Date(),
      quality: 5,
      distractions: 0,
      notes: ''
    };
    setSessions(prev => [...prev, session]);

    // Play notification sound
    try {
      // Create a simple beep sound programmatically
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
    } catch (error) {
      console.log('Audio notification not supported');
    }

    // Auto-switch to next mode
    if (currentMode === 'focus') {
      setCompletedPomodoros(prev => prev + 1);
      const nextMode = completedPomodoros + 1 >= 4 ? 'long-break' : 'short-break';
      switchMode(nextMode);
    } else {
      switchMode('focus');
      if (currentMode === 'long-break') {
        setCompletedPomodoros(0);
      }
    }
  };

  const switchMode = (mode: TimerMode) => {
    setCurrentMode(mode);
    setTimeLeft(getModeDuration(mode) * 60);
    setIsRunning(false);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getModeDuration(currentMode) * 60);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const updateDuration = (mode: TimerMode, duration: number) => {
    if (mode === 'focus') setFocusDuration(duration);
    else if (mode === 'short-break') setShortBreakDuration(duration);
    else setLongBreakDuration(duration);
    
    if (mode === currentMode) {
      setTimeLeft(duration * 60);
    }
  };

  const updateSession = () => {
    if (!editingSession) return;

    setSessions(prev =>
      prev.map(session =>
        session.id === editingSession.id ? editingSession : session
      )
    );
    setEditingSession(null);
  };

  const confirmDeleteSession = (sessionId: string) => {
    setDeletingSessionId(sessionId);
    setShowDeleteConfirm(true);
  };

  const deleteSession = () => {
    if (!deletingSessionId) return;
    
    setSessions(prev => prev.filter(session => session.id !== deletingSessionId));
    setShowDeleteConfirm(false);
    setDeletingSessionId(null);
  };

  const clearAllSessions = () => {
    setSessions([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className={cn(
            "inline-block px-4 py-2 rounded-full mb-6 text-sm font-medium",
            getModeColor(currentMode)
          )}>
            {getModeTitle(currentMode)}
          </div>

          <div className="text-6xl font-mono font-bold text-gray-800 mb-8">
            {formatTime(timeLeft)}
          </div>

          <div className="flex justify-center gap-4 mb-8">
            <Button
              onClick={toggleTimer}
              size="lg"
              className={cn(
                "w-16 h-16 rounded-full",
                isRunning ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
              )}
            >
              {isRunning ? <Pause size={24} /> : <Play size={24} />}
            </Button>
            
            <Button
              onClick={resetTimer}
              size="lg"
              variant="outline"
              className="w-16 h-16 rounded-full"
            >
              <RotateCcw size={24} />
            </Button>
          </div>

          <div className="flex justify-center gap-2 mb-6">
            {['focus', 'short-break', 'long-break'].map((mode) => (
              <Button
                key={mode}
                onClick={() => switchMode(mode as TimerMode)}
                variant={currentMode === mode ? "default" : "outline"}
                size="sm"
                className="text-xs"
              >
                {mode === 'focus' ? 'Focus' : mode === 'short-break' ? 'Short' : 'Long'}
              </Button>
            ))}
          </div>

          <div className="text-sm text-gray-600 mb-4">
            Pomodoros completed today: {completedPomodoros}
          </div>

          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings size={16} className="mr-2" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Timer Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="focus-duration">Focus Duration (minutes)</Label>
                  <Input
                    id="focus-duration"
                    type="number"
                    value={focusDuration}
                    onChange={(e) => updateDuration('focus', parseInt(e.target.value) || 25)}
                    min="1"
                    max="60"
                  />
                </div>
                <div>
                  <Label htmlFor="short-break-duration">Short Break Duration (minutes)</Label>
                  <Input
                    id="short-break-duration"
                    type="number"
                    value={shortBreakDuration}
                    onChange={(e) => updateDuration('short-break', parseInt(e.target.value) || 5)}
                    min="1"
                    max="30"
                  />
                </div>
                <div>
                  <Label htmlFor="long-break-duration">Long Break Duration (minutes)</Label>
                  <Input
                    id="long-break-duration"
                    type="number"
                    value={longBreakDuration}
                    onChange={(e) => updateDuration('long-break', parseInt(e.target.value) || 15)}
                    min="1"
                    max="60"
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Data Management */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Data Management</h3>
            <div className="flex gap-2">
              <span className="text-sm text-gray-500">{sessions.length} sessions stored</span>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={clearAllSessions}
                disabled={sessions.length === 0}
              >
                Clear All Data
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-600">
            All your focus sessions are saved and can be edited or deleted.
          </p>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <Clock size={18} />
              Recent Sessions
            </h3>
          </div>
          <div className="space-y-2">
            {sessions.slice(-5).reverse().map((session) => (
              <div key={session.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                <div>
                  <span className="capitalize font-medium">{session.type}</span>
                  <span className="text-gray-500 ml-2">
                    {session.duration}m • {new Date(session.date).toLocaleTimeString()}
                  </span>
                  {session.notes && (
                    <p className="text-xs text-gray-600 mt-1">{session.notes}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditingSession(session)}>
                    <Edit2 size={12} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => confirmDeleteSession(session.id)}>
                    <Trash2 size={12} className="text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
            {sessions.length === 0 && (
              <p className="text-gray-500 text-sm">No sessions yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Session Dialog */}
      <Dialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Focus Session</DialogTitle>
          </DialogHeader>
          {editingSession && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-duration">Duration (minutes)</Label>
                <Input
                  id="edit-duration"
                  type="number"
                  value={editingSession.duration}
                  onChange={(e) => setEditingSession(prev => prev ? { ...prev, duration: parseInt(e.target.value) || 0 } : null)}
                  min="1"
                  max="120"
                />
              </div>
              <div>
                <Label htmlFor="edit-quality">Quality (1-10)</Label>
                <Input
                  id="edit-quality"
                  type="number"
                  value={editingSession.quality}
                  onChange={(e) => setEditingSession(prev => prev ? { ...prev, quality: parseInt(e.target.value) || 5 } : null)}
                  min="1"
                  max="10"
                />
              </div>
              <div>
                <Label htmlFor="edit-distractions">Distractions</Label>
                <Input
                  id="edit-distractions"
                  type="number"
                  value={editingSession.distractions}
                  onChange={(e) => setEditingSession(prev => prev ? { ...prev, distractions: parseInt(e.target.value) || 0 } : null)}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editingSession.notes || ''}
                  onChange={(e) => setEditingSession(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  placeholder="Session notes..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingSession(null)}>
                  Cancel
                </Button>
                <Button onClick={updateSession}>Update Session</Button>
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
            Are you sure you want to delete this focus session? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteSession}>
              Delete Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
