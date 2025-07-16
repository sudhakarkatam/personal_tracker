
import { Calendar, Clock, Edit2, Trash2 } from 'lucide-react';
import { format, isToday, isAfter, startOfDay } from 'date-fns';
import { CalendarEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useEffect } from 'react';

export function UpcomingEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  
  // Load events from localStorage
  const loadEvents = () => {
    try {
      const storedEvents = localStorage.getItem('calendarEventsEnhanced');
      console.log('Loading events from localStorage:', storedEvents);
      if (storedEvents) {
        const parsedEvents = JSON.parse(storedEvents);
        console.log('Parsed events:', parsedEvents);
        setEvents(parsedEvents);
        return parsedEvents;
      }
      return [];
    } catch (error) {
      console.error('Error loading events:', error);
      return [];
    }
  };

  // Initial load and event listeners
  useEffect(() => {
    // Load initial data
    loadEvents();

    const handleDataUpdate = () => {
      console.log('Data update event received');
      loadEvents();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'calendarEventsEnhanced') {
        console.log('Storage change detected for calendarEventsEnhanced');
        loadEvents();
      }
    };

    // Listen for custom data update events
    window.addEventListener('dataUpdated', handleDataUpdate);
    // Listen for storage changes from other tabs
    window.addEventListener('storage', handleStorageChange);
    
    // Poll for changes every 2 seconds as fallback
    const pollInterval = setInterval(() => {
      const currentEvents = loadEvents();
      setEvents(currentEvents);
    }, 2000);

    return () => {
      window.removeEventListener('dataUpdated', handleDataUpdate);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, []);

  const upcomingEvents = events
    .filter((event: CalendarEvent) => {
      const eventDate = new Date(event.date);
      const today = startOfDay(new Date());
      
      // Include today's events and future events
      return isToday(eventDate) || isAfter(eventDate, today);
    })
    .sort((a: CalendarEvent, b: CalendarEvent) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  const deleteEvent = (eventId: string) => {
    const updatedEvents = events.filter(event => event.id !== eventId);
    setEvents(updatedEvents);
    localStorage.setItem('calendarEventsEnhanced', JSON.stringify(updatedEvents));
    // Trigger data update event
    window.dispatchEvent(new Event('dataUpdated'));
  };

  const updateEvent = () => {
    if (!editingEvent) return;
    const updatedEvents = events.map(event => 
      event.id === editingEvent.id ? editingEvent : event
    );
    setEvents(updatedEvents);
    localStorage.setItem('calendarEventsEnhanced', JSON.stringify(updatedEvents));
    setEditingEvent(null);
    // Trigger data update event
    window.dispatchEvent(new Event('dataUpdated'));
  };

  const clearAllEvents = () => {
    setEvents([]);
    localStorage.setItem('calendarEventsEnhanced', JSON.stringify([]));
    // Trigger data update event
    window.dispatchEvent(new Event('dataUpdated'));
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      work: '#EF4444',
      personal: '#8B5CF6',
      health: '#10B981',
      finance: '#F59E0B',
      travel: '#06B6D4',
      education: '#8B5CF6',
      social: '#EC4899',
      other: '#6B7280'
    };
    return colors[category] || '#8B5CF6';
  };

  console.log('UpcomingEvents render - events count:', events.length, 'upcoming:', upcomingEvents.length);
  console.log('Upcoming events data:', upcomingEvents);

  if (upcomingEvents.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Calendar size={18} className="text-blue-500" />
            Upcoming Events
          </h3>
          {events.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearAllEvents}>
              <Trash2 size={12} />
            </Button>
          )}
        </div>
        <p className="text-gray-500 text-sm">No upcoming events</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Calendar size={18} className="text-blue-500" />
            Upcoming Events
          </h3>
          <Button variant="outline" size="sm" onClick={clearAllEvents}>
            <Trash2 size={12} />
          </Button>
        </div>
        
        <div className="space-y-3">
          {upcomingEvents.map((event: CalendarEvent) => (
            <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: getCategoryColor(event.category) }}
              />
              <div className="flex-1">
                <h4 className="font-medium text-gray-800 text-sm">{event.title}</h4>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock size={12} />
                  {isToday(new Date(event.date)) 
                    ? `Today at ${event.startTime}`
                    : `${format(new Date(event.date), 'MMM d')} at ${event.startTime}`
                  }
                  {event.location && ` • ${event.location}`}
                </div>
                {event.description && (
                  <p className="text-xs text-gray-600 mt-1 truncate">{event.description}</p>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setEditingEvent(event)}>
                  <Edit2 size={12} />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteEvent(event.id)}>
                  <Trash2 size={12} className="text-red-500" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editTitle">Title</Label>
                <Input
                  id="editTitle"
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent(prev => prev ? { ...prev, title: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={editingEvent.description}
                  onChange={(e) => setEditingEvent(prev => prev ? { ...prev, description: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="editDate">Date</Label>
                <Input
                  id="editDate"
                  type="date"
                  value={format(new Date(editingEvent.date), 'yyyy-MM-dd')}
                  onChange={(e) => setEditingEvent(prev => prev ? { ...prev, date: new Date(e.target.value) } : null)}
                />
              </div>
              <div>
                <Label htmlFor="editStartTime">Start Time</Label>
                <Input
                  id="editStartTime"
                  type="time"
                  value={editingEvent.startTime}
                  onChange={(e) => setEditingEvent(prev => prev ? { ...prev, startTime: e.target.value } : null)}
                />
              </div>
              <div>
                <Label htmlFor="editLocation">Location</Label>
                <Input
                  id="editLocation"
                  value={editingEvent.location || ''}
                  onChange={(e) => setEditingEvent(prev => prev ? { ...prev, location: e.target.value } : null)}
                  placeholder="Event location"
                />
              </div>
              <div>
                <Label htmlFor="editCategory">Category</Label>
                <Select 
                  value={editingEvent.category} 
                  onValueChange={(value) => setEditingEvent(prev => prev ? { ...prev, category: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingEvent(null)}>Cancel</Button>
                <Button onClick={updateEvent}>Update Event</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
