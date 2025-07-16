
interface ScheduledNotification {
  id: string;
  title: string;
  message: string;
  scheduledTime: number;
  eventId: string;
}

class NotificationManager {
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  async requestMobilePermissions(): Promise<{
    notifications: boolean;
    vibration: boolean;
    wakeLock: boolean;
  }> {
    const notifications = await this.requestPermission();
    const vibration = 'vibrate' in navigator;
    const wakeLock = 'wakeLock' in navigator;

    return {
      notifications,
      vibration,
      wakeLock
    };
  }

  scheduleEventNotification(event: any, minutesBefore: number): void {
    const eventTime = new Date(event.date).getTime();
    const notificationTime = eventTime - (minutesBefore * 60 * 1000);
    
    if (notificationTime <= Date.now()) {
      return; // Don't schedule past notifications
    }

    const notification: ScheduledNotification = {
      id: `${event.id}-${minutesBefore}`,
      title: `Upcoming: ${event.title}`,
      message: `In ${minutesBefore} minutes`,
      scheduledTime: notificationTime,
      eventId: event.id
    };

    this.scheduledNotifications.set(notification.id, notification);
    
    // Start checking if not already running
    if (!this.checkInterval) {
      this.startChecking();
    }
  }

  cancelScheduledNotification(eventId: string): void {
    // Remove all notifications for this event
    for (const [id, notification] of this.scheduledNotifications.entries()) {
      if (notification.eventId === eventId) {
        this.scheduledNotifications.delete(id);
      }
    }

    // Stop checking if no notifications left
    if (this.scheduledNotifications.size === 0 && this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  checkDueNotifications(): void {
    const now = Date.now();
    const dueNotifications: ScheduledNotification[] = [];

    for (const [id, notification] of this.scheduledNotifications.entries()) {
      if (notification.scheduledTime <= now) {
        dueNotifications.push(notification);
        this.scheduledNotifications.delete(id);
      }
    }

    // Show due notifications
    dueNotifications.forEach(notification => {
      this.showNotification(notification.title, notification.message);
    });

    // Stop checking if no notifications left
    if (this.scheduledNotifications.size === 0 && this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  private startChecking(): void {
    this.checkInterval = setInterval(() => {
      this.checkDueNotifications();
    }, 60000); // Check every minute
  }

  private showNotification(title: string, message: string): void {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });

      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Vibrate on mobile if supported
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }
  }

  getScheduledCount(): number {
    return this.scheduledNotifications.size;
  }

  clearAll(): void {
    this.scheduledNotifications.clear();
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

export const notificationManager = new NotificationManager();
