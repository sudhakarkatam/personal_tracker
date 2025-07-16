
import { Expense } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

interface CategorySpendingProps {
  expenses: Expense[];
}

export function CategorySpending({ expenses }: CategorySpendingProps) {
  const getCurrentMonthExpenses = () => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    return expenses.filter(expense => 
      expense.type === 'expense' &&
      isWithinInterval(new Date(expense.date), { start: monthStart, end: monthEnd })
    );
  };

  const getCategorySpending = () => {
    const monthlyExpenses = getCurrentMonthExpenses();
    const categoryTotals: { [key: string]: number } = {};

    monthlyExpenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  const totalSpending = getCurrentMonthExpenses().reduce((sum, expense) => sum + expense.amount, 0);
  const categoryData = getCategorySpending();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Category Spending - {format(new Date(), 'MMMM yyyy')}</h3>
        <div className="text-sm text-gray-600">
          Total: ${totalSpending.toFixed(2)}
        </div>
      </div>

      {categoryData.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">No expenses recorded this month</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryData.map((item, index) => {
              const percentage = (item.amount / totalSpending) * 100;
              return (
                <div key={item.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{item.category}</span>
                    <div className="text-right">
                      <div className="font-semibold">${item.amount.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
