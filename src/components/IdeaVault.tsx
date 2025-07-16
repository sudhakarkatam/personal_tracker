import { useState } from 'react';
import { Plus, ArrowLeft, Lightbulb, Search, Filter, Star, Edit2, Trash2 } from 'lucide-react';
import { Idea } from '@/types';
import { useLocalStorageWithDates } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface IdeaVaultProps {
  onBack: () => void;
}

export function IdeaVault({ onBack }: IdeaVaultProps) {
  const [ideas, setIdeas] = useLocalStorageWithDates<Idea[]>('ideas', [], ['createdAt']);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Idea['status']>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | Idea['priority']>('all');
  const [isAddingIdea, setIsAddingIdea] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [newIdea, setNewIdea] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    priority: 'medium' as Idea['priority']
  });

  const addIdea = () => {
    if (!newIdea.title.trim()) return;

    const idea: Idea = {
      id: Date.now().toString(),
      title: newIdea.title,
      description: newIdea.description,
      category: newIdea.category,
      tags: newIdea.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      priority: newIdea.priority,
      status: 'new',
      developmentStage: 'spark',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setIdeas(prev => [idea, ...prev]);
    resetForm();
  };

  const updateIdea = () => {
    if (!editingIdea) return;

    const updatedIdea = {
      ...editingIdea,
      updatedAt: new Date()
    };

    setIdeas(prev => prev.map(idea => idea.id === editingIdea.id ? updatedIdea : idea));
    setEditingIdea(null);
  };

  const updateIdeaStatus = (ideaId: string, status: Idea['status']) => {
    setIdeas(prev =>
      prev.map(idea =>
        idea.id === ideaId ? { ...idea, status, updatedAt: new Date() } : idea
      )
    );
  };

  const deleteIdea = (ideaId: string) => {
    setIdeas(prev => prev.filter(idea => idea.id !== ideaId));
  };

  const resetForm = () => {
    setNewIdea({
      title: '',
      description: '',
      category: '',
      tags: '',
      priority: 'medium'
    });
    setIsAddingIdea(false);
  };

  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         idea.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         idea.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || idea.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || idea.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: Idea['status']) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: Idea['priority']) => {
    switch (priority) {
      case 'high': return '🔥';
      case 'medium': return '⭐';
      case 'low': return '💡';
    }
  };

  const getIdeaStats = () => {
    return {
      total: ideas.length,
      inProgress: ideas.filter(i => i.status === 'in_progress').length,
      completed: ideas.filter(i => i.status === 'completed').length,
      highPriority: ideas.filter(i => i.priority === 'high').length
    };
  };

  const stats = getIdeaStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <h2 className="text-2xl font-bold text-gray-800 flex-1">Idea Vault</h2>
        <Button onClick={() => setIsAddingIdea(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus size={16} className="mr-2" />
          Add Idea
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-purple-50 rounded-lg p-4">
          <h3 className="font-semibold text-purple-800">Total Ideas</h3>
          <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800">In Progress</h3>
          <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search ideas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={(value: 'all' | Idea['status']) => setFilterStatus(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterPriority} onValueChange={(value: 'all' | Idea['priority']) => setFilterPriority(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ideas List */}
      <div className="space-y-4">
        {filteredIdeas.length === 0 ? (
          <div className="text-center py-12">
            <Lightbulb size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' ? 'No ideas found' : 'No ideas yet'}
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' ? 'Try adjusting your filters' : 'Start capturing your brilliant ideas!'}
            </p>
          </div>
        ) : (
          filteredIdeas.map(idea => (
            <div key={idea.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-2 flex-1">
                  <span className="text-lg">{getPriorityIcon(idea.priority)}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{idea.title}</h3>
                    {idea.category && (
                      <p className="text-sm text-gray-600 mb-1">{idea.category}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={idea.status} onValueChange={(value: Idea['status']) => updateIdeaStatus(idea.id, value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingIdea(idea)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Edit2 size={12} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteIdea(idea.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-3">{idea.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(idea.status)}>
                    {idea.status.replace('_', ' ')}
                  </Badge>
                  {idea.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {idea.tags.slice(0, 3).map((tag, index) => (
                        <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                          #{tag}
                        </span>
                      ))}
                      {idea.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{idea.tags.length - 3} more</span>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {format(new Date(idea.createdAt), 'MMM d')}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Idea Dialog */}
      <Dialog open={isAddingIdea} onOpenChange={setIsAddingIdea}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Capture New Idea</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newIdea.title}
                onChange={(e) => setNewIdea(prev => ({ ...prev, title: e.target.value }))}
                placeholder="What's your idea?"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newIdea.description}
                onChange={(e) => setNewIdea(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your idea in detail..."
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={newIdea.category}
                onChange={(e) => setNewIdea(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Business, App, Art"
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input
                id="tags"
                value={newIdea.tags}
                onChange={(e) => setNewIdea(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="innovation, tech, startup"
              />
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={newIdea.priority} onValueChange={(value: Idea['priority']) => setNewIdea(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">🔥 High</SelectItem>
                  <SelectItem value="medium">⭐ Medium</SelectItem>
                  <SelectItem value="low">💡 Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={addIdea}>Capture Idea</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Idea Dialog */}
      <Dialog open={!!editingIdea} onOpenChange={() => setEditingIdea(null)}>
        <DialogContent className="max-w-lg">
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
                  placeholder="What's your idea?"
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingIdea.description}
                  onChange={(e) => setEditingIdea(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="Describe your idea in detail..."
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Input
                  id="edit-category"
                  value={editingIdea.category}
                  onChange={(e) => setEditingIdea(prev => prev ? { ...prev, category: e.target.value } : null)}
                  placeholder="e.g., Business, App, Art"
                />
              </div>
              <div>
                <Label htmlFor="edit-tags">Tags (comma separated)</Label>
                <Input
                  id="edit-tags"
                  value={editingIdea.tags.join(', ')}
                  onChange={(e) => setEditingIdea(prev => prev ? { ...prev, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) } : null)}
                  placeholder="innovation, tech, startup"
                />
              </div>
              <div>
                <Label htmlFor="edit-priority">Priority</Label>
                <Select value={editingIdea.priority} onValueChange={(value: Idea['priority']) => setEditingIdea(prev => prev ? { ...prev, priority: value } : null)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔥 High</SelectItem>
                    <SelectItem value="medium">⭐ Medium</SelectItem>
                    <SelectItem value="low">💡 Low</SelectItem>
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
    </div>
  );
}
