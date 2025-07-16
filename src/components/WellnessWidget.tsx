
import { useState } from 'react';
import { Droplets, Moon, Plus, Minus, Edit2, Trash2 } from 'lucide-react';
import { WellnessEntry } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

export function WellnessWidget() {
  const [wellnessData, setWellnessData] = useLocalStorage<WellnessEntry[]>('wellness', []);
  const [dailyWaterGoal] = useLocalStorage('dailyWaterGoal', 8);
  const [editingEntry, setEditingEntry] = useState<WellnessEntry | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayEntry = wellnessData.find(entry => entry.date === today) || {
    id: Date.now().toString(),
    date: today,
    waterGlasses: 0,
    sleepHours: 0
  };

  const updateWellness = (updates: Partial<WellnessEntry>) => {
    const newEntry = { ...todayEntry, ...updates };
    setWellnessData(prev => {
      const filtered = prev.filter(entry => entry.date !== today);
      return [...filtered, newEntry];
    });
  };

  const adjustWater = (delta: number) => {
    const newCount = Math.max(0, todayEntry.waterGlasses + delta);
    updateWellness({ waterGlasses: newCount });
  };

  const deleteEntry = (entryId: string) => {
    setWellnessData(prev => prev.filter(entry => entry.id !== entryId));
  };

  const updateEntry = () => {
    if (!editingEntry) return;
    setWellnessData(prev => prev.map(entry => 
      entry.id === editingEntry.id ? editingEntry : entry
    ));
    setEditingEntry(null);
  };

  const clearAllData = () => {
    setWellnessData([]);
  };

  const waterProgress = (todayEntry.waterGlasses / dailyWaterGoal) * 100;

  const recentEntries = wellnessData
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  return (
    <>
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Wellness Tracker</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
              History
            </Button>
            <Button variant="outline" size="sm" onClick={clearAllData}>
              <Trash2 size={12} />
            </Button>
          </div>
        </div>
        
        {/* Water Intake */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Droplets size={18} className="text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Water Intake</span>
            </div>
            <span className="text-sm text-gray-600">
              {todayEntry.waterGlasses} / {dailyWaterGoal} glasses
            </span>
          </div>
          
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${Math.min(waterProgress, 100)}%` }}
            />
          </div>
          
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => adjustWater(-1)}
              disabled={todayEntry.waterGlasses <= 0}
            >
              <Minus size={14} />
            </Button>
            <span className="font-medium text-lg min-w-[2rem] text-center">
              {todayEntry.waterGlasses}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => adjustWater(1)}
            >
              <Plus size={14} />
            </Button>
          </div>
        </div>

        {/* Sleep Tracking */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Moon size={18} className="text-purple-500" />
            <span className="text-sm font-medium text-gray-700">Sleep Hours</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={todayEntry.sleepHours || ''}
              onChange={(e) => updateWellness({ sleepHours: parseFloat(e.target.value) || 0 })}
              placeholder="Hours slept"
              className="text-center"
            />
            <span className="text-sm text-gray-500">hours</span>
          </div>
          
          {todayEntry.sleepHours > 0 && (
            <div className="mt-2 text-xs text-center">
              {todayEntry.sleepHours >= 7 && todayEntry.sleepHours <= 9 ? (
                <span className="text-green-600">✓ Optimal sleep range</span>
              ) : todayEntry.sleepHours < 7 ? (
                <span className="text-orange-600">⚠ Consider more sleep</span>
              ) : (
                <span className="text-blue-600">ℹ That's a lot of sleep!</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Wellness History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">{wellnessData.length} entries</span>
              <Button variant="destructive" size="sm" onClick={clearAllData}>
                Clear All Data
              </Button>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recentEntries.map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{format(new Date(entry.date), 'MMM d, yyyy')}</div>
                    <div className="text-sm text-gray-500">
                      💧 {entry.waterGlasses} glasses • 😴 {entry.sleepHours || 0}h
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setEditingEntry(entry)}>
                      <Edit2 size={12} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteEntry(entry.id)}>
                      <Trash2 size={12} className="text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Wellness Entry</DialogTitle>
          </DialogHeader>
          {editingEntry && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editDate">Date</Label>
                <Input
                  id="editDate"
                  type="date"
                  value={editingEntry.date}
                  onChange={(e) => setEditingEntry(prev => prev ? { ...prev, date: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="editWater">Water Glasses</Label>
                <Input
                  id="editWater"
                  type="number"
                  value={editingEntry.waterGlasses}
                  onChange={(e) => setEditingEntry(prev => prev ? { ...prev, waterGlasses: parseInt(e.target.value) || 0 } : null)}
                />
              </div>
              <div>
                <Label htmlFor="editSleep">Sleep Hours</Label>
                <Input
                  id="editSleep"
                  type="number"
                  step="0.5"
                  value={editingEntry.sleepHours || ''}
                  onChange={(e) => setEditingEntry(prev => prev ? { ...prev, sleepHours: parseFloat(e.target.value) || 0 } : null)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingEntry(null)}>Cancel</Button>
                <Button onClick={updateEntry}>Update Entry</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
