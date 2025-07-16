import { useState } from 'react';
import { Plus, Edit2, Trash2, DollarSign, TrendingDown, TrendingUp, ArrowLeft, PieChart, Target } from 'lucide-react';
import { Expense } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BudgetManager } from './BudgetManager';
import { CategorySpending } from './CategorySpending';
import { format } from 'date-fns';

interface ExpenseTrackerProps {
  onBack: () => void;
}

export function ExpenseTracker({ onBack }: ExpenseTrackerProps) {
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: 0,
    category: '',
    type: 'expense' as 'expense' | 'income'
  });

  const addExpense = () => {
    if (!newExpense.description.trim() || newExpense.amount <= 0) return;

    const expense: Expense = {
      id: Date.now().toString(),
      description: newExpense.description,
      amount: newExpense.amount,
      category: newExpense.category,
      date: new Date(),
      paymentMethod: 'cash',
      type: newExpense.type,
      currency: 'USD',
      tags: [],
      createdAt: new Date()
    };

    setExpenses(prev => [expense, ...prev]);
    resetForm();
  };

  const updateExpense = () => {
    if (!editingExpense) return;

    setExpenses(prev => prev.map(expense => expense.id === editingExpense.id ? editingExpense : expense));
    setEditingExpense(null);
  };

  const deleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(expense => expense.id !== expenseId));
  };

  const resetForm = () => {
    setNewExpense({
      description: '',
      amount: 0,
      category: '',
      type: 'expense'
    });
    setIsAddingExpense(false);
  };

  const getExpenseStats = () => {
    const totalExpenses = expenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
    const totalIncome = expenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
    const balance = totalIncome - totalExpenses;
    
    return { totalExpenses, totalIncome, balance };
  };

  const getTypeColor = (type: 'expense' | 'income') => {
    return type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const categories = ['Food', 'Transportation', 'Entertainment', 'Bills', 'Shopping', 'Health', 'Other'];
  const stats = getExpenseStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <h2 className="text-2xl font-bold text-gray-800 flex-1">Expense Tracker</h2>
        <Button onClick={() => setIsAddingExpense(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus size={16} className="mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-red-50 rounded-lg p-4">
          <h3 className="font-semibold text-red-800 flex items-center gap-2">
            <TrendingDown size={16} />
            Total Expenses
          </h3>
          <p className="text-2xl font-bold text-red-600">${stats.totalExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 flex items-center gap-2">
            <TrendingUp size={16} />
            Total Income
          </h3>
          <p className="text-2xl font-bold text-green-600">${stats.totalIncome.toFixed(2)}</p>
        </div>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="expenses" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <DollarSign size={16} />
            Expenses
          </TabsTrigger>
          <TabsTrigger value="budget" className="flex items-center gap-2">
            <Target size={16} />
            Budget
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <PieChart size={16} />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-4">
          {/* Expenses List */}
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No expenses yet</h3>
              <p className="text-gray-500">Start tracking your finances!</p>
            </div>
          ) : (
            expenses.map(expense => (
              <div key={expense.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800">{expense.description}</h3>
                      <Badge className={getTypeColor(expense.type)}>
                        {expense.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {expense.category} • {format(new Date(expense.date), 'MMM d, yyyy')}
                    </p>
                    <p className={`text-lg font-bold ${expense.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {expense.type === 'income' ? '+' : '-'}${expense.amount.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingExpense(expense)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Edit2 size={12} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteExpense(expense.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="budget">
          <BudgetManager expenses={expenses} />
        </TabsContent>

        <TabsContent value="analytics">
          <CategorySpending expenses={expenses} />
        </TabsContent>
      </Tabs>

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
                  min="0"
                  step="0.01"
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
                  min="0"
                  step="0.01"
                  value={editingExpense.amount}
                  onChange={(e) => setEditingExpense(prev => prev ? { ...prev, amount: parseFloat(e.target.value) || 0 } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select value={editingExpense.category} onValueChange={(value) => setEditingExpense(prev => prev ? { ...prev, category: value } : null)}>
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
                <Button variant="outline" onClick={() => setEditingExpense(null)}>
                  Cancel
                </Button>
                <Button onClick={updateExpense}>Update Expense</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
