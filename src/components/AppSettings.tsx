
import { useState } from 'react';
import { ArrowLeft, Download, Upload, Trash2, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface AppSettingsProps {
  onBack: () => void;
}

export function AppSettings({ onBack }: AppSettingsProps) {
  const { toast } = useToast();
  
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? JSON.parse(saved) : {
      theme: 'light',
      notifications: true,
      focusSessionDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      dailyWaterGoal: 8,
      currency: 'USD',
      monthlyBudget: 0
    };
  });

  const saveSettings = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    toast({
      title: "Settings saved",
      description: "Your preferences have been updated.",
    });
  };

  const updateSetting = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const exportData = () => {
    const allData = {
      tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
      habits: JSON.parse(localStorage.getItem('habits') || '[]'),
      notes: JSON.parse(localStorage.getItem('notes') || '[]'),
      events: JSON.parse(localStorage.getItem('events') || '[]'),
      focusSessions: JSON.parse(localStorage.getItem('focusSessions') || '[]'),
      books: JSON.parse(localStorage.getItem('books') || '[]'),
      expenses: JSON.parse(localStorage.getItem('expenses') || '[]'),
      ideas: JSON.parse(localStorage.getItem('ideas') || '[]'),
      wellness: JSON.parse(localStorage.getItem('wellness') || '[]'),
      learning: JSON.parse(localStorage.getItem('learning') || '[]'),
      settings: settings
    };

    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `personal-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Data exported",
      description: "Your data has been downloaded as a JSON file.",
    });
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Import each data type
        Object.entries(data).forEach(([key, value]) => {
          if (key === 'settings') {
            setSettings(value);
            localStorage.setItem('appSettings', JSON.stringify(value));
          } else {
            localStorage.setItem(key, JSON.stringify(value));
          }
        });

        toast({
          title: "Data imported",
          description: "Your data has been successfully imported. Please refresh the page.",
        });
      } catch (error) {
        toast({
          title: "Import failed",
          description: "The file format is invalid or corrupted.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  const clearAllData = () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear all data? This action cannot be undone.'
    );
    
    if (confirmed) {
      const keys = [
        'tasks', 'habits', 'notes', 'events', 'focusSessions', 
        'books', 'expenses', 'ideas', 'wellness', 'learning'
      ];
      
      keys.forEach(key => localStorage.removeItem(key));
      
      toast({
        title: "Data cleared",
        description: "All your data has been deleted. Please refresh the page.",
      });
    }
  };

  const getDataSize = () => {
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length;
      }
    }
    return (totalSize / 1024).toFixed(2); // KB
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <h2 className="text-2xl font-bold text-gray-800 flex-1">Settings</h2>
        <Button onClick={saveSettings} className="bg-purple-600 hover:bg-purple-700">
          Save Changes
        </Button>
      </div>

      {/* Focus Timer Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Focus Timer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="focus-duration">Focus Duration (min)</Label>
              <Input
                id="focus-duration"
                type="number"
                min="1"
                max="60"
                value={settings.focusSessionDuration}
                onChange={(e) => updateSetting('focusSessionDuration', parseInt(e.target.value) || 25)}
              />
            </div>
            <div>
              <Label htmlFor="short-break">Short Break (min)</Label>
              <Input
                id="short-break"
                type="number"
                min="1"
                max="30"
                value={settings.shortBreakDuration}
                onChange={(e) => updateSetting('shortBreakDuration', parseInt(e.target.value) || 5)}
              />
            </div>
            <div>
              <Label htmlFor="long-break">Long Break (min)</Label>
              <Input
                id="long-break"
                type="number"
                min="1"
                max="60"
                value={settings.longBreakDuration}
                onChange={(e) => updateSetting('longBreakDuration', parseInt(e.target.value) || 15)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wellness Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Wellness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="water-goal">Daily Water Goal (glasses)</Label>
            <Input
              id="water-goal"
              type="number"
              min="1"
              max="20"
              value={settings.dailyWaterGoal}
              onChange={(e) => updateSetting('dailyWaterGoal', parseInt(e.target.value) || 8)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Expense Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Expenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={settings.currency} onValueChange={(value) => updateSetting('currency', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="JPY">JPY (¥)</SelectItem>
                  <SelectItem value="CAD">CAD ($)</SelectItem>
                  <SelectItem value="AUD">AUD ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="monthly-budget">Monthly Budget</Label>
              <Input
                id="monthly-budget"
                type="number"
                min="0"
                step="0.01"
                value={settings.monthlyBudget}
                onChange={(e) => updateSetting('monthlyBudget', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Notifications</p>
              <p className="text-sm text-gray-600">Get notified about timer completions and reminders</p>
            </div>
            <Switch
              checked={settings.notifications}
              onCheckedChange={(value) => updateSetting('notifications', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Storage Used</p>
              <p className="text-sm text-gray-600">{getDataSize()} KB of local storage</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex gap-2">
              <Button onClick={exportData} variant="outline" className="flex-1">
                <Download size={16} className="mr-2" />
                Export Data
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <label htmlFor="import-file" className="cursor-pointer">
                  <Upload size={16} className="mr-2" />
                  Import Data
                </label>
              </Button>
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </div>
            
            <Button 
              onClick={clearAllData} 
              variant="destructive" 
              className="w-full"
            >
              <Trash2 size={16} className="mr-2" />
              Clear All Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong className="text-gray-800">Personal Tracker App</strong></p>
            <p>Version 1.0.0</p>
            <p>A comprehensive life management tool built with React and TypeScript.</p>
            <p>All data is stored locally in your browser for privacy and security.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
