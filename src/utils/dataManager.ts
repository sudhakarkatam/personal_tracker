import { format, subDays, subMonths, subYears } from 'date-fns';

export interface DataManagerOptions {
  compressionThreshold?: number;
  maxHistoryYears?: number;
  autoBackup?: boolean;
}

export class DataManager {
  private options: DataManagerOptions;

  constructor(options: DataManagerOptions = {}) {
    this.options = {
      compressionThreshold: 10000,
      maxHistoryYears: 10,
      autoBackup: true,
      ...options
    };
  }

  // Core data operations
  getData<T>(key: string, defaultValue: T = [] as any): T {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      
      const data = JSON.parse(item);
      
      // Decompress if needed
      if (data._compressed) {
        return this.decompress(data.data);
      }
      
      return data;
    } catch (error) {
      console.error(`Error getting data for key ${key}:`, error);
      return defaultValue;
    }
  }

  setData<T>(key: string, data: T): boolean {
    try {
      let dataToStore = data;
      
      // Auto-compress large datasets
      if (JSON.stringify(data).length > this.options.compressionThreshold!) {
        dataToStore = {
          _compressed: true,
          data: this.compress(data),
          compressedAt: new Date().toISOString()
        } as any;
      }
      
      localStorage.setItem(key, JSON.stringify(dataToStore));
      
      // Trigger data update event
      window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { key, data } }));
      
      // Auto-backup if enabled
      if (this.options.autoBackup) {
        this.createAutoBackup();
      }
      
      return true;
    } catch (error) {
      console.error(`Error setting data for key ${key}:`, error);
      return false;
    }
  }

  // Data compression (simple string compression)
  private compress(data: any): string {
    const jsonString = JSON.stringify(data);
    // Simple compression - in a real app, you'd use a proper compression library
    return btoa(jsonString);
  }

  private decompress(compressedData: string): any {
    try {
      const jsonString = atob(compressedData);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Error decompressing data:', error);
      return null;
    }
  }

  // Archive old data
  archiveOldData(): void {
    const cutoffDate = subYears(new Date(), this.options.maxHistoryYears!);
    const keysToArchive = [
      'tasks', 'habits', 'habitsEnhanced', 'wellness', 
      'focusSessions', 'expenses', 'reading', 'notes',
      'workouts', 'recipes', 'ideas', 'learning'
    ];

    keysToArchive.forEach(key => {
      const data = this.getData(key, []);
      if (Array.isArray(data)) {
        const recentData = data.filter((item: any) => {
          const itemDate = new Date(item.createdAt || item.date || item.dueDate);
          return itemDate >= cutoffDate;
        });
        
        const archivedData = data.filter((item: any) => {
          const itemDate = new Date(item.createdAt || item.date || item.dueDate);
          return itemDate < cutoffDate;
        });

        if (archivedData.length > 0) {
          // Store archived data
          const archiveKey = `${key}_archive_${format(new Date(), 'yyyy')}`;
          this.setData(archiveKey, archivedData);
          
          // Update main data with recent items only
          this.setData(key, recentData);
        }
      }
    });
  }

  // Get analytics for any time period
  getAnalytics(period: 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    const startDate = period === 'week' ? subDays(now, 7) :
                     period === 'month' ? subMonths(now, 1) :
                     subYears(now, 1);

    const tasks = this.getData('tasks', []).filter((task: any) => 
      new Date(task.createdAt || task.date) >= startDate
    );
    
    const habits = this.getData('habitsEnhanced', []).filter((habit: any) => 
      habit.isActive
    );
    
    const wellness = this.getData('wellness', []).filter((entry: any) => 
      new Date(entry.date) >= startDate
    );
    
    const focus = this.getData('focusSessions', []).filter((session: any) => 
      new Date(session.createdAt || session.date) >= startDate
    );

    const expenses = this.getData('expenses', []).filter((expense: any) => 
      new Date(expense.date) >= startDate
    );

    return {
      tasks: {
        total: tasks.length,
        completed: tasks.filter((t: any) => t.completed).length,
        byCategory: this.groupBy(tasks, 'category'),
        byPriority: this.groupBy(tasks, 'priority'),
        completionRate: tasks.length > 0 ? (tasks.filter((t: any) => t.completed).length / tasks.length) * 100 : 0
      },
      habits: {
        activeHabits: habits.length,
        totalHabits: this.getData('habitsEnhanced', []).length,
        totalCompletions: habits.reduce((sum: number, habit: any) => {
          return sum + (habit.completions?.filter((c: any) => 
            new Date(c.date) >= startDate && c.completed
          ).length || 0);
        }, 0),
        byCategory: this.groupBy(habits, 'category'),
        avgCompletionRate: this.calculateHabitCompletionRate(habits, startDate)
      },
      wellness: {
        totalEntries: wellness.length,
        averageMood: wellness.length > 0 ? 
          wellness.reduce((sum: number, w: any) => sum + (w.mood || 0), 0) / wellness.length : 0,
        averageSleep: wellness.length > 0 ? 
          wellness.reduce((sum: number, w: any) => sum + (w.sleepHours || 0), 0) / wellness.length : 0,
        averageEnergy: wellness.length > 0 ? 
          wellness.reduce((sum: number, w: any) => sum + (w.energyLevel || 0), 0) / wellness.length : 0,
        totalWater: wellness.reduce((sum: number, w: any) => sum + (w.waterGlasses || 0), 0),
        totalSteps: wellness.reduce((sum: number, w: any) => sum + (w.steps || 0), 0)
      },
      productivity: {
        totalSessions: focus.length,
        totalMinutes: focus.reduce((sum: number, f: any) => sum + (f.duration || 0), 0),
        completedSessions: focus.filter((f: any) => f.completed).length,
        averageSession: focus.length > 0 ? 
          focus.reduce((sum: number, f: any) => sum + (f.duration || 0), 0) / focus.length : 0,
        averageQuality: focus.length > 0 ? 
          focus.reduce((sum: number, f: any) => sum + (f.quality || 0), 0) / focus.length : 0
      },
      financial: {
        totalExpenses: expenses.filter((e: any) => e.type === 'expense').reduce((sum: number, e: any) => sum + e.amount, 0),
        totalIncome: expenses.filter((e: any) => e.type === 'income').reduce((sum: number, e: any) => sum + e.amount, 0),
        expensesByCategory: this.groupByAmount(expenses.filter((e: any) => e.type === 'expense'), 'category'),
        transactionCount: expenses.length
      },
      period,
      generatedAt: new Date().toISOString()
    };
  }

  // Helper methods
  private groupBy(array: any[], key: string): Record<string, number> {
    return array.reduce((acc, item) => {
      const value = item[key] || 'Uncategorized';
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  private groupByAmount(array: any[], key: string): Record<string, number> {
    return array.reduce((acc, item) => {
      const value = item[key] || 'Uncategorized';
      acc[value] = (acc[value] || 0) + item.amount;
      return acc;
    }, {});
  }

  private calculateHabitCompletionRate(habits: any[], startDate: Date): number {
    if (habits.length === 0) return 0;
    
    const totalPossibleCompletions = habits.length * this.daysBetween(startDate, new Date());
    const actualCompletions = habits.reduce((sum: number, habit: any) => {
      return sum + (habit.completions?.filter((c: any) => 
        new Date(c.date) >= startDate && c.completed
      ).length || 0);
    }, 0);
    
    return totalPossibleCompletions > 0 ? (actualCompletions / totalPossibleCompletions) * 100 : 0;
  }

  private daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
  }

  // Storage info
  getStorageInfo() {
    const usage = this.calculateStorageUsage();
    return {
      totalSize: this.formatBytes(usage.total),
      utilization: `${usage.percentage.toFixed(1)}% of estimated 5MB limit`,
      breakdown: usage.breakdown,
      itemCount: usage.itemCount
    };
  }

  private calculateStorageUsage() {
    let total = 0;
    const breakdown: Record<string, string> = {};
    let itemCount = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const size = localStorage.getItem(key)?.length || 0;
        total += size;
        breakdown[key] = this.formatBytes(size);
        
        try {
          const data = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(data)) {
            itemCount += data.length;
          } else if (typeof data === 'object') {
            itemCount += 1;
          }
        } catch {
          itemCount += 1;
        }
      }
    }

    const estimatedLimitBytes = 5 * 1024 * 1024; // 5MB
    const percentage = (total / estimatedLimitBytes) * 100;

    return {
      total,
      percentage,
      breakdown: Object.fromEntries(
        Object.entries(breakdown).sort(([,a], [,b]) => 
          parseInt(b.replace(/[^\d]/g, '')) - parseInt(a.replace(/[^\d]/g, ''))
        ).slice(0, 10)
      ),
      itemCount
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Backup and restore
  createAutoBackup(): void {
    const backupData = this.exportAllData();
    const backupKey = `auto_backup_${format(new Date(), 'yyyy-MM-dd')}`;
    
    try {
      localStorage.setItem(backupKey, backupData);
      
      // Keep only last 7 auto-backups
      const allKeys = Object.keys(localStorage);
      const autoBackupKeys = allKeys
        .filter(key => key.startsWith('auto_backup_'))
        .sort()
        .reverse();
      
      if (autoBackupKeys.length > 7) {
        autoBackupKeys.slice(7).forEach(key => {
          localStorage.removeItem(key);
        });
      }
    } catch (error) {
      console.warn('Auto-backup failed:', error);
    }
  }

  exportAllData(): string {
    const allData: Record<string, any> = {};
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !key.startsWith('auto_backup_')) {
        try {
          allData[key] = JSON.parse(localStorage.getItem(key) || '');
        } catch {
          allData[key] = localStorage.getItem(key);
        }
      }
    }
    
    return JSON.stringify({
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data: allData
    }, null, 2);
  }

  importAllData(jsonData: string): boolean {
    try {
      const imported = JSON.parse(jsonData);
      
      if (!imported.data) {
        throw new Error('Invalid backup format');
      }
      
      // Create backup before import
      this.createAutoBackup();
      
      // Import data
      Object.entries(imported.data).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value));
      });
      
      // Trigger update event
      window.dispatchEvent(new Event('dataUpdated'));
      
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  }

  // Data validation and recovery
  validateAndRepairData(): { repaired: string[]; errors: string[] } {
    const repaired: string[] = [];
    const errors: string[] = [];
    
    const keysToValidate = [
      'tasks', 'habits', 'habitsEnhanced', 'wellness', 
      'focusSessions', 'expenses', 'reading', 'notes'
    ];
    
    keysToValidate.forEach(key => {
      try {
        const data = this.getData(key, []);
        
        if (Array.isArray(data)) {
          // Remove duplicates based on ID
          const uniqueData = data.filter((item, index, self) => 
            index === self.findIndex(t => t.id === item.id)
          );
          
          // Add missing IDs
          const repairedData = uniqueData.map(item => ({
            ...item,
            id: item.id || Date.now().toString() + Math.random().toString(36).substr(2, 9)
          }));
          
          if (repairedData.length !== data.length) {
            this.setData(key, repairedData);
            repaired.push(`${key}: Removed ${data.length - repairedData.length} duplicates`);
          }
        }
      } catch (error) {
        errors.push(`${key}: ${error.message}`);
      }
    });
    
    return { repaired, errors };
  }

  // Smart insights generation
  generatePersonalInsights(): string[] {
    const insights: string[] = [];
    const analytics = this.getAnalytics('month');
    
    // Productivity insights
    if (analytics.tasks.completionRate > 80) {
      insights.push(`🎯 Outstanding task completion rate of ${analytics.tasks.completionRate.toFixed(0)}%! You're crushing your goals.`);
    } else if (analytics.tasks.completionRate < 50) {
      insights.push(`📈 Your task completion rate is ${analytics.tasks.completionRate.toFixed(0)}%. Consider breaking larger tasks into smaller, manageable pieces.`);
    }
    
    // Habit insights
    if (analytics.habits.avgCompletionRate > 75) {
      insights.push(`🔥 Excellent habit consistency! You're maintaining ${analytics.habits.avgCompletionRate.toFixed(0)}% completion rate.`);
    }
    
    // Wellness insights
    if (analytics.wellness.averageMood > 7) {
      insights.push(`😊 Your mood has been great this month! Average mood: ${analytics.wellness.averageMood.toFixed(1)}/10.`);
    }
    
    if (analytics.wellness.averageSleep < 7) {
      insights.push(`😴 Consider prioritizing sleep. You're averaging ${analytics.wellness.averageSleep.toFixed(1)} hours per night.`);
    }
    
    // Focus insights
    if (analytics.productivity.totalMinutes > 1000) {
      insights.push(`⏰ Impressive focus discipline! You've logged ${Math.round(analytics.productivity.totalMinutes / 60)} hours of focused work.`);
    }
    
    // Financial insights
    if (analytics.financial.totalIncome > analytics.financial.totalExpenses) {
      const savings = analytics.financial.totalIncome - analytics.financial.totalExpenses;
      insights.push(`💰 Great job saving! You saved ${savings.toFixed(2)} this period.`);
    }
    
    return insights;
  }

  // Cross-component correlations
  findDataCorrelations(): any[] {
    const correlations: any[] = [];
    const wellness = this.getData('wellness', []);
    const habits = this.getData('habitsEnhanced', []);
    const focus = this.getData('focusSessions', []);
    
    // Habit-mood correlation
    habits.forEach((habit: any) => {
      const moodData = wellness.map((w: any) => {
        const completion = habit.completions?.find((c: any) => c.date === w.date);
        return {
          completed: completion?.completed || false,
          mood: w.mood || 0
        };
      }).filter(d => d.mood > 0);
      
      if (moodData.length > 5) {
        const avgMoodWhenCompleted = moodData.filter(d => d.completed).reduce((sum, d) => sum + d.mood, 0) / 
          (moodData.filter(d => d.completed).length || 1);
        const avgMoodWhenNot = moodData.filter(d => !d.completed).reduce((sum, d) => sum + d.mood, 0) / 
          (moodData.filter(d => !d.completed).length || 1);
        
        const difference = avgMoodWhenCompleted - avgMoodWhenNot;
        if (difference > 0.5) {
          correlations.push({
            type: 'habit-mood',
            habit: habit.name,
            correlation: `+${difference.toFixed(1)} mood points when completed`,
            strength: difference > 1 ? 'strong' : 'moderate'
          });
        }
      }
    });
    
    return correlations;
  }
}

// Export singleton instance
export const dataManager = new DataManager();

// Convenience functions for backward compatibility
export const getAnalytics = (period: 'week' | 'month' | 'year' = 'month') => dataManager.getAnalytics(period);
export const exportAppData = () => dataManager.exportAllData();
export const importAppData = (data: string) => dataManager.importAllData(data);
export const getStorageInfo = () => dataManager.getStorageInfo();
