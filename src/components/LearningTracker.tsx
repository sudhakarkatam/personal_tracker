import { useState } from 'react';
import { Plus, ArrowLeft, GraduationCap, ExternalLink, Play, Check, Edit2, Trash2 } from 'lucide-react';
import { LearningItem } from '@/types';
import { useLocalStorageWithDates } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface LearningTrackerProps {
  onBack: () => void;
}

export function LearningTracker({ onBack }: LearningTrackerProps) {
  const [learningItems, setLearningItems] = useLocalStorageWithDates<LearningItem[]>('learning', [], ['createdAt', 'completedAt']);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<LearningItem | null>(null);
  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    category: '',
    url: ''
  });

  const categories = [
    'Programming', 'Design', 'Business', 'Language', 'Science', 
    'Arts', 'Health', 'Technology', 'Personal Development', 'Other'
  ];

  const addLearningItem = () => {
    if (!newItem.title.trim()) return;

    const item: LearningItem = {
      id: Date.now().toString(),
      title: newItem.title,
      description: newItem.description,
      category: newItem.category,
      url: newItem.url,
      progress: 0,
      status: 'not_started',
      type: 'course',
      difficulty: 'beginner',
      priority: 'medium',
      estimatedHours: 0,
      actualHours: 0,
      resources: [],
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setLearningItems(prev => [item, ...prev]);
    resetForm();
  };

  const updateLearningItem = () => {
    if (!editingItem) return;

    const updatedItem = {
      ...editingItem,
      updatedAt: new Date()
    };

    setLearningItems(prev => prev.map(item => item.id === editingItem.id ? updatedItem : item));
    setEditingItem(null);
  };

  const deleteLearningItem = (itemId: string) => {
    setLearningItems(prev => prev.filter(item => item.id !== itemId));
  };

  const resetForm = () => {
    setNewItem({
      title: '',
      description: '',
      category: '',
      url: ''
    });
    setIsAddingItem(false);
  };

  const updateProgress = (itemId: string, progress: number) => {
    setLearningItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item;
        
        const updatedItem = { ...item, progress, updatedAt: new Date() };
        
        // Auto-update status based on progress
        if (progress === 0) {
          updatedItem.status = 'not_started';
        } else if (progress === 100) {
          updatedItem.status = 'completed';
          updatedItem.completedAt = new Date();
        } else {
          updatedItem.status = 'in_progress';
        }
        
        return updatedItem;
      })
    );
  };

  const updateNotes = (itemId: string, notes: string) => {
    setLearningItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, notes, updatedAt: new Date() } : item
      )
    );
  };

  const getItemsByStatus = (status: LearningItem['status']) => {
    return learningItems.filter(item => item.status === status);
  };

  const getStatusColor = (status: LearningItem['status']) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
    }
  };

  const getStatusIcon = (status: LearningItem['status']) => {
    switch (status) {
      case 'not_started': return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
      case 'in_progress': return <Play size={12} className="text-blue-600" />;
      case 'completed': return <Check size={12} className="text-green-600" />;
    }
  };

  const getLearningStats = () => {
    return {
      total: learningItems.length,
      inProgress: getItemsByStatus('in_progress').length,
      completed: getItemsByStatus('completed').length,
      avgProgress: learningItems.length > 0 
        ? learningItems.reduce((sum, item) => sum + item.progress, 0) / learningItems.length 
        : 0
    };
  };

  const stats = getLearningStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <h2 className="text-2xl font-bold text-gray-800 flex-1">Learning Tracker</h2>
        <Button onClick={() => setIsAddingItem(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus size={16} className="mr-2" />
          Add Learning
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800">In Progress</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="font-semibold text-green-800">Completed</h3>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
      </div>

      {/* Learning Items */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({learningItems.length})</TabsTrigger>
          <TabsTrigger value="not_started">Not Started ({getItemsByStatus('not_started').length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({getItemsByStatus('in_progress').length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({getItemsByStatus('completed').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <LearningItemsList 
            items={learningItems} 
            onUpdateProgress={updateProgress}
            onUpdateNotes={updateNotes}
            onEditItem={setEditingItem}
            onDeleteItem={deleteLearningItem}
          />
        </TabsContent>

        <TabsContent value="not_started" className="space-y-4">
          <LearningItemsList 
            items={getItemsByStatus('not_started')} 
            onUpdateProgress={updateProgress}
            onUpdateNotes={updateNotes}
            onEditItem={setEditingItem}
            onDeleteItem={deleteLearningItem}
          />
        </TabsContent>

        <TabsContent value="in_progress" className="space-y-4">
          <LearningItemsList 
            items={getItemsByStatus('in_progress')} 
            onUpdateProgress={updateProgress}
            onUpdateNotes={updateNotes}
            onEditItem={setEditingItem}
            onDeleteItem={deleteLearningItem}
          />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <LearningItemsList 
            items={getItemsByStatus('completed')} 
            onUpdateProgress={updateProgress}
            onUpdateNotes={updateNotes}
            onEditItem={setEditingItem}
            onDeleteItem={deleteLearningItem}
          />
        </TabsContent>
      </Tabs>

      {/* Add Learning Item Dialog */}
      <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Learning Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newItem.title}
                onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., React Fundamentals, Spanish Course"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newItem.description}
                onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What will you learn?"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={newItem.category} onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="url">URL (optional)</Label>
              <Input
                id="url"
                type="url"
                value={newItem.url}
                onChange={(e) => setNewItem(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={addLearningItem}>Add Item</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Learning Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Learning Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem(prev => prev ? { ...prev, title: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingItem.description}
                  onChange={(e) => setEditingItem(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select value={editingItem.category} onValueChange={(value) => setEditingItem(prev => prev ? { ...prev, category: value } : null)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingItem(null)}>
                  Cancel
                </Button>
                <Button onClick={updateLearningItem}>Update Item</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LearningItemsList({ 
  items, 
  onUpdateProgress, 
  onUpdateNotes,
  onEditItem,
  onDeleteItem
}: { 
  items: LearningItem[];
  onUpdateProgress: (id: string, progress: number) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onEditItem: (item: LearningItem) => void;
  onDeleteItem: (id: string) => void;
}) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <GraduationCap size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">No learning items</h3>
        <p className="text-gray-500">Start your learning journey by adding your first item!</p>
      </div>
    );
  }

  const getStatusColor = (status: LearningItem['status']) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
    }
  };

  const getStatusIcon = (status: LearningItem['status']) => {
    switch (status) {
      case 'not_started': return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
      case 'in_progress': return <Play size={12} className="text-blue-600" />;
      case 'completed': return <Check size={12} className="text-green-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {items.map(item => (
        <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-800">{item.title}</h3>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
              {item.description && (
                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
              )}
              <div className="flex items-center gap-2">
                <Badge className={cn("text-xs", item.category ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800")}>
                  {item.category || 'Uncategorized'}
                </Badge>
                <Badge className={cn("text-xs flex items-center gap-1", getStatusColor(item.status))}>
                  {getStatusIcon(item.status)}
                  {item.status.replace('_', ' ')}
                </Badge>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEditItem(item)}
                className="text-blue-500 hover:text-blue-700"
              >
                <Edit2 size={12} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteItem(item.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 size={12} />
              </Button>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{item.progress}%</span>
            </div>
            <Progress value={item.progress} className="h-2 mb-2" />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="100"
                value={item.progress}
                onChange={(e) => onUpdateProgress(item.id, Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-20 h-8"
              />
              <span className="text-sm text-gray-500">%</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
              >
                Notes
              </Button>
            </div>
          </div>

          {/* Completion Info */}
          {item.status === 'completed' && item.completedAt && (
            <div className="text-xs text-green-600 mb-2">
              ✓ Completed {format(new Date(item.completedAt), 'MMM d, yyyy')}
            </div>
          )}

          {/* Expanded Notes */}
          {expandedItem === item.id && (
            <div className="border-t pt-3 mt-3">
              <Label htmlFor={`notes-${item.id}`} className="text-sm">Notes</Label>
              <Textarea
                id={`notes-${item.id}`}
                value={item.notes || ''}
                onChange={(e) => onUpdateNotes(item.id, e.target.value)}
                placeholder="Add your learning notes here..."
                rows={3}
                className="mt-1"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
