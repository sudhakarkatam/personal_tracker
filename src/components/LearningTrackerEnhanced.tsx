
import { useState } from 'react';
import { Plus, Edit2, Trash2, BookOpen, Target, TrendingUp, Clock, Search } from 'lucide-react';
import { LearningItem } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';

interface LearningTrackerEnhancedProps {
  onBack: () => void;
}

export function LearningTrackerEnhanced({ onBack }: LearningTrackerEnhancedProps) {
  const [learningItems, setLearningItems] = useLocalStorage<LearningItem[]>('learningItemsEnhanced', []);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<LearningItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    category: 'programming',
    status: 'not_started' as LearningItem['status'],
    priority: 'medium' as LearningItem['priority'],
    progress: 0,
    estimatedHours: 0,
    actualHours: 0,
    resources: [] as string[],
    tags: [] as string[]
  });

  const categories = ['programming', 'design', 'business', 'language', 'science', 'art', 'health', 'other'];
  const priorities = ['low', 'medium', 'high'];
  const statuses = ['not_started', 'in_progress', 'completed'];

  const addItem = () => {
    if (!newItem.title.trim()) return;

    const item: LearningItem = {
      id: Date.now().toString(),
      title: newItem.title,
      description: newItem.description,
      category: newItem.category,
      status: newItem.status,
      priority: newItem.priority,
      progress: newItem.progress,
      estimatedHours: newItem.estimatedHours,
      actualHours: newItem.actualHours,
      resources: newItem.resources,
      tags: newItem.tags,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setLearningItems(prev => [...prev, item]);
    resetForm();
  };

  const updateItem = () => {
    if (!editingItem) return;

    setLearningItems(prev =>
      prev.map(item =>
        item.id === editingItem.id ? { ...editingItem, updatedAt: new Date() } : item
      )
    );
    setEditingItem(null);
  };

  const confirmDeleteItem = (itemId: string) => {
    setDeletingItemId(itemId);
    setShowDeleteConfirm(true);
  };

  const deleteItem = () => {
    if (!deletingItemId) return;
    
    setLearningItems(prev => prev.filter(item => item.id !== deletingItemId));
    setShowDeleteConfirm(false);
    setDeletingItemId(null);
  };

  const bulkDeleteItems = () => {
    setLearningItems(prev => prev.filter(item => !selectedItems.has(item.id)));
    setSelectedItems(new Set());
  };

  const resetForm = () => {
    setNewItem({
      title: '',
      description: '',
      category: 'programming',
      status: 'not_started',
      priority: 'medium',
      progress: 0,
      estimatedHours: 0,
      actualHours: 0,
      resources: [],
      tags: []
    });
    setIsAddingItem(false);
  };

  const filteredItems = learningItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const toggleSelectItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const getPriorityColor = (priority: LearningItem['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: LearningItem['status']) => {
    switch (status) {
      case 'not_started': return 'bg-gray-100 text-gray-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStats = () => {
    const completed = learningItems.filter(item => item.status === 'completed').length;
    const inProgress = learningItems.filter(item => item.status === 'in_progress').length;
    const totalHours = learningItems.reduce((sum, item) => sum + item.actualHours, 0);
    const avgProgress = learningItems.length > 0 
      ? Math.round(learningItems.reduce((sum, item) => sum + item.progress, 0) / learningItems.length) 
      : 0;

    return { completed, inProgress, totalHours, avgProgress };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Enhanced Learning Tracker</h2>
        <Button onClick={() => setIsAddingItem(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus size={16} className="mr-2" />
          Add Learning Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="text-green-600" size={20} />
              <span className="text-sm font-medium">Completed</span>
            </div>
            <p className="text-2xl font-bold">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-blue-600" size={20} />
              <span className="text-sm font-medium">In Progress</span>
            </div>
            <p className="text-2xl font-bold">{stats.inProgress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="text-orange-600" size={20} />
              <span className="text-sm font-medium">Total Hours</span>
            </div>
            <p className="text-2xl font-bold">{stats.totalHours}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="text-purple-600" size={20} />
              <span className="text-sm font-medium">Avg Progress</span>
            </div>
            <p className="text-2xl font-bold">{stats.avgProgress}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search learning items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-32">
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
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statuses.map(status => (
              <SelectItem key={status} value={status}>
                {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedItems(new Set())}>
                Clear Selection
              </Button>
              <Button variant="destructive" size="sm" onClick={bulkDeleteItems}>
                Delete Selected
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Learning Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map(item => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={() => toggleSelectItem(item.id)}
                  />
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditingItem(item)}>
                    <Edit2 size={12} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => confirmDeleteItem(item.id)}>
                    <Trash2 size={12} className="text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{item.category}</Badge>
                  <Badge className={getPriorityColor(item.priority)}>{item.priority}</Badge>
                  <Badge className={getStatusColor(item.status)}>{item.status.replace('_', ' ')}</Badge>
                </div>
                
                <div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{item.progress}%</span>
                  </div>
                  <Progress value={item.progress} className="h-2" />
                </div>

                <div className="text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Estimated: {item.estimatedHours}h</span>
                    <span>Actual: {item.actualHours}h</span>
                  </div>
                </div>

                {item.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {item.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Created: {format(new Date(item.createdAt), 'MMM d, yyyy')}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No learning items found</h3>
          <p className="text-gray-500">Start your learning journey!</p>
        </div>
      )}

      {/* Add Item Dialog */}
      <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Learning Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newItem.title}
                onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Learning item title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newItem.description}
                onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what you want to learn..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={newItem.category} onValueChange={(value) => setNewItem(prev => ({ ...prev, category: value }))}>
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
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={newItem.priority} onValueChange={(value: LearningItem['priority']) => setNewItem(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map(priority => (
                      <SelectItem key={priority} value={priority}>
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimatedHours">Estimated Hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  value={newItem.estimatedHours}
                  onChange={(e) => setNewItem(prev => ({ ...prev, estimatedHours: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="progress">Progress (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={newItem.progress}
                  onChange={(e) => setNewItem(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={addItem}>Add Item</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent className="max-w-2xl">
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-progress">Progress (%)</Label>
                  <Input
                    id="edit-progress"
                    type="number"
                    min="0"
                    max="100"
                    value={editingItem.progress}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, progress: parseInt(e.target.value) || 0 } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-actualHours">Actual Hours</Label>
                  <Input
                    id="edit-actualHours"
                    type="number"
                    value={editingItem.actualHours}
                    onChange={(e) => setEditingItem(prev => prev ? { ...prev, actualHours: parseInt(e.target.value) || 0 } : null)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editingItem.status} onValueChange={(value: LearningItem['status']) => setEditingItem(prev => prev ? { ...prev, status: value } : null)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map(status => (
                      <SelectItem key={status} value={status}>
                        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingItem(null)}>
                  Cancel
                </Button>
                <Button onClick={updateItem}>Update Item</Button>
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
            Are you sure you want to delete this learning item? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteItem}>
              Delete Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
