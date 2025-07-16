
import { useState } from 'react';
import { Plus, ArrowLeft, Book, Star, TrendingUp, Calendar, Edit2, Trash2, Search, Filter, Download, Upload, Archive } from 'lucide-react';
import { Book as BookType } from '@/types';
import { useLocalStorageWithDates } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ReadingTrackerProps {
  onBack: () => void;
}

export function ReadingTrackerEnhanced({ onBack }: ReadingTrackerProps) {
  const [books, setBooks] = useLocalStorageWithDates<BookType[]>('booksEnhanced', [], ['startDate', 'completedDate']);
  const [selectedBooks, setSelectedBooks] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | BookType['status']>('all');
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [editingBook, setEditingBook] = useState<BookType | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    totalPages: 0,
    status: 'wishlist' as BookType['status']
  });

  const addBook = () => {
    if (!newBook.title.trim() || !newBook.author.trim()) return;

    const book: BookType = {
      id: Date.now().toString(),
      title: newBook.title,
      author: newBook.author,
      totalPages: newBook.totalPages,
      currentPage: 0,
      status: newBook.status,
      format: 'physical',
      difficulty: 'medium',
      language: 'English',
      startDate: newBook.status === 'reading' ? new Date() : undefined
    };

    setBooks(prev => [...prev, book]);
    setNewBook({
      title: '',
      author: '',
      totalPages: 0,
      status: 'wishlist'
    });
    setIsAddingBook(false);
    toast({ title: 'Book added successfully!' });
  };

  const updateBook = () => {
    if (!editingBook) return;

    setBooks(prev =>
      prev.map(book =>
        book.id === editingBook.id ? editingBook : book
      )
    );
    setEditingBook(null);
    toast({ title: 'Book updated successfully!' });
  };

  const confirmDeleteBook = (bookId: string) => {
    setDeletingBookId(bookId);
    setShowDeleteConfirm(true);
  };

  const deleteBook = () => {
    if (!deletingBookId) return;
    
    setBooks(prev => prev.filter(book => book.id !== deletingBookId));
    setShowDeleteConfirm(false);
    setDeletingBookId(null);
    toast({ title: 'Book deleted successfully!' });
  };

  const handleBulkDelete = () => {
    setBooks(prev => prev.filter(book => !selectedBooks.includes(book.id)));
    setSelectedBooks([]);
    setShowBulkDelete(false);
    toast({ title: `${selectedBooks.length} books deleted successfully!` });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBooks(filteredBooks.map(book => book.id));
    } else {
      setSelectedBooks([]);
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(books, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reading-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    toast({ title: 'Data exported successfully!' });
  };

  const clearAllData = () => {
    setBooks([]);
    setSelectedBooks([]);
    toast({ title: 'All reading data cleared!' });
  };

  const updateBookProgress = (bookId: string, currentPage: number) => {
    setBooks(prev =>
      prev.map(book => {
        if (book.id !== bookId) return book;
        
        const updatedBook = { ...book, currentPage };
        
        if (currentPage >= book.totalPages && book.status === 'reading') {
          updatedBook.status = 'completed';
          updatedBook.completedDate = new Date();
        }
        
        return updatedBook;
      })
    );
  };

  const changeBookStatus = (bookId: string, status: BookType['status']) => {
    setBooks(prev =>
      prev.map(book => {
        if (book.id !== bookId) return book;
        
        const updatedBook = { ...book, status };
        
        if (status === 'reading' && !book.startDate) {
          updatedBook.startDate = new Date();
        } else if (status === 'completed') {
          updatedBook.completedDate = new Date();
          updatedBook.currentPage = book.totalPages;
        }
        
        return updatedBook;
      })
    );
  };

  const rateBook = (bookId: string, rating: number, review?: string) => {
    setBooks(prev =>
      prev.map(book =>
        book.id === bookId ? { ...book, rating, review } : book
      )
    );
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || book.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getBooksByStatus = (status: BookType['status']) => {
    return filteredBooks.filter(book => book.status === status);
  };

  const getReadingStats = () => {
    const completed = books.filter(book => book.status === 'completed');
    const totalPages = completed.reduce((sum, book) => sum + book.totalPages, 0);
    const currentlyReading = books.filter(book => book.status === 'reading');
    
    return {
      completed: completed.length,
      totalPages,
      currentlyReading: currentlyReading.length,
      averageRating: completed.length > 0 
        ? completed.filter(book => book.rating).reduce((sum, book) => sum + (book.rating || 0), 0) / completed.filter(book => book.rating).length 
        : 0
    };
  };

  const stats = getReadingStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <h2 className="text-2xl font-bold text-gray-800 flex-1">Reading Tracker Enhanced</h2>
        <Button onClick={() => setIsAddingBook(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus size={16} className="mr-2" />
          Add Book
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="font-semibold text-green-800">Books Completed</h3>
          <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800">Pages Read</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.totalPages.toLocaleString()}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search books by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2 items-center">
          <Select value={filterStatus} onValueChange={(value: 'all' | BookType['status']) => setFilterStatus(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Books</SelectItem>
              <SelectItem value="wishlist">Wishlist</SelectItem>
              <SelectItem value="reading">Reading</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="dnf">DNF</SelectItem>
            </SelectContent>
          </Select>

          {selectedBooks.length > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setShowBulkDelete(true)}>
              <Trash2 size={14} className="mr-1" />
              Delete Selected ({selectedBooks.length})
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={exportData}>
            <Download size={14} className="mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Bulk Selection */}
      {filteredBooks.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
          <Checkbox
            checked={selectedBooks.length === filteredBooks.length}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm text-gray-600">
            Select All ({selectedBooks.length}/{filteredBooks.length} selected)
          </span>
        </div>
      )}

      {/* Data Management */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Data Management</h3>
          <div className="flex gap-2">
            <span className="text-sm text-gray-500">{books.length} books stored</span>
            <Button variant="destructive" size="sm" onClick={clearAllData} disabled={books.length === 0}>
              Clear All Data
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-600">
          All your reading data is saved locally and can be exported for backup.
        </p>
      </div>

      {/* Book Lists */}
      <Tabs defaultValue="reading" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reading">Currently Reading ({getBooksByStatus('reading').length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({getBooksByStatus('completed').length})</TabsTrigger>
          <TabsTrigger value="wishlist">Wishlist ({getBooksByStatus('wishlist').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="reading" className="space-y-4">
          <BooksList
            books={getBooksByStatus('reading')}
            selectedBooks={selectedBooks}
            onSelectBook={(id, selected) => {
              if (selected) {
                setSelectedBooks(prev => [...prev, id]);
              } else {
                setSelectedBooks(prev => prev.filter(bookId => bookId !== id));
              }
            }}
            onProgressUpdate={updateBookProgress}
            onStatusChange={changeBookStatus}
            onRate={rateBook}
            onEdit={setEditingBook}
            onDelete={confirmDeleteBook}
          />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <BooksList
            books={getBooksByStatus('completed')}
            selectedBooks={selectedBooks}
            onSelectBook={(id, selected) => {
              if (selected) {
                setSelectedBooks(prev => [...prev, id]);
              } else {
                setSelectedBooks(prev => prev.filter(bookId => bookId !== id));
              }
            }}
            onProgressUpdate={updateBookProgress}
            onStatusChange={changeBookStatus}
            onRate={rateBook}
            onEdit={setEditingBook}
            onDelete={confirmDeleteBook}
          />
        </TabsContent>

        <TabsContent value="wishlist" className="space-y-4">
          <BooksList
            books={getBooksByStatus('wishlist')}
            selectedBooks={selectedBooks}
            onSelectBook={(id, selected) => {
              if (selected) {
                setSelectedBooks(prev => [...prev, id]);
              } else {
                setSelectedBooks(prev => prev.filter(bookId => bookId !== id));
              }
            }}
            onProgressUpdate={updateBookProgress}
            onStatusChange={changeBookStatus}
            onRate={rateBook}
            onEdit={setEditingBook}
            onDelete={confirmDeleteBook}
          />
        </TabsContent>
      </Tabs>

      {/* Add Book Dialog */}
      <Dialog open={isAddingBook} onOpenChange={setIsAddingBook}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Book</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newBook.title}
                onChange={(e) => setNewBook(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Book title"
              />
            </div>
            <div>
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={newBook.author}
                onChange={(e) => setNewBook(prev => ({ ...prev, author: e.target.value }))}
                placeholder="Author name"
              />
            </div>
            <div>
              <Label htmlFor="pages">Total Pages</Label>
              <Input
                id="pages"
                type="number"
                min="1"
                value={newBook.totalPages || ''}
                onChange={(e) => setNewBook(prev => ({ ...prev, totalPages: parseInt(e.target.value) || 0 }))}
                placeholder="Number of pages"
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={newBook.status} onValueChange={(value: BookType['status']) => setNewBook(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wishlist">Wishlist</SelectItem>
                  <SelectItem value="reading">Currently Reading</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="dnf">DNF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingBook(false)}>
                Cancel
              </Button>
              <Button onClick={addBook}>Add Book</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Book Dialog */}
      <Dialog open={!!editingBook} onOpenChange={() => setEditingBook(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Book</DialogTitle>
          </DialogHeader>
          {editingBook && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingBook.title}
                  onChange={(e) => setEditingBook(prev => prev ? { ...prev, title: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit-author">Author</Label>
                <Input
                  id="edit-author"
                  value={editingBook.author}
                  onChange={(e) => setEditingBook(prev => prev ? { ...prev, author: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit-pages">Total Pages</Label>
                <Input
                  id="edit-pages"
                  type="number"
                  value={editingBook.totalPages}
                  onChange={(e) => setEditingBook(prev => prev ? { ...prev, totalPages: parseInt(e.target.value) || 0 } : null)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingBook(null)}>
                  Cancel
                </Button>
                <Button onClick={updateBook}>Update Book</Button>
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
            Are you sure you want to delete this book? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteBook}>
              Delete Book
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation */}
      <Dialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Bulk Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to delete {selectedBooks.length} selected books? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowBulkDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Delete Selected
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BooksList({
  books,
  selectedBooks,
  onSelectBook,
  onProgressUpdate,
  onStatusChange,
  onRate,
  onEdit,
  onDelete
}: {
  books: BookType[];
  selectedBooks: string[];
  onSelectBook: (id: string, selected: boolean) => void;
  onProgressUpdate: (id: string, page: number) => void;
  onStatusChange: (id: string, status: BookType['status']) => void;
  onRate: (id: string, rating: number, review?: string) => void;
  onEdit: (book: BookType) => void;
  onDelete: (id: string) => void;
}) {
  const [currentPages, setCurrentPages] = useState<Record<string, number>>({});
  const [showRating, setShowRating] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <Book size={48} className="mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">No books found</h3>
        <p className="text-gray-500">Add some books to get started!</p>
      </div>
    );
  }

  const handleRatingSubmit = (bookId: string) => {
    onRate(bookId, rating, review);
    setShowRating(null);
    setRating(0);
    setReview('');
  };

  return (
    <div className="space-y-4">
      {books.map(book => {
        const progress = book.totalPages > 0 ? (book.currentPage / book.totalPages) * 100 : 0;
        const currentPage = currentPages[book.id] ?? book.currentPage;

        return (
          <div key={book.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={selectedBooks.includes(book.id)}
                onCheckedChange={(checked) => onSelectBook(book.id, !!checked)}
              />
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{book.title}</h3>
                    <p className="text-sm text-gray-600">by {book.author}</p>
                    {book.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={cn(
                              i < book.rating! ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            )}
                          />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">({book.rating})</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(book)}>
                      <Edit2 size={14} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(book.id)}>
                      <Trash2 size={14} className="text-red-500" />
                    </Button>
                    <Select value={book.status} onValueChange={(value: BookType['status']) => onStatusChange(book.id, value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wishlist">Wishlist</SelectItem>
                        <SelectItem value="reading">Reading</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="dnf">DNF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {book.status === 'reading' && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{book.currentPage} / {book.totalPages} pages ({Math.round(progress)}%)</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max={book.totalPages}
                        value={currentPage}
                        onChange={(e) => setCurrentPages(prev => ({ ...prev, [book.id]: parseInt(e.target.value) || 0 }))}
                        className="w-20"
                      />
                      <Button 
                        size="sm" 
                        onClick={() => {
                          onProgressUpdate(book.id, currentPage);
                          setCurrentPages(prev => ({ ...prev, [book.id]: currentPage }));
                        }}
                      >
                        Update Progress
                      </Button>
                    </div>
                  </div>
                )}

                {book.status === 'completed' && (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <Calendar size={12} />
                      Completed {book.completedDate && new Date(book.completedDate).toLocaleDateString()}
                    </div>
                    {!book.rating ? (
                      <Button size="sm" variant="outline" onClick={() => {
                        setShowRating(book.id);
                        setRating(book.rating || 0);
                        setReview(book.review || '');
                      }}>
                        <Star size={14} className="mr-1" />
                        Rate & Review
                      </Button>
                    ) : (
                      book.review && (
                        <div className="bg-gray-50 p-2 rounded text-xs">
                          <p className="text-gray-700">"{book.review}"</p>
                        </div>
                      )
                    )}
                  </div>
                )}

                {book.status === 'wishlist' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange(book.id, 'reading')}
                    className="mt-2"
                  >
                    Start Reading
                  </Button>
                )}
              </div>
            </div>

            {/* Rating Dialog */}
            <Dialog open={showRating === book.id} onOpenChange={() => setShowRating(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rate "{book.title}"</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Rating</Label>
                    <div className="flex gap-1 mt-2">
                      {Array.from({ length: 5 }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setRating(i + 1)}
                          className={cn(
                            "p-1",
                            i < rating ? "text-yellow-400" : "text-gray-300"
                          )}
                        >
                          <Star size={20} className="fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="review">Review (optional)</Label>
                    <Textarea
                      id="review"
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder="What did you think of this book?"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowRating(null)}>
                      Cancel
                    </Button>
                    <Button onClick={() => handleRatingSubmit(book.id)}>
                      Save Rating
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        );
      })}
    </div>
  );
}
