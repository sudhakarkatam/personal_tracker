import { useState, useEffect } from 'react';
import { Plus, ArrowLeft, Calendar, Clock, MapPin, Edit2, Trash2, Bell, Users, Repeat, Settings } from 'lucide-react';
import { Event, EventReminder, RecurrencePattern } from '@/types';
import { useLocalStorageWithDates } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { cn } from '@/lib/utils';
import { notificationManager } from '@/utils/notificationManager';

interface CalendarEventsProps {
  onBack: () => void;
}

interface EnhancedEvent extends Event {
  location?: string;
  attendees?: string[];
  recurring?: RecurrencePattern;
  reminders?: EventReminder[];
  isPrivate?: boolean;
  calendarId?: string;
  notes?: string;
  url?: string;
}

export function CalendarEvents({ onBack }: CalendarEventsProps) {
  const [events, setEvents] = useLocalStorageWithDates<EnhancedEvent[]>('enhancedEvents', [], ['date', 'createdAt']);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EnhancedEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  
  const [notificationPermissions, setNotificationPermissions] = useState({
    notifications: false,
    vibration: false,
    wakeLock: false
  });

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    endTime: '',
    type: 'personal' as Event['type'],
    color: '#8B5CF6',
    allDay: false,
    location: '',
    attendees: [] as string[],
    recurring: { type: 'daily', interval: 1 } as RecurrencePattern,
    reminders: [{ id: '1', time: 15, type: 'notification' as const }] as EventReminder[],
    isPrivate: false,
    calendarId: 'default',
    notes: '',
    url: ''
  });

  const [calendars] = useState([
    { id: 'default', name: 'Personal', color: '#8B5CF6' },
    { id: 'work', name: 'Work', color: '#EF4444' },
    { id: 'family', name: 'Family', color: '#10B981' },
    { id: 'health', name: 'Health', color: '#F59E0B' }
  ]);

  useEffect(() => {
    // Request mobile permissions on component mount
    const requestPermissions = async () => {
      const permissions = await notificationManager.requestMobilePermissions();
      setNotificationPermissions(permissions);
    };

    requestPermissions();
    
    // Check for due notifications
    notificationManager.checkDueNotifications();

    // Set up real-time notification scheduling for existing events
    events.forEach(event => {
      if (event.reminders) {
        event.reminders.forEach(reminder => {
          if (reminder.type === 'notification') {
            notificationManager.scheduleEventNotification(event, reminder.time);
          }
        });
      }
    });
  }, [events]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const generateRecurringEvents = (baseEvent: EnhancedEvent): EnhancedEvent[] => {
    if (!baseEvent.recurring || baseEvent.recurring.type === 'daily') {
      return [baseEvent];
    }

    const recurringEvents: EnhancedEvent[] = [baseEvent];
    const rule = baseEvent.recurring;
    let currentDate = new Date(baseEvent.date);
    let count = 1;

    while (count < (rule.count || 50)) {
      let nextDate: Date;
      
      switch (rule.type) {
        case 'daily':
          nextDate = addDays(currentDate, rule.interval);
          break;
        case 'weekly':
          nextDate = addWeeks(currentDate, rule.interval);
          break;
        case 'monthly':
          nextDate = addMonths(currentDate, rule.interval);
          break;
        case 'yearly':
          nextDate = addYears(currentDate, rule.interval);
          break;
        default:
          return recurringEvents;
      }

      if (rule.endDate && nextDate > rule.endDate) {
        break;
      }

      recurringEvents.push({
        ...baseEvent,
        id: `${baseEvent.id}-${count}`,
        date: nextDate
      });

      currentDate = nextDate;
      count++;
    }

    return recurringEvents;
  };

  const getAllEvents = () => {
    const allEvents: EnhancedEvent[] = [];
    
    events.forEach(event => {
      if (event.recurring && event.recurring.type !== 'daily') {
        allEvents.push(...generateRecurringEvents(event));
      } else {
        allEvents.push(event);
      }
    });

    return allEvents;
  };

  const addEvent = () => {
    if (!newEvent.title.trim() || !newEvent.date) return;

    const eventDate = new Date(newEvent.date);
    if (!newEvent.allDay && newEvent.time) {
      const [hours, minutes] = newEvent.time.split(':');
      eventDate.setHours(parseInt(hours), parseInt(minutes));
    }

    const event: EnhancedEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      description: newEvent.description,
      date: eventDate,
      type: newEvent.type,
      color: newEvent.color,
      allDay: newEvent.allDay,
      status: 'confirmed',
      category: 'general',
      createdAt: new Date(),
      location: newEvent.location,
      attendees: newEvent.attendees,
      recurring: newEvent.recurring,
      reminders: newEvent.reminders,
      isPrivate: newEvent.isPrivate,
      calendarId: newEvent.calendarId,
      notes: newEvent.notes,
      url: newEvent.url
    };

    setEvents(prev => [...prev, event]);

    // Schedule notifications for this event
    newEvent.reminders.forEach(reminder => {
      if (reminder.type === 'notification') {
        notificationManager.scheduleEventNotification(event, reminder.time);
      }
    });

    // Reset form
    setNewEvent({
      title: '',
      description: '',
      date: '',
      time: '',
      endTime: '',
      type: 'personal',
      color: '#8B5CF6',
      allDay: false,
      location: '',
      attendees: [],
      recurring: { type: 'daily', interval: 1 },
      reminders: [{ id: '1', time: 15, type: 'notification' }],
      isPrivate: false,
      calendarId: 'default',
      notes: '',
      url: ''
    });
    setIsAddingEvent(false);
  };

  const updateEvent = () => {
    if (!editingEvent) return;

    setEvents(prev =>
      prev.map(event =>
        event.id === editingEvent.id ? editingEvent : event
      )
    );

    // Update notifications
    if (editingEvent.reminders) {
      editingEvent.reminders.forEach(reminder => {
        if (reminder.type === 'notification') {
          notificationManager.cancelScheduledNotification(editingEvent.id);
          notificationManager.scheduleEventNotification(editingEvent, reminder.time);
        }
      });
    }

    setEditingEvent(null);
  };

  const confirmDeleteEvent = (eventId: string) => {
    setDeletingEventId(eventId);
    setShowDeleteConfirm(true);
  };

  const deleteEvent = () => {
    if (!deletingEventId) return;
    
    setEvents(prev => prev.filter(event => event.id !== deletingEventId));
    notificationManager.cancelScheduledNotification(deletingEventId);
    setShowDeleteConfirm(false);
    setDeletingEventId(null);
  };

  const clearAllEvents = () => {
    setEvents([]);
    // Cancel all notifications
    events.forEach(event => {
      notificationManager.cancelScheduledNotification(event.id);
    });
  };

  const getEventsForDate = (date: Date) => {
    return getAllEvents().filter(event => isSameDay(new Date(event.date), date));
  };

  const upcomingEvents = getAllEvents()
    .filter(event => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const addAttendee = (email: string) => {
    if (email && !newEvent.attendees.includes(email)) {
      setNewEvent(prev => ({
        ...prev,
        attendees: [...prev.attendees, email]
      }));
    }
  };

  const removeAttendee = (email: string) => {
    setNewEvent(prev => ({
      ...prev,
      attendees: prev.attendees.filter(a => a !== email)
    }));
  };

  const addReminder = () => {
    setNewEvent(prev => ({
      ...prev,
      reminders: [...prev.reminders, { id: Date.now().toString(), time: 15, type: 'notification' }]
    }));
  };

  const updateReminder = (index: number, reminder: EventReminder) => {
    setNewEvent(prev => ({
      ...prev,
      reminders: prev.reminders.map((r, i) => i === index ? reminder : r)
    }));
  };

  const removeReminder = (index: number) => {
    setNewEvent(prev => ({
      ...prev,
      reminders: prev.reminders.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={16} />
        </Button>
        <h2 className="text-2xl font-bold text-gray-800 flex-1">Enhanced Calendar & Events</h2>
        <div className="flex gap-2">
          <Button onClick={() => setShowSettings(true)} variant="outline" size="sm">
            <Settings size={16} />
          </Button>
          <Button onClick={() => setIsAddingEvent(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus size={16} className="mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      {/* Notification Status */}
      {!notificationPermissions.notifications && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Enable notifications to receive event reminders.
            </p>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => notificationManager.requestPermission()}
            >
              Enable
            </Button>
          </div>
        </div>
      )}

      {/* Data Management */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Data Management</h3>
          <div className="flex gap-2">
            <span className="text-sm text-gray-500">{events.length} events stored</span>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={clearAllEvents}
              disabled={events.length === 0}
            >
              Clear All Data
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-600">
          Data persists across months automatically. Your events from previous months remain accessible.
        </p>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(value: 'month' | 'week' | 'day') => setViewMode(value)}>
            <TabsList>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="day">Day</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentDate(prev => {
              switch (viewMode) {
                case 'month': return new Date(prev.getFullYear(), prev.getMonth() - 1);
                case 'week': return addDays(prev, -7);
                case 'day': return addDays(prev, -1);
                default: return prev;
              }
            })}
          >
            ←
          </Button>
          <h3 className="text-lg font-semibold min-w-[200px] text-center">
            {viewMode === 'month' && format(currentDate, 'MMMM yyyy')}
            {viewMode === 'week' && `Week of ${format(currentDate, 'MMM d, yyyy')}`}
            {viewMode === 'day' && format(currentDate, 'MMMM d, yyyy')}
          </h3>
          <Button
            variant="outline"
            onClick={() => setCurrentDate(prev => {
              switch (viewMode) {
                case 'month': return new Date(prev.getFullYear(), prev.getMonth() + 1);
                case 'week': return addDays(prev, 7);
                case 'day': return addDays(prev, 1);
                default: return prev;
              }
            })}
          >
            →
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {daysInMonth.map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            
            return (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  "aspect-square p-1 text-sm rounded-lg border border-transparent hover:bg-gray-50 transition-colors",
                  isToday(date) && "bg-purple-100 text-purple-700 font-semibold",
                  isSelected && "bg-purple-600 text-white",
                  dayEvents.length > 0 && !isSelected && "bg-blue-50"
                )}
              >
                <div>{format(date, 'd')}</div>
                {dayEvents.length > 0 && (
                  <div className="flex justify-center mt-1 gap-1">
                    {dayEvents.slice(0, 3).map((event, i) => (
                      <div 
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: isSelected ? 'white' : event.color }}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <div className={cn(
                        "text-xs",
                        isSelected ? "text-white" : "text-gray-500"
                      )}>
                        +{dayEvents.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-3">
            Events for {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          {getEventsForDate(selectedDate).length === 0 ? (
            <p className="text-gray-500 text-sm">No events scheduled</p>
          ) : (
            <div className="space-y-3">
              {getEventsForDate(selectedDate).map(event => (
                <div key={event.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-3 h-3 rounded-full mt-1" style={{ backgroundColor: event.color }} />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{event.title}</h4>
                    <div className="space-y-1 text-xs text-gray-500">
                      <p className="flex items-center gap-1">
                        <Clock size={12} />
                        {event.allDay ? 'All day' : format(new Date(event.date), 'HH:mm')}
                      </p>
                      {event.location && (
                        <p className="flex items-center gap-1">
                          <MapPin size={12} />
                          {event.location}
                        </p>
                      )}
                      {event.attendees && event.attendees.length > 0 && (
                        <p className="flex items-center gap-1">
                          <Users size={12} />
                          {event.attendees.length} attendee(s)
                        </p>
                      )}
                      {event.recurring && event.recurring.type !== 'daily' && (
                        <p className="flex items-center gap-1">
                          <Repeat size={12} />
                          Repeats {event.recurring.type}
                        </p>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-xs text-gray-600 mt-1">{event.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditingEvent(event)}>
                      <Edit2 size={12} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => confirmDeleteEvent(event.id)}>
                      <Trash2 size={12} className="text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upcoming Events */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-3">Upcoming Events</h3>
        {upcomingEvents.length === 0 ? (
          <p className="text-gray-500 text-sm">No upcoming events</p>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map(event => (
              <div key={event.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: event.color }} />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{event.title}</h4>
                  <p className="text-xs text-gray-500">
                    {format(new Date(event.date), 'MMM d')} - {event.allDay ? 'All day' : format(new Date(event.date), 'HH:mm')}
                    {event.location && ` • ${event.location}`}
                  </p>
                </div>
                {event.reminders && event.reminders.length > 0 && (
                  <Bell size={12} className="text-gray-400" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Event Dialog */}
      <Dialog open={isAddingEvent} onOpenChange={setIsAddingEvent}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="recurring">Recurring</TabsTrigger>
              <TabsTrigger value="reminders">Reminders</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Event title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Event description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                {!newEvent.allDay && (
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allDay"
                  checked={newEvent.allDay}
                  onCheckedChange={(checked) => setNewEvent(prev => ({ ...prev, allDay: !!checked }))}
                />
                <Label htmlFor="allDay">All day event</Label>
              </div>
              <div>
                <Label htmlFor="calendar">Calendar</Label>
                <Select value={newEvent.calendarId} onValueChange={(value) => setNewEvent(prev => ({ ...prev, calendarId: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {calendars.map(calendar => (
                      <SelectItem key={calendar.id} value={calendar.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: calendar.color }} />
                          {calendar.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Event location"
                />
              </div>
              <div>
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  value={newEvent.url}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newEvent.notes}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="private"
                  checked={newEvent.isPrivate}
                  onCheckedChange={(checked) => setNewEvent(prev => ({ ...prev, isPrivate: checked }))}
                />
                <Label htmlFor="private">Private event</Label>
              </div>
              <div>
                <Label>Attendees</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add attendee email"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          addAttendee(input.value);
                          input.value = '';
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                        addAttendee(input.value);
                        input.value = '';
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  {newEvent.attendees.map((attendee, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm">{attendee}</span>
                      <Button variant="ghost" size="sm" onClick={() => removeAttendee(attendee)}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="recurring" className="space-y-4">
              <div>
                <Label htmlFor="frequency">Repeat</Label>
                <Select 
                  value={newEvent.recurring.type} 
                  onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'yearly') => 
                    setNewEvent(prev => ({ ...prev, recurring: { ...prev.recurring, type: value } }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="interval">Repeat every</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="interval"
                    type="number"
                    min="1"
                    value={newEvent.recurring.interval}
                    onChange={(e) => setNewEvent(prev => ({ 
                      ...prev, 
                      recurring: { ...prev.recurring, interval: parseInt(e.target.value) || 1 } 
                    }))}
                    className="w-20"
                  />
                  <span className="text-sm text-gray-600">
                    {newEvent.recurring.type === 'daily' && 'day(s)'}
                    {newEvent.recurring.type === 'weekly' && 'week(s)'}
                    {newEvent.recurring.type === 'monthly' && 'month(s)'}
                    {newEvent.recurring.type === 'yearly' && 'year(s)'}
                  </span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reminders" className="space-y-4">
              <div className="space-y-3">
                {newEvent.reminders.map((reminder, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Input
                      type="number"
                      value={reminder.time}
                      onChange={(e) => updateReminder(index, { ...reminder, time: parseInt(e.target.value) || 0 })}
                      className="w-20"
                    />
                    <span className="text-sm text-gray-600">minutes before</span>
                    <Select
                      value={reminder.type}
                      onValueChange={(value: 'notification' | 'email' | 'sound') => updateReminder(index, { ...reminder, type: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="notification">Notification</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sound">Sound</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="sm" onClick={() => removeReminder(index)}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" onClick={addReminder} className="w-full">
                  <Plus size={16} className="mr-2" />
                  Add Reminder
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsAddingEvent(false)}>
              Cancel
            </Button>
            <Button onClick={addEvent}>Add Event</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calendar Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Notification Permissions</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Notifications</span>
                  <span className={notificationPermissions.notifications ? 'text-green-600' : 'text-red-600'}>
                    {notificationPermissions.notifications ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Vibration</span>
                  <span className={notificationPermissions.vibration ? 'text-green-600' : 'text-red-600'}>
                    {notificationPermissions.vibration ? 'Supported' : 'Not Supported'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Wake Lock</span>
                  <span className={notificationPermissions.wakeLock ? 'text-green-600' : 'text-red-600'}>
                    {notificationPermissions.wakeLock ? 'Supported' : 'Not Supported'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setShowSettings(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 mb-4">
            Are you sure you want to delete this event? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteEvent}>
              Delete Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent(prev => prev ? { ...prev, title: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingEvent.description || ''}
                  onChange={(e) => setEditingEvent(prev => prev ? { ...prev, description: e.target.value } : null)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingEvent(null)}>
                  Cancel
                </Button>
                <Button onClick={updateEvent}>Update Event</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
