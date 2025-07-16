
import { useState, useEffect } from 'react';
import { TrendingUp, Target, Calendar, Award, BarChart3, PieChart, LineChart, Download, Upload, Database, Brain, Zap, Heart, Activity, Eye, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dataManager } from '@/utils/dataManager';
import { format, subDays, subMonths, subYears } from 'date-fns';

export function AnalyticsEnhanced() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [analytics, setAnalytics] = useState<any>(null);
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [correlations, setCorrelations] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any>(null);

  useEffect(() => {
    loadAnalytics();
    loadStorageInfo();
    generateInsights();
    loadCorrelations();
    loadTrendData();
  }, [period]);

  const loadAnalytics = () => {
    const data = dataManager.getAnalytics(period);
    setAnalytics(data);
  };

  const loadStorageInfo = () => {
    const info = dataManager.getStorageInfo();
    setStorageInfo(info);
  };

  const generateInsights = () => {
    const personalInsights = dataManager.generatePersonalInsights();
    setInsights(personalInsights);
  };

  const loadCorrelations = () => {
    const correlationData = dataManager.findDataCorrelations();
    setCorrelations(correlationData);
  };

  const loadTrendData = () => {
    // Generate trend data for the last 12 weeks/months
    const trends = [];
    const periodCount = period === 'week' ? 12 : period === 'month' ? 12 : 5;
    
    for (let i = periodCount - 1; i >= 0; i--) {
      const startDate = period === 'week' ? subDays(new Date(), i * 7) :
                       period === 'month' ? subMonths(new Date(), i) :
                       subYears(new Date(), i);
      
      // Calculate metrics for this period
      const wellness = dataManager.getData('wellness', []).filter((entry: any) => {
        const entryDate = new Date(entry.date);
        const periodStart = period === 'week' ? subDays(startDate, 7) :
                           period === 'month' ? subMonths(startDate, 1) :
                           subYears(startDate, 1);
        return entryDate >= periodStart && entryDate <= startDate;
      });
      
      const tasks = dataManager.getData('tasks', []).filter((task: any) => {
        const taskDate = new Date(task.createdAt || task.date);
        const periodStart = period === 'week' ? subDays(startDate, 7) :
                           period === 'month' ? subMonths(startDate, 1) :
                           subYears(startDate, 1);
        return taskDate >= periodStart && taskDate <= startDate;
      });
      
      trends.push({
        period: format(startDate, period === 'week' ? 'MMM dd' : period === 'month' ? 'MMM yyyy' : 'yyyy'),
        mood: wellness.length > 0 ? wellness.reduce((sum: number, w: any) => sum + (w.mood || 0), 0) / wellness.length : 0,
        taskCompletion: tasks.length > 0 ? (tasks.filter((t: any) => t.completed).length / tasks.length) * 100 : 0,
        sleep: wellness.length > 0 ? wellness.reduce((sum: number, w: any) => sum + (w.sleepHours || 0), 0) / wellness.length : 0,
        water: wellness.length > 0 ? wellness.reduce((sum: number, w: any) => sum + (w.waterGlasses || 0), 0) / wellness.length : 0
      });
    }
    
    setTrendData(trends);
  };

  const handleExport = () => {
    const data = dataManager.exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `personal-tracker-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = dataManager.importAllData(content);
      if (success) {
        alert('Data imported successfully!');
        loadAnalytics();
        loadStorageInfo();
        generateInsights();
      } else {
        alert('Failed to import data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleDataRepair = () => {
    const result = dataManager.validateAndRepairData();
    if (result.repaired.length > 0 || result.errors.length > 0) {
      const message = [
        ...result.repaired.map(r => `✅ ${r}`),
        ...result.errors.map(e => `❌ ${e}`)
      ].join('\n');
      alert(`Data validation complete:\n\n${message}`);
      loadAnalytics();
    } else {
      alert('✅ No issues found in your data!');
    }
  };

  const archiveOldData = () => {
    dataManager.archiveOldData();
    alert('Old data has been archived successfully!');
    loadAnalytics();
    loadStorageInfo();
  };

  if (!analytics) {
    return <div>Loading advanced analytics...</div>;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const calculateOverallScore = () => {
    const taskScore = analytics.tasks.completionRate;
    const habitScore = analytics.habits.avgCompletionRate;
    const wellnessScore = (analytics.wellness.averageMood / 10) * 100;
    const productivityScore = analytics.productivity.totalSessions > 0 ? 
      (analytics.productivity.completedSessions / analytics.productivity.totalSessions) * 100 : 0;
    
    return Math.round((taskScore + habitScore + wellnessScore + productivityScore) / 4);
  };

  const overallScore = calculateOverallScore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Advanced Life Analytics</h2>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={(value: 'week' | 'month' | 'year') => setPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Enhanced Overall Score */}
      <Card className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="text-yellow-300" size={24} />
            Life Performance Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{overallScore}%</div>
              <div className="text-sm opacity-90">Overall Score</div>
              <Progress value={overallScore} className="h-2 mt-2 bg-white/20" />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">{analytics.tasks.completionRate.toFixed(0)}%</div>
              <div className="text-sm opacity-90">Task Success</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">{analytics.habits.avgCompletionRate.toFixed(0)}%</div>
              <div className="text-sm opacity-90">Habit Consistency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">{analytics.wellness.averageMood.toFixed(1)}/10</div>
              <div className="text-sm opacity-90">Average Mood</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="correlations">Patterns</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Enhanced Key Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="text-blue-500" size={20} />
                  <span className="text-sm font-medium">Tasks</span>
                </div>
                <p className="text-2xl font-bold">{analytics.tasks.completed}/{analytics.tasks.total}</p>
                <p className="text-xs text-gray-500">
                  {analytics.tasks.completionRate.toFixed(0)}% completion rate
                </p>
                <Progress value={analytics.tasks.completionRate} className="h-1 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="text-purple-500" size={20} />
                  <span className="text-sm font-medium">Habits</span>
                </div>
                <p className="text-2xl font-bold">{analytics.habits.totalCompletions}</p>
                <p className="text-xs text-gray-500">{analytics.habits.activeHabits} active habits</p>
                <Progress value={analytics.habits.avgCompletionRate} className="h-1 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="text-green-500" size={20} />
                  <span className="text-sm font-medium">Focus</span>
                </div>
                <p className="text-2xl font-bold">{Math.round(analytics.productivity.totalMinutes / 60)}h</p>
                <p className="text-xs text-gray-500">{analytics.productivity.totalSessions} sessions</p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex">
                    {Array.from({ length: 5 }, (_, i) => (
                      <div key={i} className={`w-1 h-1 rounded-full mr-1 ${
                        i < Math.round(analytics.productivity.averageQuality) ? 'bg-yellow-400' : 'bg-gray-300'
                      }`} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">avg quality</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="text-pink-500" size={20} />
                  <span className="text-sm font-medium">Wellness</span>
                </div>
                <p className="text-2xl font-bold">{analytics.wellness.averageMood.toFixed(1)}/10</p>
                <p className="text-xs text-gray-500">avg mood</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Sleep</span>
                    <span>{analytics.wellness.averageSleep.toFixed(1)}h</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>Water</span>
                    <span>{(analytics.wellness.totalWater / analytics.wellness.totalEntries || 0).toFixed(1)} glasses/day</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Category Breakdowns */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="text-blue-500" size={18} />
                  Task Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.tasks.byCategory).slice(0, 5).map(([category, count]: [string, any]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500"
                            style={{ width: `${(count / analytics.tasks.total) * 100}%` }}
                          />
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="text-purple-500" size={18} />
                  Habit Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.habits.byCategory).slice(0, 5).map(([category, count]: [string, any]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500"
                            style={{ width: `${(count / analytics.habits.totalHabits) * 100}%` }}
                          />
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="text-green-500" size={18} />
                  Financial Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Income</span>
                    <span className="font-medium text-green-600">
                      +${analytics.financial.totalIncome.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Expenses</span>
                    <span className="font-medium text-red-600">
                      -${analytics.financial.totalExpenses.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Net</span>
                      <span className={`font-bold ${
                        analytics.financial.totalIncome - analytics.financial.totalExpenses >= 0 
                          ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${(analytics.financial.totalIncome - analytics.financial.totalExpenses).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="text-blue-500" size={20} />
                Performance Trends Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendData && (
                <div className="space-y-6">
                  {/* Trend Chart Visualization */}
                  <div className="h-64 flex items-end justify-between gap-2">
                    {trendData.map((point: any, index: number) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div className="w-full flex flex-col items-center gap-1 mb-2">
                          {/* Mood bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-pink-500 h-2 rounded-full"
                              style={{ width: `${(point.mood / 10) * 100}%` }}
                            />
                          </div>
                          {/* Task completion bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${point.taskCompletion}%` }}
                            />
                          </div>
                          {/* Sleep bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full"
                              style={{ width: `${(point.sleep / 12) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 text-center">
                          {point.period}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Legend */}
                  <div className="flex justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-pink-500 rounded-full" />
                      <span>Mood</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span>Tasks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full" />
                      <span>Sleep</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {analytics.productivity.averageSession.toFixed(0)}min
                </div>
                <div className="text-sm text-gray-600">Average Focus Session</div>
                <div className="text-xs text-gray-500 mt-1">
                  {analytics.productivity.totalSessions > 0 ? 
                    `${((analytics.productivity.completedSessions / analytics.productivity.totalSessions) * 100).toFixed(0)}% completion rate` :
                    'No sessions tracked'
                  }
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {analytics.wellness.averageSleep.toFixed(1)}h
                </div>
                <div className="text-sm text-gray-600">Average Sleep</div>
                <div className="text-xs text-gray-500 mt-1">
                  {analytics.wellness.averageSleep >= 7 && analytics.wellness.averageSleep <= 9 ?
                    '✅ Optimal range' :
                    analytics.wellness.averageSleep < 7 ? '⚠️ Below recommended' : 'ℹ️ Above average'
                  }
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {Math.round(analytics.wellness.totalSteps / analytics.wellness.totalEntries || 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Daily Steps Average</div>
                <div className="text-xs text-gray-500 mt-1">
                  {(analytics.wellness.totalSteps / analytics.wellness.totalEntries || 0) >= 10000 ?
                    '🎯 Goal achieved!' : '📈 Keep walking!'
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="text-purple-500" size={20} />
                Personalized Insights & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.length > 0 ? (
                  insights.map((insight, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-blue-500">
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Lightbulb size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Keep tracking to unlock personalized insights!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Achievement System */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="text-yellow-500" size={20} />
                Achievements & Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Task Achievements */}
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="text-sm font-medium">Task Master</div>
                  <div className="text-xs text-gray-500">
                    {analytics.tasks.completed >= 100 ? 'Completed 100+ tasks!' : 
                     analytics.tasks.completed >= 50 ? 'Completed 50+ tasks!' :
                     analytics.tasks.completed >= 10 ? 'Completed 10+ tasks!' :
                     `${analytics.tasks.completed}/10 tasks`}
                  </div>
                </div>

                {/* Habit Achievements */}
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl mb-2">🔥</div>
                  <div className="text-sm font-medium">Habit Streaker</div>
                  <div className="text-xs text-gray-500">
                    {analytics.habits.avgCompletionRate >= 90 ? 'Consistency champion!' :
                     analytics.habits.avgCompletionRate >= 75 ? 'Great consistency!' :
                     analytics.habits.avgCompletionRate >= 50 ? 'Building momentum!' :
                     'Keep going!'}
                  </div>
                </div>

                {/* Focus Achievements */}
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl mb-2">⏰</div>
                  <div className="text-sm font-medium">Focus Champion</div>
                  <div className="text-xs text-gray-500">
                    {analytics.productivity.totalMinutes >= 1800 ? '30+ hours focused!' :
                     analytics.productivity.totalMinutes >= 600 ? '10+ hours focused!' :
                     analytics.productivity.totalMinutes >= 180 ? '3+ hours focused!' :
                     `${Math.round(analytics.productivity.totalMinutes / 60)}h focused`}
                  </div>
                </div>

                {/* Wellness Achievements */}
                <div className="text-center p-4 bg-pink-50 rounded-lg">
                  <div className="text-2xl mb-2">💝</div>
                  <div className="text-sm font-medium">Wellness Warrior</div>
                  <div className="text-xs text-gray-500">
                    {analytics.wellness.averageMood >= 8 ? 'Excellent mood!' :
                     analytics.wellness.averageMood >= 6 ? 'Good vibes!' :
                     analytics.wellness.averageMood >= 4 ? 'Steady mood' :
                     'Focus on wellness'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="text-indigo-500" size={20} />
                Data Patterns & Correlations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {correlations.length > 0 ? (
                  correlations.map((correlation, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={correlation.strength === 'strong' ? 'default' : 'secondary'}>
                          {correlation.strength} correlation
                        </Badge>
                        <span className="font-medium">{correlation.habit}</span>
                      </div>
                      <p className="text-sm text-gray-600">{correlation.correlation}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">Collect more data to discover patterns and correlations!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Life Balance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Life Area Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Work & Productivity</span>
                      <span>{Math.round(analytics.productivity.totalMinutes / 60)}h</span>
                    </div>
                    <Progress value={Math.min((analytics.productivity.totalMinutes / 1200) * 100, 100)} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Health & Wellness</span>
                      <span>{analytics.wellness.averageMood.toFixed(1)}/10</span>
                    </div>
                    <Progress value={(analytics.wellness.averageMood / 10) * 100} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Personal Habits</span>
                      <span>{analytics.habits.avgCompletionRate.toFixed(0)}%</span>
                    </div>
                    <Progress value={analytics.habits.avgCompletionRate} />
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">⚖️</div>
                    <div className="text-sm text-gray-600">
                      Life balance score
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round((
                        Math.min((analytics.productivity.totalMinutes / 1200) * 100, 100) +
                        (analytics.wellness.averageMood / 10) * 100 +
                        analytics.habits.avgCompletionRate
                      ) / 3)}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="text-green-500" size={20} />
                Smart Goal Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Dynamic goal recommendations based on data */}
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-medium text-green-800 mb-2">Productivity Goal</h4>
                  <p className="text-sm text-green-700">
                    {analytics.tasks.completionRate < 70 ? 
                      'Focus on completing 80% of your daily tasks. Start by setting realistic daily goals.' :
                      'Maintain your excellent task completion rate and consider taking on more challenging projects.'
                    }
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <h4 className="font-medium text-purple-800 mb-2">Habit Building Goal</h4>
                  <p className="text-sm text-purple-700">
                    {analytics.habits.avgCompletionRate < 60 ? 
                      'Focus on 2-3 core habits and aim for 80% consistency before adding new ones.' :
                      'Consider adding one new habit that complements your current routine.'
                    }
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-medium text-blue-800 mb-2">Wellness Goal</h4>
                  <p className="text-sm text-blue-700">
                    {analytics.wellness.averageSleep < 7 ? 
                      'Prioritize getting 7-9 hours of sleep nightly. This will improve your mood and productivity.' :
                      analytics.wellness.averageMood < 6 ?
                      'Focus on activities that boost your mood, like exercise, meditation, or social connections.' :
                      'Maintain your excellent wellness habits and consider helping others with their wellness journey.'
                    }
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                  <h4 className="font-medium text-yellow-800 mb-2">Focus Enhancement Goal</h4>
                  <p className="text-sm text-yellow-700">
                    {analytics.productivity.averageSession < 25 ? 
                      'Gradually increase your focus sessions to 25-30 minutes using the Pomodoro technique.' :
                      analytics.productivity.averageQuality < 4 ?
                      'Work on improving focus quality by eliminating distractions and optimizing your environment.' :
                      'Experiment with longer focus sessions or tackle more complex tasks during your peak hours.'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="text-blue-500" size={20} />
                  Storage Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {storageInfo && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Storage Used</span>
                        <span className="font-medium">{storageInfo.totalSize}</span>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {storageInfo.utilization}
                      </div>
                      <div className="text-xs text-gray-500">
                        Total tracked items: {storageInfo.itemCount.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Data Breakdown:</p>
                      <div className="space-y-1 text-xs">
                        {Object.entries(storageInfo.breakdown).slice(0, 5).map(([key, size]: [string, any]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span>{size}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="text-green-500" size={20} />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Export all your data for backup or migration
                    </p>
                    <Button onClick={handleExport} className="w-full">
                      <Download size={16} className="mr-2" />
                      Export All Data
                    </Button>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Import data from a backup file
                    </p>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImport}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <Button variant="outline" className="w-full">
                        <Upload size={16} className="mr-2" />
                        Import Data
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Validate and repair data integrity
                    </p>
                    <Button variant="outline" onClick={handleDataRepair} className="w-full">
                      🔧 Validate & Repair Data
                    </Button>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Archive data older than 10 years
                    </p>
                    <Button variant="outline" onClick={archiveOldData} className="w-full">
                      📦 Archive Old Data
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
                    <p className="font-medium mb-1">Data Capabilities:</p>
                    <p>• Storage: Virtually unlimited for personal use</p>
                    <p>• Retention: Decades of historical data</p>
                    <p>• Compression: Automatic for large datasets</p>
                    <p>• Privacy: 100% local storage</p>
                    <p>• Backup: Manual export/import + auto-backup</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
