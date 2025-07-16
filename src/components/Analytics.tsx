
import { ArrowLeft, BarChart3, Calendar, Target, Clock, TrendingUp, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format, startOfMonth, endOfMonth, isWithinInterval, subDays, startOfWeek, addDays } from 'date-fns';

interface AnalyticsProps {
  onBack: () => void;
}

export function Analytics({ onBack }: AnalyticsProps) {
  // Get data from localStorage
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  const habits = JSON.parse(localStorage.getItem('habits') || '[]');
  const focusSessions = JSON.parse(localStorage.getItem('focusSessions') || '[]');
  const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
  const books = JSON.parse(localStorage.getItem('books') || '[]');
  const wellness = JSON.parse(localStorage.getItem('wellness') || '[]');

  const getMonthlyStats = () => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    // Tasks
    const monthlyTasks = tasks.filter((task: any) => {
      if (!task.createdAt) return false;
      return isWithinInterval(new Date(task.createdAt), { start: monthStart, end: monthEnd });
    });
    const completedTasks = monthlyTasks.filter((task: any) => task.completed);

    // Focus Sessions
    const monthlyFocusSessions = focusSessions.filter((session: any) => {
      if (!session.date) return false;
      return isWithinInterval(new Date(session.date), { start: monthStart, end: monthEnd }) && 
             session.type === 'focus' && session.completed;
    });
    const totalFocusMinutes = monthlyFocusSessions.reduce((sum: number, session: any) => sum + session.duration, 0);

    // Books
    const booksCompleted = books.filter((book: any) => {
      if (!book.completedDate) return false;
      return isWithinInterval(new Date(book.completedDate), { start: monthStart, end: monthEnd });
    });

    // Expenses
    const monthlyExpenses = expenses.filter((expense: any) => {
      if (!expense.date) return false;
      return isWithinInterval(new Date(expense.date), { start: monthStart, end: monthEnd }) &&
             expense.type === 'expense';
    });
    const totalExpenses = monthlyExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);

    return {
      tasks: {
        total: monthlyTasks.length,
        completed: completedTasks.length,
        completion: monthlyTasks.length > 0 ? (completedTasks.length / monthlyTasks.length) * 100 : 0
      },
      focus: {
        sessions: monthlyFocusSessions.length,
        minutes: totalFocusMinutes,
        hours: Math.round(totalFocusMinutes / 60 * 10) / 10
      },
      books: booksCompleted.length,
      expenses: totalExpenses
    };
  };

  const getWeeklyHabitStats = () => {
    const startWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => format(addDays(startWeek, i), 'yyyy-MM-dd'));
    
    return habits.map((habit: any) => {
      const weekCompletions = weekDays.map(date => {
        const completion = habit.completions?.find((c: any) => c.date === date);
        return completion?.completed || false;
      });
      
      const completedDays = weekCompletions.filter(Boolean).length;
      const consistency = (completedDays / 7) * 100;
      
      return {
        name: habit.name,
        completedDays,
        consistency,
        weekCompletions
      };
    });
  };

  const getProductivityScore = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Tasks completed
      const dayTasks = tasks.filter((task: any) => {
        if (!task.updatedAt || !task.completed) return false;
        return format(new Date(task.updatedAt), 'yyyy-MM-dd') === dateStr;
      }).length;
      
      // Focus sessions
      const dayFocus = focusSessions.filter((session: any) => {
        if (!session.date || session.type !== 'focus') return false;
        return format(new Date(session.date), 'yyyy-MM-dd') === dateStr;
      }).length;
      
      // Habits completed
      const dayHabits = habits.reduce((count: number, habit: any) => {
        const completion = habit.completions?.find((c: any) => c.date === dateStr);
        return count + (completion?.completed ? 1 : 0);
      }, 0);
      
      const score = (dayTasks * 10) + (dayFocus * 5) + (dayHabits * 3);
      return { date, score, tasks: dayTasks, focus: dayFocus, habits: dayHabits };
    });
    
    const avgScore = last7Days.reduce((sum, day) => sum + day.score, 0) / 7;
    return { avgScore: Math.round(avgScore), dailyScores: last7Days.reverse() };
  };

  const monthlyStats = getMonthlyStats();
  const habitStats = getWeeklyHabitStats();
  const productivityData = getProductivityScore();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <h2 className="text-2xl font-bold text-gray-800 flex-1">Analytics</h2>
      </div>

      {/* Monthly Overview */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="text-blue-500" size={16} />
              Tasks This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completed</span>
                <span>{monthlyStats.tasks.completed}/{monthlyStats.tasks.total}</span>
              </div>
              <Progress value={monthlyStats.tasks.completion} className="h-2" />
              <p className="text-xs text-gray-500">
                {Math.round(monthlyStats.tasks.completion)}% completion rate
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="text-purple-500" size={16} />
              Focus Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-purple-600">
                {monthlyStats.focus.hours}h
              </p>
              <p className="text-xs text-gray-500">
                {monthlyStats.focus.sessions} sessions completed
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Productivity Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="text-yellow-500" size={20} />
            Productivity Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {productivityData.avgScore}
              </div>
              <p className="text-sm text-gray-600">7-day average</p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Daily Breakdown</h4>
              {productivityData.dailyScores.map((day, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-12 text-xs text-gray-500">
                    {format(day.date, 'EEE')}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Score: {day.score}</span>
                      <span>{day.tasks}T • {day.focus}F • {day.habits}H</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400"
                        style={{ width: `${Math.min((day.score / 50) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Habit Consistency */}
      {habitStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="text-green-500" size={20} />
              Habit Consistency (This Week)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {habitStats.map((habit: any, index: number) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{habit.name}</span>
                    <span className="text-sm text-gray-600">
                      {habit.completedDays}/7 days ({Math.round(habit.consistency)}%)
                    </span>
                  </div>
                  <div className="flex gap-1 mb-2">
                    {habit.weekCompletions.map((completed: boolean, dayIndex: number) => (
                      <div
                        key={dayIndex}
                        className={`flex-1 h-3 rounded ${
                          completed ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="text-indigo-500" size={16} />
              Books Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-indigo-600">
              {monthlyStats.books}
            </p>
            <p className="text-xs text-gray-500">this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="text-red-500" size={16} />
              Monthly Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              ${monthlyStats.expenses.toFixed(0)}
            </p>
            <p className="text-xs text-gray-500">total spent</p>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {monthlyStats.tasks.completion > 80 && (
              <p className="text-green-600">🎉 Excellent task completion rate this month!</p>
            )}
            {monthlyStats.focus.hours > 10 && (
              <p className="text-purple-600">🔥 Great focus time - you've been very productive!</p>
            )}
            {habitStats.some((h: any) => h.consistency > 85) && (
              <p className="text-blue-600">💪 Strong habit consistency - keep it up!</p>
            )}
            {monthlyStats.books > 0 && (
              <p className="text-indigo-600">📚 Nice reading progress this month!</p>
            )}
            {productivityData.avgScore > 30 && (
              <p className="text-yellow-600">⭐ High productivity score - you're on fire!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
