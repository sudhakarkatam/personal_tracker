
import { useState } from 'react';
import { Plus, Edit2, Trash2, DollarSign, TrendingUp, TrendingDown, Calendar, Download } from 'lucide-react';
import { Expense } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';

interface ExpenseTrackerEnhancedProps {
  onBack: () => void;
}

export function ExpenseTrackerEnhanced({ onBack }: ExpenseTrackerEnhancedProps) {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expensesEnhanced', []);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());

  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: 0,
    category: '',
    type: 'expense' as 'expense' | 'income',
    paymentMethod: 'cash',
    currency: 'USD',
    tags: [] as string[]
  });

  const categories = ['Food', 'Transportation', 'Entertainment', 'Bills', 'Shopping', 'Health', 'Other'];
  const paymentMethods = ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'digital_wallet'];

  const addExpense = () => {
    if (!newExpense.description.trim() || newExpense.amount <= 0) return;

    const expense: Expense = {
      id: Date.now().toString(),
      description: newExpense.description,
      amount: newExpense.amount,
      category: newExpense.category,
      date: new Date(),
      paymentMethod: newExpense.paymentMethod,
      type: newExpense.type,
      currency: newExpense.currency,
      tags: newExpense.tags,
      createdAt: new Date()
    };

    setExpenses(prev => [expense, ...prev]);
    resetForm();
  };

  const updateExpense = () => {
    if (!editingExpense) return;

    setExpenses(prev =>
      prev.map(expense =>
        expense.id === editingExpense.id ? editingExpense : expense
      )
    );
    setEditingExpense(null);
  };

  const confirmDeleteExpense = (expenseId: string) => {
    setDeletingExpenseId(expenseId);
    setShowDeleteConfirm(true);
  };

  const deleteExpense = () => {
    if (!deletingExpenseId) return;
    
    setExpenses(prev => prev.filter(expense => expense.id !== deletingExpenseId));
    setShowDeleteConfirm(false);
    setDeletingExpenseId(null);
  };

  const bulkDeleteExpenses = () => {
    setExpenses(prev => prev.filter(expense => !selectedExpenses.has(expense.id)));
    setSelectedExpenses(new Set());
  };

  const exportData = () => {
    const dataStr = JSON.stringify(expenses, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expense-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
  };

  const resetForm = () => {
    setNewExpense({
      description: '',
      amount: 0,
      category: '',
      type: 'expense',
      paymentMethod: 'cash',
      currency: 'USD',
      tags: []
    });
    setIsAddingExpense(false);
  };

  const toggleSelectExpense = (expenseId: string) => {
    const newSelected = new Set(selectedExpenses);
    if (newSelected.has(expenseId)) {
      newSelected.delete(expenseId);
    } else {
      newSelected.add(expenseId);
    }
    setSelectedExpenses(newSelected);
  };

  const getTypeColor = (type: 'expense' | 'income') => {
    return type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getExpenseStats = () => {
    const totalExpenses = expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
    const balance = totalIncome - totalExpenses;
    
    return { totalExpenses, totalIncome, balance };
  };

  const stats = getExpenseStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Enhanced Expense Tracker</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportData}>
            <Download size={16} className="mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsAddingExpense(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus size={16} className="mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="text-red-500" size={20} />
              <span className="text-sm font-medium">Total Expenses</span>
            </div>
            <p className="text-2xl font-bold text-red-600">${stats.totalExpenses.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-green-500" size={20} />
              <span className="text-sm font-medium">Total Income</span>
            </div>
            <p className="text-2xl font-bold text-green-600">${stats.totalIncome.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="text-blue-500" size={20} />
              <span className="text-sm font-medium">Balance</span>
            </div>
            <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${stats.balance.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      {selectedExpenses.size > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedExpenses.size} expense{selectedExpenses.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedExpenses(new Set())}>
                Clear Selection
              </Button>
              <Button variant="destructive" size="sm" onClick={bulkDeleteExpenses}>
                Delete Selected
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Expenses List */}
      <div className="space-y-4">
        {expenses.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No expenses yet</h3>
            <p className="text-gray-500">Start tracking your finances!</p>
          </div>
        ) : (
          expenses.map(expense => (
            <Card key={expense.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedExpenses.has(expense.id)}
                      onCheckedChange={() => toggleSelectExpense(expense.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{expense.description}</h3>
                        <Badge className={getTypeColor(expense.type)}>
                          {expense.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {expense.category} • {expense.paymentMethod} • {format(new Date(expense.date), 'MMM d, yyyy')}
                      </p>
                      <p className={`text-lg font-bold ${expense.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {expense.type === 'income' ? '+' : '-'}${expense.amount.toFixed(2)} {expense.currency}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditingExpense(expense)}>
                      <Edit2 size={12} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => confirmDeleteExpense(expense.id)}>
                      <Trash2 size={12} className="text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Expense Dialog */}
      <Dialog open={isAddingExpense} onOpenChange={setIsAddingExpense}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newExpense.description}
                onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Expense description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={newExpense.type} onValueChange={(value: 'expense' | 'income') => setNewExpense(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={newExpense.category} onValueChange={(value) => setNewExpense(prev => ({ ...prev, category: value }))}>
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
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={newExpense.paymentMethod} onValueChange={(value) => setNewExpense(prev => ({ ...prev, paymentMethod: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(method => (
                      <SelectItem key={method} value={method}>
                        {method.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={addExpense}>Add Expense</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={!!editingExpense} onOpenChange={() => setEditingExpense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          {editingExpense && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editingExpense.description}
                  onChange={(e) => setEditingExpense(prev => prev ? { ...prev, description: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit-amount">Amount</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  value={editingExpense.amount}
                  onChange={(e) => setEditingExpense(prev => prev ? { ...prev, amount: parseFloat(e.target.value) || 0 } : null)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingExpense(null)}>
                  Cancel
                </Button>
                <Button onClick={updateExpense}>Update Expense</Button>
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
            Are you sure you want to delete this expense? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteExpense}>
              Delete Expense
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
