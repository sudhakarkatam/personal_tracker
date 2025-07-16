import { useState } from 'react';
import { Plus, ArrowLeft, Book, Star, TrendingUp, Calendar, Edit2, Trash2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface ReadingTrackerProps {
  onBack: () => void;
}

export function ReadingTracker({ onBack }: ReadingTrackerProps) {
  const [books, setBooks] = useLocalStorageWithDates<BookType[]>('books', [], ['startDate', 'completedDate']);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [editingBook, setEditingBook] = useState<BookType | null>(null);
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
    resetForm();
  };

  const updateBook = () => {
    if (!editingBook) return;

    setBooks(prev => prev.map(book => book.id === editingBook.id ? editingBook : book));
    setEditingBook(null);
  };

  const deleteBook = (bookId: string) => {
    setBooks(prev => prev.filter(book => book.id !== bookId));
  };

  const resetForm = () => {
    setNewBook({
      title: '',
      author: '',
      totalPages: 0,
      status: 'wishlist'
    });
    setIsAddingBook(false);
  };

  const updateBookProgress = (bookId: string, currentPage: number) => {
    setBooks(prev =>
      prev.map(book => {
        if (book.id !== bookId) return book;
        
        const updatedBook = { ...book, currentPage };
        
        // Auto-complete if reached total pages
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

  const getBooksByStatus = (status: BookType['status']) => {
    return books.filter(book => book.status === status);
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
        <h2 className="text-2xl font-bold text-gray-800 flex-1">Reading Tracker</h2>
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

      {/* Book Lists */}
      <Tabs defaultValue="reading" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reading">Currently Reading ({getBooksByStatus('reading').length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({getBooksByStatus('completed').length})</TabsTrigger>
          <TabsTrigger value="wishlist">Wishlist ({getBooksByStatus('wishlist').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="reading" className="space-y-4">
          {getBooksByStatus('reading').length === 0 ? (
            <div className="text-center py-8">
              <Book size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No books currently being read</p>
            </div>
          ) : (
            getBooksByStatus('reading').map(book => (
              <BookCard
                key={book.id}
                book={book}
                onProgressUpdate={updateBookProgress}
                onStatusChange={changeBookStatus}
                onRate={rateBook}
                onEdit={setEditingBook}
                onDelete={deleteBook}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {getBooksByStatus('completed').length === 0 ? (
            <div className="text-center py-8">
              <Book size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No completed books yet</p>
            </div>
          ) : (
            getBooksByStatus('completed').map(book => (
              <BookCard
                key={book.id}
                book={book}
                onProgressUpdate={updateBookProgress}
                onStatusChange={changeBookStatus}
                onRate={rateBook}
                onEdit={setEditingBook}
                onDelete={deleteBook}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="wishlist" className="space-y-4">
          {getBooksByStatus('wishlist').length === 0 ? (
            <div className="text-center py-8">
              <Book size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No books in wishlist</p>
            </div>
          ) : (
            getBooksByStatus('wishlist').map(book => (
              <BookCard
                key={book.id}
                book={book}
                onProgressUpdate={updateBookProgress}
                onStatusChange={changeBookStatus}
                onRate={rateBook}
                onEdit={setEditingBook}
                onDelete={deleteBook}
              />
            ))
          )}
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
              <Button variant="outline" onClick={resetForm}>
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
                  min="1"
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
    </div>
  );
}

function BookCard({ 
  book, 
  onProgressUpdate, 
  onStatusChange, 
  onRate,
  onEdit,
  onDelete
}: { 
  book: BookType;
  onProgressUpdate: (id: string, page: number) => void;
  onStatusChange: (id: string, status: BookType['status']) => void;
  onRate: (id: string, rating: number, review?: string) => void;
  onEdit: (book: BookType) => void;
  onDelete: (id: string) => void;
}) {
  const [currentPage, setCurrentPage] = useState(book.currentPage);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(book.rating || 0);
  const [review, setReview] = useState(book.review || '');

  const progress = book.totalPages > 0 ? (book.currentPage / book.totalPages) * 100 : 0;

  const handleProgressUpdate = () => {
    onProgressUpdate(book.id, currentPage);
  };

  const handleRatingSubmit = () => {
    onRate(book.id, rating, review);
    setShowRating(false);
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
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
        <div className="flex items-center gap-2">
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(book)}
            className="text-blue-500 hover:text-blue-700"
          >
            <Edit2 size={12} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(book.id)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 size={12} />
          </Button>
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
              onChange={(e) => setCurrentPage(parseInt(e.target.value) || 0)}
              className="w-20"
            />
            <Button size="sm" onClick={handleProgressUpdate}>
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
            <Button size="sm" variant="outline" onClick={() => setShowRating(true)}>
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

      {/* Rating Dialog */}
      <Dialog open={showRating} onOpenChange={setShowRating}>
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
              <Button variant="outline" onClick={() => setShowRating(false)}>
                Cancel
              </Button>
              <Button onClick={handleRatingSubmit}>
                Save Rating
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
