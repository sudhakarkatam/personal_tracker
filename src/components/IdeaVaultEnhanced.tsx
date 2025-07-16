
import { useState } from 'react';
import { Plus, Edit2, Trash2, Lightbulb, Tag, Star, Search, Filter } from 'lucide-react';
import { Idea } from '@/types';
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
import { format } from 'date-fns';

interface IdeaVaultEnhancedProps {
  onBack: () => void;
}

export function IdeaVaultEnhanced({ onBack }: IdeaVaultEnhancedProps) {
  const [ideas, setIdeas] = useLocalStorage<Idea[]>('ideasEnhanced', []);
  const [isAddingIdea, setIsAddingIdea] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingIdeaId, setDeletingIdeaId] = useState<string | null>(null);
  const [selectedIdeas, setSelectedIdeas] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [newIdea, setNewIdea] = useState({
    title: '',
    description: '',
    category: 'business',
    tags: [] as string[],
    priority: 'medium' as Idea['priority'],
    status: 'new' as Idea['status']
  });

  const categories = ['business', 'personal', 'creative', 'technology', 'health', 'education', 'other'];
  const priorities = ['low', 'medium', 'high'];
  const statuses = ['new', 'in_progress', 'completed', 'archived'];

  const addIdea = () => {
    if (!newIdea.title.trim()) return;

    const idea: Idea = {
      id: Date.now().toString(),
      title: newIdea.title,
      description: newIdea.description,
      category: newIdea.category,
      tags: newIdea.tags,
      priority: newIdea.priority,
      status: newIdea.status,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setIdeas(prev => [...prev, idea]);
    resetForm();
  };

  const updateIdea = () => {
    if (!editingIdea) return;

    setIdeas(prev =>
      prev.map(idea =>
        idea.id === editingIdea.id ? { ...editingIdea, updatedAt: new Date() } : idea
      )
    );
    setEditingIdea(null);
  };

  const confirmDeleteIdea = (ideaId: string) => {
    setDeletingIdeaId(ideaId);
    setShowDeleteConfirm(true);
  };

  const deleteIdea = () => {
    if (!deletingIdeaId) return;
    
    setIdeas(prev => prev.filter(idea => idea.id !== deletingIdeaId));
    setShowDeleteConfirm(false);
    setDeletingIdeaId(null);
  };

  const bulkDeleteIdeas = () => {
    setIdeas(prev => prev.filter(idea => !selectedIdeas.has(idea.id)));
    setSelectedIdeas(new Set());
  };

  const resetForm = () => {
    setNewIdea({
      title: '',
      description: '',
      category: 'business',
      tags: [],
      priority: 'medium',
      status: 'new'
    });
    setIsAddingIdea(false);
  };

  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         idea.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         idea.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || idea.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || idea.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const toggleSelectIdea = (ideaId: string) => {
    const newSelected = new Set(selectedIdeas);
    if (newSelected.has(ideaId)) {
      newSelected.delete(ideaId);
    } else {
      newSelected.add(ideaId);
    }
    setSelectedIdeas(newSelected);
  };

  const getPriorityColor = (priority: Idea['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: Idea['status']) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Enhanced Idea Vault</h2>
        <Button onClick={() => setIsAddingIdea(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus size={16} className="mr-2" />
          Add Idea
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search ideas..."
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
      {selectedIdeas.size > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedIdeas.size} idea{selectedIdeas.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedIdeas(new Set())}>
                Clear Selection
              </Button>
              <Button variant="destructive" size="sm" onClick={bulkDeleteIdeas}>
                Delete Selected
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIdeas.map(idea => (
          <Card key={idea.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Checkbox
                    checked={selectedIdeas.has(idea.id)}
                    onCheckedChange={() => toggleSelectIdea(idea.id)}
                  />
                  <div className="flex-1">
                    <CardTitle className="text-lg">{idea.title}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{idea.description}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditingIdea(idea)}>
                    <Edit2 size={12} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => confirmDeleteIdea(idea.id)}>
                    <Trash2 size={12} className="text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{idea.category}</Badge>
                  <Badge className={getPriorityColor(idea.priority)}>{idea.priority}</Badge>
                  <Badge className={getStatusColor(idea.status)}>{idea.status.replace('_', ' ')}</Badge>
                </div>
                
                {idea.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {idea.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Created: {format(new Date(idea.createdAt), 'MMM d, yyyy')}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredIdeas.length === 0 && (
        <div className="text-center py-12">
          <Lightbulb size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No ideas found</h3>
          <p className="text-gray-500">Start capturing your brilliant ideas!</p>
        </div>
      )}

      {/* Add Idea Dialog */}
      <Dialog open={isAddingIdea} onOpenChange={setIsAddingIdea}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Idea</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newIdea.title}
                onChange={(e) => setNewIdea(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Idea title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newIdea.description}
                onChange={(e) => setNewIdea(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your idea..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={newIdea.category} onValueChange={(value) => setNewIdea(prev => ({ ...prev, category: value }))}>
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
                <Select value={newIdea.priority} onValueChange={(value: Idea['priority']) => setNewIdea(prev => ({ ...prev, priority: value }))}>
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
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={newIdea.status} onValueChange={(value: Idea['status']) => setNewIdea(prev => ({ ...prev, status: value }))}>
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
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={addIdea}>Add Idea</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Idea Dialog */}
      <Dialog open={!!editingIdea} onOpenChange={() => setEditingIdea(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Idea</DialogTitle>
          </DialogHeader>
          {editingIdea && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingIdea.title}
                  onChange={(e) => setEditingIdea(prev => prev ? { ...prev, title: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingIdea.description}
                  onChange={(e) => setEditingIdea(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Select value={editingIdea.category} onValueChange={(value) => setEditingIdea(prev => prev ? { ...prev, category: value } : null)}>
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
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select value={editingIdea.priority} onValueChange={(value: Idea['priority']) => setEditingIdea(prev => prev ? { ...prev, priority: value } : null)}>
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
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={editingIdea.status} onValueChange={(value: Idea['status']) => setEditingIdea(prev => prev ? { ...prev, status: value } : null)}>
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
                <Button variant="outline" onClick={() => setEditingIdea(null)}>
                  Cancel
                </Button>
                <Button onClick={updateIdea}>Update Idea</Button>
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
            Are you sure you want to delete this idea? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteIdea}>
              Delete Idea
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
