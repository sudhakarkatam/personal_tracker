import { useState } from 'react';
import { Plus, ArrowLeft, FileText, Search, Tag, Edit2, Trash2 } from 'lucide-react';
import { Note } from '@/types';
import { useLocalStorageWithDates } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

interface NotesJournalProps {
  onBack: () => void;
}

export function NotesJournal({ onBack }: NotesJournalProps) {
  const [notes, setNotes] = useLocalStorageWithDates<Note[]>('notes', [], ['createdAt', 'updatedAt']);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    category: 'personal',
    tags: ''
  });

  const addNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return;

    const note: Note = {
      id: Date.now().toString(),
      title: newNote.title,
      content: newNote.content,
      category: newNote.category,
      tags: newNote.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      type: 'note',
      wordCount: newNote.content.split(/\s+/).filter(word => word.length > 0).length,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setNotes(prev => [note, ...prev]);
    resetForm();
  };

  const updateNote = () => {
    if (!editingNote) return;

    const updatedNote = {
      ...editingNote,
      wordCount: editingNote.content.split(/\s+/).filter(word => word.length > 0).length,
      updatedAt: new Date()
    };

    setNotes(prev => prev.map(note => note.id === editingNote.id ? updatedNote : note));
    setEditingNote(null);
  };

  const deleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
  };

  const resetForm = () => {
    setNewNote({
      title: '',
      content: '',
      category: 'personal',
      tags: ''
    });
    setIsAddingNote(false);
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || note.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getNotesByCategory = (category: string) => {
    return notes.filter(note => note.category === category);
  };

  const getRecentNotes = () => {
    return notes.slice(0, 10);
  };

  const categories = ['personal', 'work', 'ideas', 'learning', 'travel', 'other'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <h2 className="text-2xl font-bold text-gray-800 flex-1">Notes & Journal</h2>
        <Button onClick={() => setIsAddingNote(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus size={16} className="mr-2" />
          Add Note
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800">Total Notes</h3>
          <p className="text-2xl font-bold text-blue-600">{notes.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="font-semibold text-green-800">Words Written</h3>
          <p className="text-2xl font-bold text-green-600">
            {notes.reduce((sum, note) => sum + (note.wordCount || 0), 0)}
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40">
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
      </div>

      {/* Notes */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({filteredNotes.length})</TabsTrigger>
          <TabsTrigger value="recent">Recent ({getRecentNotes().length})</TabsTrigger>
          <TabsTrigger value="personal">Personal ({getNotesByCategory('personal').length})</TabsTrigger>
          <TabsTrigger value="work">Work ({getNotesByCategory('work').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <NotesList notes={filteredNotes} onEditNote={setEditingNote} onDeleteNote={deleteNote} />
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <NotesList notes={getRecentNotes()} onEditNote={setEditingNote} onDeleteNote={deleteNote} />
        </TabsContent>

        <TabsContent value="personal" className="space-y-4">
          <NotesList 
            notes={getNotesByCategory('personal').filter(note => 
              note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              note.content.toLowerCase().includes(searchTerm.toLowerCase())
            )} 
            onEditNote={setEditingNote}
            onDeleteNote={deleteNote} 
          />
        </TabsContent>

        <TabsContent value="work" className="space-y-4">
          <NotesList 
            notes={getNotesByCategory('work').filter(note => 
              note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              note.content.toLowerCase().includes(searchTerm.toLowerCase())
            )} 
            onEditNote={setEditingNote}
            onDeleteNote={deleteNote} 
          />
        </TabsContent>
      </Tabs>

      {/* Add Note Dialog */}
      <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Note</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newNote.title}
                onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Note title"
              />
            </div>
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={newNote.content}
                onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your note here..."
                rows={8}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={newNote.category} onValueChange={(value) => setNewNote(prev => ({ ...prev, category: value }))}>
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
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={newNote.tags}
                  onChange={(e) => setNewNote(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={addNote}>Add Note</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          {editingNote && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingNote.title}
                  onChange={(e) => setEditingNote(prev => prev ? { ...prev, title: e.target.value } : null)}
                  placeholder="Note title"
                />
              </div>
              <div>
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  value={editingNote.content}
                  onChange={(e) => setEditingNote(prev => prev ? { ...prev, content: e.target.value } : null)}
                  placeholder="Write your note here..."
                  rows={8}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Select value={editingNote.category} onValueChange={(value) => setEditingNote(prev => prev ? { ...prev, category: value } : null)}>
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
                  <Label htmlFor="edit-tags">Tags (comma separated)</Label>
                  <Input
                    id="edit-tags"
                    value={editingNote.tags.join(', ')}
                    onChange={(e) => setEditingNote(prev => prev ? { ...prev, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) } : null)}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingNote(null)}>
                  Cancel
                </Button>
                <Button onClick={updateNote}>Update Note</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NotesList({ 
  notes, 
  onEditNote,
  onDeleteNote 
}: { 
  notes: Note[];
  onEditNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
}) {
  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">No notes</h3>
        <p className="text-gray-500">Start writing your thoughts and ideas!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map(note => (
        <Card key={note.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{note.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{note.category}</Badge>
                  <span className="text-xs text-gray-500">
                    {note.wordCount} words
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditNote(note)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <Edit2 size={12} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteNote(note.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 text-sm mb-3 line-clamp-3">
              {note.content}
            </p>
            
            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {note.tags.map((tag, index) => (
                  <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    <Tag size={10} />
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <div className="text-xs text-gray-500">
              Created {format(new Date(note.createdAt), 'MMM d, yyyy')} • 
              Updated {format(new Date(note.updatedAt), 'MMM d, yyyy')}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
