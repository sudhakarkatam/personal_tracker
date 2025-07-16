
import { useState, useMemo } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, Activity, Target, BarChart3, PieChart, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths, eachMonthOfInterval } from 'date-fns';
import { cn } from '@/lib/utils';

interface MonthlyTrendsProps {
  onBack: () => void;
}

interface MonthlyData {
  month: Date;
  tasks: {
    total: number;
    completed: number;
    completionRate: number;
    categories: Record<string, number>;
  };
  habits: {
    total: number;
    completions: number;
    consistency: number;
    streaks: Record<string, number>;
  };
  wellness: {
    avgMood: number;
    avgEnergy: number;
    avgSleep: number;
    avgWater: number;
    avgSteps: number;
    avgWeight: number;
  };
  focus: {
    sessions: number;
    totalMinutes: number;
    avgQuality: number;
    techniques: Record<string, number>;
  };
  expenses: {
    income: number;
    expenses: number;
    savings: number;
    savingsRate: number;
    categories: Record<string, number>;
  };
  fitness: {
    workouts: number;
    avgDuration: number;
    totalCalories: number;
    exercises: Record<string, number>;
  };
  events: {
    total: number;
    attended: number;
    types: Record<string, number>;
  };
  reading: {
    books: number;
    pages: number;
    avgRating: number;
    genres: Record<string, number>;
  };
  productivity: {
    score: number;
    focusTime: number;
    breakTime: number;
    efficiency: number;
  };
}

export function MonthlyTrendsAnalytics({ onBack }: MonthlyTrendsProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [comparisonMode, setComparisonMode] = useState<'year' | 'previous'>('year');

  const monthlyData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: new Date(selectedYear, 0, 1),
      end: new Date(selectedYear, 11, 31)
    });

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      // Get data from localStorage
      const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      const habits = JSON.parse(localStorage.getItem('habits') || '[]');
      const wellnessEntries = JSON.parse(localStorage.getItem('wellnessEntries') || '[]');
      const focusSessions = JSON.parse(localStorage.getItem('focusSessions') || '[]');
      const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');
      const workouts = JSON.parse(localStorage.getItem('workouts') || '[]');
      const events = JSON.parse(localStorage.getItem('enhancedEvents') || '[]');
      const books = JSON.parse(localStorage.getItem('books') || '[]');

      // Filter data for this month
      const monthTasks = tasks.filter((task: any) => {
        const date = new Date(task.createdAt || task.date);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });

      const monthHabits = habits.filter((habit: any) => {
        const date = new Date(habit.createdAt);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });

      const monthWellness = wellnessEntries.filter((entry: any) => {
        const date = new Date(entry.date);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });

      const monthFocus = focusSessions.filter((session: any) => {
        const date = new Date(session.date);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });

      const monthExpenses = expenses.filter((expense: any) => {
        const date = new Date(expense.date);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });

      const monthWorkouts = workouts.filter((workout: any) => {
        const date = new Date(workout.date);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });

      const monthEvents = events.filter((event: any) => {
        const date = new Date(event.date);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      });

      const monthBooks = books.filter((book: any) => {
        const date = new Date(book.dateFinished || book.dateStarted);
        return book.status === 'completed' && isWithinInterval(date, { start: monthStart, end: monthEnd });
      });

      // Calculate analytics
      const taskAnalytics = {
        total: monthTasks.length,
        completed: monthTasks.filter((t: any) => t.completed).length,
        completionRate: monthTasks.length > 0 ? 
          (monthTasks.filter((t: any) => t.completed).length / monthTasks.length) * 100 : 0,
        categories: monthTasks.reduce((acc: Record<string, number>, task: any) => {
          acc[task.category] = (acc[task.category] || 0) + 1;
          return acc;
        }, {})
      };

      const habitAnalytics = {
        total: monthHabits.length,
        completions: monthWellness.reduce((sum: number, entry: any) => 
          sum + Object.keys(entry.habits || {}).length, 0),
        consistency: monthHabits.length > 0 ? 
          (monthWellness.filter((e: any) => Object.keys(e.habits || {}).length > 0).length / monthWellness.length) * 100 : 0,
        streaks: monthHabits.reduce((acc: Record<string, number>, habit: any) => {
          acc[habit.name] = habit.currentStreak || 0;
          return acc;
        }, {})
      };

      const wellnessAnalytics = {
        avgMood: monthWellness.length > 0 ? 
          monthWellness.reduce((sum: number, e: any) => sum + (e.mood || 0), 0) / monthWellness.length : 0,
        avgEnergy: monthWellness.length > 0 ? 
          monthWellness.reduce((sum: number, e: any) => sum + (e.energy || 0), 0) / monthWellness.length : 0,
        avgSleep: monthWellness.length > 0 ? 
          monthWellness.reduce((sum: number, e: any) => sum + (e.sleep || 0), 0) / monthWellness.length : 0,
        avgWater: monthWellness.length > 0 ? 
          monthWellness.reduce((sum: number, e: any) => sum + (e.water || 0), 0) / monthWellness.length : 0,
        avgSteps: monthWellness.length > 0 ? 
          monthWellness.reduce((sum: number, e: any) => sum + (e.steps || 0), 0) / monthWellness.length : 0,
        avgWeight: monthWellness.length > 0 ? 
          monthWellness.reduce((sum: number, e: any) => sum + (e.weight || 0), 0) / monthWellness.length : 0
      };

      const focusAnalytics = {
        sessions: monthFocus.length,
        totalMinutes: monthFocus.reduce((sum: number, s: any) => sum + (s.duration || 0), 0),
        avgQuality: monthFocus.length > 0 ? 
          monthFocus.reduce((sum: number, s: any) => sum + (s.quality || 0), 0) / monthFocus.length : 0,
        techniques: monthFocus.reduce((acc: Record<string, number>, session: any) => {
          acc[session.technique] = (acc[session.technique] || 0) + 1;
          return acc;
        }, {})
      };

      const expenseAnalytics = {
        income: monthExpenses.filter((e: any) => e.type === 'income').reduce((sum: number, e: any) => sum + e.amount, 0),
        expenses: monthExpenses.filter((e: any) => e.type === 'expense').reduce((sum: number, e: any) => sum + e.amount, 0),
        savings: 0,
        savingsRate: 0,
        categories: monthExpenses.reduce((acc: Record<string, number>, expense: any) => {
          if (expense.type === 'expense') {
            acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
          }
          return acc;
        }, {})
      };
      
      expenseAnalytics.savings = expenseAnalytics.income - expenseAnalytics.expenses;
      expenseAnalytics.savingsRate = expenseAnalytics.income > 0 ? 
        (expenseAnalytics.savings / expenseAnalytics.income) * 100 : 0;

      const fitnessAnalytics = {
        workouts: monthWorkouts.length,
        avgDuration: monthWorkouts.length > 0 ? 
          monthWorkouts.reduce((sum: number, w: any) => sum + (w.duration || 0), 0) / monthWorkouts.length : 0,
        totalCalories: monthWorkouts.reduce((sum: number, w: any) => sum + (w.caloriesBurned || 0), 0),
        exercises: monthWorkouts.reduce((acc: Record<string, number>, workout: any) => {
          (workout.exercises || []).forEach((exercise: any) => {
            acc[exercise.name] = (acc[exercise.name] || 0) + 1;
          });
          return acc;
        }, {})
      };

      const eventAnalytics = {
        total: monthEvents.length,
        attended: monthEvents.filter((e: any) => e.status === 'attended').length,
        types: monthEvents.reduce((acc: Record<string, number>, event: any) => {
          acc[event.type] = (acc[event.type] || 0) + 1;
          return acc;
        }, {})
      };

      const readingAnalytics = {
        books: monthBooks.length,
        pages: monthBooks.reduce((sum: number, book: any) => sum + (book.totalPages || 0), 0),
        avgRating: monthBooks.length > 0 ? 
          monthBooks.reduce((sum: number, book: any) => sum + (book.rating || 0), 0) / monthBooks.length : 0,
        genres: monthBooks.reduce((acc: Record<string, number>, book: any) => {
          acc[book.genre] = (acc[book.genre] || 0) + 1;
          return acc;
        }, {})
      };

      const productivityAnalytics = {
        score: (taskAnalytics.completionRate + habitAnalytics.consistency + (focusAnalytics.avgQuality * 20)) / 3,
        focusTime: focusAnalytics.totalMinutes,
        breakTime: monthFocus.reduce((sum: number, s: any) => sum + (s.breakDuration || 0), 0),
        efficiency: taskAnalytics.completionRate
      };

      return {
        month,
        tasks: taskAnalytics,
        habits: habitAnalytics,
        wellness: wellnessAnalytics,
        focus: focusAnalytics,
        expenses: expenseAnalytics,
        fitness: fitnessAnalytics,
        events: eventAnalytics,
        reading: readingAnalytics,
        productivity: productivityAnalytics
      } as MonthlyData;
    });
  }, [selectedYear]);

  const getYearlyTrends = () => {
    const trends = {
      productivity: {
        average: monthlyData.reduce((sum, month) => sum + month.productivity.score, 0) / 12,
        trend: monthlyData[11]?.productivity.score > monthlyData[0]?.productivity.score ? 'up' : 'down',
        peak: Math.max(...monthlyData.map(m => m.productivity.score)),
        low: Math.min(...monthlyData.map(m => m.productivity.score))
      },
      wellness: {
        avgMood: monthlyData.reduce((sum, month) => sum + month.wellness.avgMood, 0) / 12,
        avgEnergy: monthlyData.reduce((sum, month) => sum + month.wellness.avgEnergy, 0) / 12,
        avgSleep: monthlyData.reduce((sum, month) => sum + month.wellness.avgSleep, 0) / 12
      },
      financial: {
        totalIncome: monthlyData.reduce((sum, month) => sum + month.expenses.income, 0),
        totalExpenses: monthlyData.reduce((sum, month) => sum + month.expenses.expenses, 0),
        totalSavings: monthlyData.reduce((sum, month) => sum + month.expenses.savings, 0),
        avgSavingsRate: monthlyData.reduce((sum, month) => sum + month.expenses.savingsRate, 0) / 12
      },
      fitness: {
        totalWorkouts: monthlyData.reduce((sum, month) => sum + month.fitness.workouts, 0),
        totalCalories: monthlyData.reduce((sum, month) => sum + month.fitness.totalCalories, 0),
        avgWorkoutDuration: monthlyData.reduce((sum, month) => sum + month.fitness.avgDuration, 0) / 12
      },
      learning: {
        totalBooks: monthlyData.reduce((sum, month) => sum + month.reading.books, 0),
        totalPages: monthlyData.reduce((sum, month) => sum + month.reading.pages, 0),
        avgRating: monthlyData.reduce((sum, month) => sum + month.reading.avgRating, 0) / 12
      }
    };

    return trends;
  };

  const getTopPerformingMonths = () => {
    return monthlyData
      .sort((a, b) => b.productivity.score - a.productivity.score)
      .slice(0, 3)
      .map(month => ({
        month: format(month.month, 'MMMM'),
        score: month.productivity.score.toFixed(1)
      }));
  };

  const getInsights = () => {
    const trends = getYearlyTrends();
    const insights = [];

    if (trends.productivity.trend === 'up') {
      insights.push({
        type: 'positive',
        title: 'Productivity Improvement',
        description: `Your productivity score improved throughout ${selectedYear}, showing consistent growth.`
      });
    }

    if (trends.wellness.avgMood >= 7) {
      insights.push({
        type: 'positive',
        title: 'Great Mental Health',
        description: `You maintained an excellent average mood score of ${trends.wellness.avgMood.toFixed(1)}/10.`
      });
    }

    if (trends.financial.avgSavingsRate >= 20) {
      insights.push({
        type: 'positive',
        title: 'Excellent Savings Habit',
        description: `You saved ${trends.financial.avgSavingsRate.toFixed(1)}% of your income on average - well above the recommended 20%.`
      });
    }

    if (trends.fitness.totalWorkouts < 52) {
      insights.push({
        type: 'suggestion',
        title: 'Fitness Opportunity',
        description: `Consider increasing workout frequency. You averaged ${(trends.fitness.totalWorkouts / 12).toFixed(1)} workouts per month.`
      });
    }

    return insights;
  };

  const yearlyTrends = getYearlyTrends();
  const topMonths = getTopPerformingMonths();
  const insights = getInsights();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <h2 className="text-2xl font-bold text-gray-800 flex-1">Monthly Trends & Analytics</h2>
        <div className="flex gap-2">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Yearly Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
          <h3 className="font-semibold text-purple-800 flex items-center gap-2">
            <Activity size={16} />
            Avg Productivity
          </h3>
          <p className="text-2xl font-bold text-purple-600">{yearlyTrends.productivity.average.toFixed(1)}%</p>
          <div className="flex items-center gap-1 text-xs">
            {yearlyTrends.productivity.trend === 'up' ? 
              <TrendingUp size={12} className="text-green-500" /> : 
              <TrendingDown size={12} className="text-red-500" />
            }
            <span className={yearlyTrends.productivity.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
              {yearlyTrends.productivity.trend === 'up' ? 'Improving' : 'Declining'}
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
          <h3 className="font-semibold text-green-800">Financial Health</h3>
          <p className="text-2xl font-bold text-green-600">{yearlyTrends.financial.avgSavingsRate.toFixed(1)}%</p>
          <p className="text-xs text-green-600">Avg Savings Rate</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800">Wellness Score</h3>
          <p className="text-2xl font-bold text-blue-600">{yearlyTrends.wellness.avgMood.toFixed(1)}/10</p>
          <p className="text-xs text-blue-600">Avg Mood</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
          <h3 className="font-semibold text-orange-800">Learning</h3>
          <p className="text-2xl font-bold text-orange-600">{yearlyTrends.learning.totalBooks}</p>
          <p className="text-xs text-orange-600">Books Completed</p>
        </div>
      </div>

      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monthly">Monthly View</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <div className="grid gap-4">
            {monthlyData.map((monthData, index) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 mb-3">
                  {format(monthData.month, 'MMMM yyyy')}
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Productivity</p>
                    <p className="text-xl font-bold text-purple-600">{monthData.productivity.score.toFixed(1)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Tasks</p>
                    <p className="text-xl font-bold text-blue-600">{monthData.tasks.completed}/{monthData.tasks.total}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Focus</p>
                    <p className="text-xl font-bold text-green-600">{Math.round(monthData.focus.totalMinutes / 60)}h</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Savings</p>
                    <p className="text-xl font-bold text-orange-600">${monthData.expenses.savings.toFixed(0)}</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Mood:</span> {monthData.wellness.avgMood.toFixed(1)}/10
                  </div>
                  <div>
                    <span className="text-gray-500">Workouts:</span> {monthData.fitness.workouts}
                  </div>
                  <div>
                    <span className="text-gray-500">Books:</span> {monthData.reading.books}
                  </div>
                  <div>
                    <span className="text-gray-500">Events:</span> {monthData.events.total}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <LineChart size={16} />
                Productivity Trends
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Yearly Average:</span>
                  <span className="font-medium">{yearlyTrends.productivity.average.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Peak Month:</span>
                  <span className="font-medium text-green-600">{yearlyTrends.productivity.peak.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Lowest Month:</span>
                  <span className="font-medium text-red-600">{yearlyTrends.productivity.low.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3">Top Performing Months</h3>
              <div className="space-y-2">
                {topMonths.map((month, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                        index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-amber-600"
                      )}>
                        {index + 1}
                      </span>
                      <span className="font-medium">{month.month}</span>
                    </div>
                    <span className="text-sm font-semibold text-purple-600">{month.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className={cn(
                "rounded-lg p-4",
                insight.type === 'positive' ? "bg-green-50 border border-green-200" :
                insight.type === 'suggestion' ? "bg-yellow-50 border border-yellow-200" :
                "bg-blue-50 border border-blue-200"
              )}>
                <h4 className={cn(
                  "font-semibold mb-2",
                  insight.type === 'positive' ? "text-green-800" :
                  insight.type === 'suggestion' ? "text-yellow-800" :
                  "text-blue-800"
                )}>
                  {insight.title}
                </h4>
                <p className={cn(
                  "text-sm",
                  insight.type === 'positive' ? "text-green-700" :
                  insight.type === 'suggestion' ? "text-yellow-700" :
                  "text-blue-700"
                )}>
                  {insight.description}
                </p>
              </div>
            ))}

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3">Year Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total Income:</p>
                  <p className="font-semibold text-green-600">${yearlyTrends.financial.totalIncome.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Savings:</p>
                  <p className="font-semibold text-blue-600">${yearlyTrends.financial.totalSavings.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Workouts:</p>
                  <p className="font-semibold text-orange-600">{yearlyTrends.fitness.totalWorkouts}</p>
                </div>
                <div>
                  <p className="text-gray-600">Pages Read:</p>
                  <p className="font-semibold text-purple-600">{yearlyTrends.learning.totalPages}</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3">Year-over-Year Comparison</h3>
            <p className="text-sm text-gray-600">
              Compare {selectedYear} with previous years to track long-term progress.
            </p>
            {/* This would contain comparison charts and data */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg text-center text-gray-500">
              Comparison view - Historical data analysis
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
