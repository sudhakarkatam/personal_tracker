
import { useState } from 'react';
import { Plus, Heart, Activity, Brain, Smile, Edit2, Trash2, Search, Download, Calendar } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { format, isToday, startOfWeek, endOfWeek } from 'date-fns';

interface WellnessEntry {
  id: string;
  date: Date;
  mood: 'excellent' | 'good' | 'neutral' | 'poor' | 'terrible';
  energy: number;
  stress: number;
  sleep: number;
  exercise: boolean;
  symptoms?: string[];
  notes?: string;
  tags?: string[];
  waterIntake?: number;
  meditationMinutes?: number;
  createdAt: Date;
}

export function WellnessTrackerEnhanced() {
  const [entries, setEntries] = useLocalStorage<WellnessEntry[]>('wellnessEntriesEnhanced', []);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WellnessEntry | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');

  const [newEntry, setNewEntry] = useState({
    mood: 'neutral' as WellnessEntry['mood'],
    energy: 5,
    stress: 5,
    sleep: 7,
    exercise: false,
    symptoms: [] as string[],
    notes: '',
    waterIntake: 8,
    meditationMinutes: 0,
    tags: [] as string[]
  });

  const moodOptions = [
    { value: 'excellent', label: 'Excellent', color: 'bg-green-500' },
    { value: 'good', label: 'Good', color: 'bg-blue-500' },
    { value: 'neutral', label: 'Neutral', color: 'bg-yellow-500' },
    { value: 'poor', label: 'Poor', color: 'bg-orange-500' },
    { value: 'terrible', label: 'Terrible', color: 'bg-red-500' }
  ];

  const addEntry = () => {
    const entry: WellnessEntry = {
      id: Date.now().toString(),
      date: new Date(),
      mood: newEntry.mood,
      energy: newEntry.energy,
      stress: newEntry.stress,
      sleep: newEntry.sleep,
      exercise: newEntry.exercise,
      symptoms: newEntry.symptoms.filter(s => s.trim()),
      notes: newEntry.notes,
      waterIntake: newEntry.waterIntake,
      meditationMinutes: newEntry.meditationMinutes,
      tags: newEntry.tags.filter(t => t.trim()),
      createdAt: new Date()
    };

    setEntries(prev => [...prev, entry]);
    resetForm();
    
    // Trigger data update event
    window.dispatchEvent(new Event('dataUpdated'));
  };

  const updateEntry = () => {
    if (!editingEntry) return;

    setEntries(prev =>
      prev.map(entry =>
        entry.id === editingEntry.id ? editingEntry : entry
      )
    );
    setEditingEntry(null);
    
    // Trigger data update event
    window.dispatchEvent(new Event('dataUpdated'));
  };

  const confirmDeleteEntry = (entryId: string) => {
    setDeletingEntryId(entryId);
    setShowDeleteConfirm(true);
  };

  const deleteEntry = () => {
    if (!deletingEntryId) return;
    
    setEntries(prev => prev.filter(entry => entry.id !== deletingEntryId));
    setShowDeleteConfirm(false);
    setDeletingEntryId(null);
    
    // Trigger data update event
    window.dispatchEvent(new Event('dataUpdated'));
  };

  const bulkDelete = () => {
    setEntries(prev => prev.filter(entry => !selectedEntries.has(entry.id)));
    setSelectedEntries(new Set());
    
    // Trigger data update event
    window.dispatchEvent(new Event('dataUpdated'));
  };

  const exportData = () => {
    const dataStr = JSON.stringify(entries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `wellness-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
  };

  const resetForm = () => {
    setNewEntry({
      mood: 'neutral',
      energy: 5,
      stress: 5,
      sleep: 7,
      exercise: false,
      symptoms: [],
      notes: '',
      waterIntake: 8,
      meditationMinutes: 0,
      tags: []
    });
    setIsAddingEntry(false);
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.symptoms?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         entry.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesMood = filterMood === 'all' || entry.mood === filterMood;
    
    let matchesDate = true;
    if (filterDateRange === 'today') {
      matchesDate = isToday(new Date(entry.date));
    } else if (filterDateRange === 'week') {
      const now = new Date();
      matchesDate = new Date(entry.date) >= startOfWeek(now) && new Date(entry.date) <= endOfWeek(now);
    }
    
    return matchesSearch && matchesMood && matchesDate;
  });

  const toggleSelectEntry = (entryId: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
  };

  const getAverageScores = () => {
    if (entries.length === 0) return { energy: 0, stress: 0, sleep: 0 };
    
    const totals = entries.reduce((acc, entry) => ({
      energy: acc.energy + entry.energy,
      stress: acc.stress + entry.stress,
      sleep: acc.sleep + entry.sleep
    }), { energy: 0, stress: 0, sleep: 0 });

    return {
      energy: Math.round(totals.energy / entries.length),
      stress: Math.round(totals.stress / entries.length),
      sleep: Math.round(totals.sleep / entries.length)
    };
  };

  const averages = getAverageScores();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Enhanced Wellness Tracker</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportData}>
            <Download size={16} className="mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsAddingEntry(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus size={16} className="mr-2" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search entries, symptoms, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={filterMood} onValueChange={setFilterMood}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Moods</SelectItem>
            {moodOptions.map(mood => (
              <SelectItem key={mood.value} value={mood.value}>
                {mood.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterDateRange} onValueChange={setFilterDateRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Averages Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="text-green-600" size={20} />
              <span className="text-sm font-medium">Avg Energy</span>
            </div>
            <p className="text-2xl font-bold">{averages.energy}/10</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="text-red-600" size={20} />
              <span className="text-sm font-medium">Avg Stress</span>
            </div>
            <p className="text-2xl font-bold">{averages.stress}/10</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="text-blue-600" size={20} />
              <span className="text-sm font-medium">Avg Sleep</span>
            </div>
            <p className="text-2xl font-bold">{averages.sleep}h</p>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedEntries.size > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedEntries.size} entr{selectedEntries.size !== 1 ? 'ies' : 'y'} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedEntries(new Set())}>
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
              {entries.length} wellness entries recorded
            </div>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => setEntries([])}
              disabled={entries.length === 0}
            >
              Clear All Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Entries List */}
      <div className="space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-12">
            <Heart size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No wellness entries yet</h3>
            <p className="text-gray-500">Start tracking your wellness journey!</p>
          </div>
        ) : (
          filteredEntries.map(entry => {
            const moodOption = moodOptions.find(m => m.value === entry.mood);
            
            return (
              <Card key={entry.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedEntries.has(entry.id)}
                        onCheckedChange={() => toggleSelectEntry(entry.id)}
                      />
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${moodOption?.color}`}></div>
                          <span className="font-medium">{moodOption?.label}</span>
                          <Badge variant="outline">{format(new Date(entry.date), 'MMM d, yyyy')}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>Energy: {entry.energy}/10</div>
                          <div>Stress: {entry.stress}/10</div>
                          <div>Sleep: {entry.sleep}h</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setEditingEntry(entry)}>
                        <Edit2 size={12} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => confirmDeleteEntry(entry.id)}>
                        <Trash2 size={12} className="text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {entry.exercise && (
                      <Badge variant="secondary">Exercised</Badge>
                    )}
                    {entry.waterIntake && (
                      <span className="text-sm text-gray-600">Water: {entry.waterIntake} glasses</span>
                    )}
                    {entry.meditationMinutes && entry.meditationMinutes > 0 && (
                      <span className="text-sm text-gray-600 ml-4">Meditation: {entry.meditationMinutes} min</span>
                    )}
                    {entry.symptoms && entry.symptoms.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <strong>Symptoms:</strong> {entry.symptoms.join(', ')}
                      </div>
                    )}
                    {entry.notes && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        <strong>Notes:</strong> {entry.notes}
                      </div>
                    )}
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {entry.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Entry Dialog */}
      <Dialog open={isAddingEntry} onOpenChange={setIsAddingEntry}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Wellness Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="mood">Mood</Label>
              <Select value={newEntry.mood} onValueChange={(value: WellnessEntry['mood']) => setNewEntry(prev => ({ ...prev, mood: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {moodOptions.map(mood => (
                    <SelectItem key={mood.value} value={mood.value}>
                      {mood.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="energy">Energy (1-10)</Label>
                <Input
                  id="energy"
                  type="number"
                  min="1"
                  max="10"
                  value={newEntry.energy}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, energy: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <Label htmlFor="stress">Stress (1-10)</Label>
                <Input
                  id="stress"
                  type="number"
                  min="1"
                  max="10"
                  value={newEntry.stress}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, stress: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <Label htmlFor="sleep">Sleep (hours)</Label>
                <Input
                  id="sleep"
                  type="number"
                  min="0"
                  max="24"
                  value={newEntry.sleep}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, sleep: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="water">Water Intake (glasses)</Label>
                <Input
                  id="water"
                  type="number"
                  min="0"
                  value={newEntry.waterIntake}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, waterIntake: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="meditation">Meditation (minutes)</Label>
                <Input
                  id="meditation"
                  type="number"
                  min="0"
                  value={newEntry.meditationMinutes}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, meditationMinutes: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="exercise"
                checked={newEntry.exercise}
                onCheckedChange={(checked) => setNewEntry(prev => ({ ...prev, exercise: !!checked }))}
              />
              <Label htmlFor="exercise">Did you exercise today?</Label>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newEntry.notes}
                onChange={(e) => setNewEntry(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="How are you feeling? Any observations..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={addEntry}>Add Entry</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Wellness Entry</DialogTitle>
          </DialogHeader>
          {editingEntry && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-mood">Mood</Label>
                <Select 
                  value={editingEntry.mood} 
                  onValueChange={(value: WellnessEntry['mood']) => 
                    setEditingEntry(prev => prev ? { ...prev, mood: value } : null)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {moodOptions.map(mood => (
                      <SelectItem key={mood.value} value={mood.value}>
                        {mood.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-energy">Energy (1-10)</Label>
                  <Input
                    id="edit-energy"
                    type="number"
                    min="1"
                    max="10"
                    value={editingEntry.energy}
                    onChange={(e) => setEditingEntry(prev => prev ? { ...prev, energy: parseInt(e.target.value) || 1 } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-stress">Stress (1-10)</Label>
                  <Input
                    id="edit-stress"
                    type="number"
                    min="1"
                    max="10"
                    value={editingEntry.stress}
                    onChange={(e) => setEditingEntry(prev => prev ? { ...prev, stress: parseInt(e.target.value) || 1 } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-sleep">Sleep (hours)</Label>
                  <Input
                    id="edit-sleep"
                    type="number"
                    min="0"
                    max="24"
                    value={editingEntry.sleep}
                    onChange={(e) => setEditingEntry(prev => prev ? { ...prev, sleep: parseInt(e.target.value) || 0 } : null)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editingEntry.notes || ''}
                  onChange={(e) => setEditingEntry(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  placeholder="How are you feeling? Any observations..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingEntry(null)}>
                  Cancel
                </Button>
                <Button onClick={updateEntry}>Update Entry</Button>
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
            Are you sure you want to delete this wellness entry? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteEntry}>
              Delete Entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
