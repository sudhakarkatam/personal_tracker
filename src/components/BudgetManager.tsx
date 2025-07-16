
import { useState } from 'react';
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown, Calendar, Target } from 'lucide-react';
import { Budget, Expense } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface BudgetManagerProps {
  expenses: Expense[];
}

export function BudgetManager({ expenses }: BudgetManagerProps) {
  const [budgets, setBudgets] = useLocalStorage<Budget[]>('budgets', []);
  const [isAddingBudget, setIsAddingBudget] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [newBudget, setNewBudget] = useState({
    category: '',
    amount: 0,
    period: 'monthly' as 'weekly' | 'monthly' | 'yearly'
  });

  const categories = ['All', 'Food', 'Transportation', 'Entertainment', 'Bills', 'Shopping', 'Health', 'Other'];

  const addBudget = () => {
    if (!newBudget.category || newBudget.amount <= 0) return;

    const budget: Budget = {
      id: Date.now().toString(),
      category: newBudget.category,
      amount: newBudget.amount,
      spent: 0,
      period: newBudget.period,
      createdAt: new Date()
    };

    setBudgets(prev => [budget, ...prev]);
    resetForm();
  };

  const updateBudget = () => {
    if (!editingBudget) return;
    setBudgets(prev => prev.map(budget => budget.id === editingBudget.id ? editingBudget : budget));
    setEditingBudget(null);
  };

  const deleteBudget = (budgetId: string) => {
    setBudgets(prev => prev.filter(budget => budget.id !== budgetId));
  };

  const resetForm = () => {
    setNewBudget({
      category: '',
      amount: 0,
      period: 'monthly'
    });
    setIsAddingBudget(false);
  };

  const getCurrentMonthSpending = (category: string) => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    if (category === 'All') {
      return expenses
        .filter(expense => 
          expense.type === 'expense' &&
          isWithinInterval(new Date(expense.date), { start: monthStart, end: monthEnd })
        )
        .reduce((sum, expense) => sum + expense.amount, 0);
    }

    return expenses
      .filter(expense => 
        expense.type === 'expense' && 
        expense.category === category &&
        isWithinInterval(new Date(expense.date), { start: monthStart, end: monthEnd })
      )
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getCurrentMonthIncome = () => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    return expenses
      .filter(expense => 
        expense.type === 'income' &&
        isWithinInterval(new Date(expense.date), { start: monthStart, end: monthEnd })
      )
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getBudgetStatus = (budget: Budget) => {
    const spent = getCurrentMonthSpending(budget.category);
    const percentage = (spent / budget.amount) * 100;
    
    if (percentage >= 100) return { status: 'over', color: 'text-red-600' };
    if (percentage >= 80) return { status: 'warning', color: 'text-yellow-600' };
    return { status: 'good', color: 'text-green-600' };
  };

  const getTotalBudget = () => budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const getTotalSpent = () => budgets.reduce((sum, budget) => sum + getCurrentMonthSpending(budget.category), 0);
  const totalIncome = getCurrentMonthIncome();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Monthly Budget</h3>
        <Button onClick={() => setIsAddingBudget(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus size={16} className="mr-2" />
          Add Budget
        </Button>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="text-blue-500" size={20} />
              <span className="text-sm font-medium">Total Budget</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">${getTotalBudget().toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="text-red-500" size={20} />
              <span className="text-sm font-medium">Total Spent</span>
            </div>
            <p className="text-2xl font-bold text-red-600">${getTotalSpent().toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="text-green-500" size={20} />
              <span className="text-sm font-medium">Total Income</span>
            </div>
            <p className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget List */}
      <div className="space-y-4">
        {budgets.length === 0 ? (
          <div className="text-center py-8">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No budgets set</h3>
            <p className="text-gray-500">Create your first budget to track spending!</p>
          </div>
        ) : (
          budgets.map(budget => {
            const spent = getCurrentMonthSpending(budget.category);
            const percentage = Math.min((spent / budget.amount) * 100, 100);
            const status = getBudgetStatus(budget);
            
            return (
              <Card key={budget.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg">{budget.category}</h4>
                      <p className="text-sm text-gray-600">
                        ${spent.toFixed(2)} of ${budget.amount.toFixed(2)} spent
                      </p>
                      {budget.category === 'All' && (
                        <p className="text-xs text-green-600">
                          Income this month: ${totalIncome.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={status.status === 'over' ? 'destructive' : status.status === 'warning' ? 'secondary' : 'default'}>
                        {percentage.toFixed(0)}%
                      </Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingBudget(budget)}>
                          <Edit2 size={12} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteBudget(budget.id)}>
                          <Trash2 size={12} className="text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2 mb-2" />
                  <div className="flex justify-between text-sm">
                    <span className={status.color}>
                      {status.status === 'over' ? 'Over budget' : 
                       status.status === 'warning' ? 'Close to limit' : 'On track'}
                    </span>
                    <span className="text-gray-500">
                      ${(budget.amount - spent).toFixed(2)} remaining
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Budget Dialog */}
      <Dialog open={isAddingBudget} onOpenChange={setIsAddingBudget}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={newBudget.category} onValueChange={(value) => setNewBudget(prev => ({ ...prev, category: value }))}>
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
              <Label htmlFor="amount">Budget Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={newBudget.amount}
                onChange={(e) => setNewBudget(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="Enter budget amount"
              />
            </div>
            <div>
              <Label htmlFor="period">Period</Label>
              <Select value={newBudget.period} onValueChange={(value: 'weekly' | 'monthly' | 'yearly') => setNewBudget(prev => ({ ...prev, period: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={addBudget}>Add Budget</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Budget Dialog */}
      <Dialog open={!!editingBudget} onOpenChange={() => setEditingBudget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Budget</DialogTitle>
          </DialogHeader>
          {editingBudget && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select value={editingBudget.category} onValueChange={(value) => setEditingBudget(prev => prev ? { ...prev, category: value } : null)}>
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
              <div>
                <Label htmlFor="edit-amount">Budget Amount</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingBudget.amount}
                  onChange={(e) => setEditingBudget(prev => prev ? { ...prev, amount: parseFloat(e.target.value) || 0 } : null)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingBudget(null)}>
                  Cancel
                </Button>
                <Button onClick={updateBudget}>Update Budget</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
