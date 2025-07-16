
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Calendar, CalendarEvent } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, subDays, parse, isValid } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { cn } from "@/lib/utils";

interface LocalRecurrencePattern {
  frequency: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
  daysOfWeek?: number[];
}

export function CalendarEventsEnhanced() {
  const [events, setEvents] = useLocalStorage<CalendarEvent[]>('calendarEventsEnhanced', []);
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedEventDate, setSelectedEventDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: selectedDate,
    startTime: '09:00',
    endTime: '10:00',
    category: 'work',
    location: '',
    attendees: [] as string[],
    priority: 'medium' as CalendarEvent['priority'],
    reminders: [] as number[],
    recurrence: {
      type: 'none' as const,
      interval: 1
    } as CalendarEvent['recurrence']
  });

  const categories = ['work', 'personal', 'health', 'finance', 'travel', 'education', 'social', 'other'];
  const priorities = ['low', 'medium', 'high'] as const;

  const addEvent = () => {
    if (!newEvent.title.trim()) return;

    const event: CalendarEvent = {
      id: Date.now().toString(),
      title: newEvent.title,
      description: newEvent.description,
      date: selectedDate,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      category: newEvent.category,
      location: newEvent.location,
      attendees: newEvent.attendees,
      priority: newEvent.priority,
      reminders: newEvent.reminders,
      recurrence: convertToGlobalRecurrence({
        frequency: newEvent.recurrence?.type || 'none',
        interval: newEvent.recurrence?.interval || 1,
        endDate: newEvent.recurrence?.endDate,
        daysOfWeek: newEvent.recurrence?.daysOfWeek
      }),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setEvents(prev => [...prev, event]);
    resetForm();
    
    // Trigger data update event
    window.dispatchEvent(new Event('dataUpdated'));
  };

  const updateEvent = () => {
    if (!editingEvent) return;

    setEvents(prev =>
      prev.map(event =>
        event.id === editingEvent.id ? editingEvent : event
      )
    );
    setEditingEvent(null);
    
    // Trigger data update event
    window.dispatchEvent(new Event('dataUpdated'));
  };

  const confirmDeleteEvent = (eventId: string) => {
    setDeletingEventId(eventId);
    setShowDeleteConfirm(true);
  };

  const deleteEvent = () => {
    if (!deletingEventId) return;
    
    setEvents(prev => prev.filter(event => event.id !== deletingEventId));
    setShowDeleteConfirm(false);
    setDeletingEventId(null);
    
    // Trigger data update event
    window.dispatchEvent(new Event('dataUpdated'));
  };

  const resetForm = () => {
    setNewEvent({
      title: '',
      description: '',
      date: selectedDate,
      startTime: '09:00',
      endTime: '10:00',
      category: 'work',
      location: '',
      attendees: [],
      priority: 'medium',
      reminders: [],
      recurrence: {
        type: 'none',
        interval: 1
      }
    });
    setIsAddingEvent(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedEventDate(date);
    if (date) {
      setNewEvent(prev => ({ ...prev, date: date }));
    }
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    setNewEvent(prev => ({ ...prev, [field]: value }));
  };

  const handleRecurrenceChange = (field: keyof LocalRecurrencePattern, value: any) => {
    setNewEvent(prev => ({
      ...prev,
      recurrence: { ...prev.recurrence, [field]: value }
    }));
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getEventsForDay = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), date));
  };

  const prevMonth = () => {
    setCurrentMonth(subDays(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addDays(currentMonth, 1));
  };

  const convertToLocalRecurrence = (globalRecurrence?: CalendarEvent['recurrence']): LocalRecurrencePattern => {
    if (!globalRecurrence) {
      return { frequency: 'none', interval: 1 };
    }

    return {
      frequency: globalRecurrence.type === 'none' ? 'none' : globalRecurrence.type,
      interval: globalRecurrence.interval,
      endDate: globalRecurrence.endDate,
      daysOfWeek: globalRecurrence.daysOfWeek
    };
  };

  const convertToGlobalRecurrence = (localRecurrence: LocalRecurrencePattern): CalendarEvent['recurrence'] | undefined => {
    if (localRecurrence.frequency === 'none') {
      return undefined;
    }

    return {
      type: localRecurrence.frequency,
      interval: localRecurrence.interval,
      endDate: localRecurrence.endDate,
      daysOfWeek: localRecurrence.daysOfWeek
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Calendar Events</h2>
        <Button onClick={() => setIsAddingEvent(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus size={16} className="mr-2" />
          Add Event
        </Button>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <Button variant="ghost" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-lg font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <DayPicker
            mode="single"
            selected={selectedEventDate}
            onSelect={handleDateSelect}
            month={currentMonth}
            showOutsideDays
            className="border-collapse"
            modifiers={{
              selected: selectedEventDate,
              today: new Date(),
            }}
          />
        </CardContent>
      </Card>

      {/* Events List for Selected Date */}
      {selectedEventDate && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Events for {format(selectedEventDate, 'MMM d, yyyy')}
          </h3>
          {getEventsForDay(selectedEventDate).length === 0 ? (
            <div className="text-center py-6">
              <CalendarIcon size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">No events for this day.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {getEventsForDay(selectedEventDate).map(event => (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{event.title}</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingEvent(event)}>
                        <Edit2 size={12} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => confirmDeleteEvent(event.id)}>
                        <Trash2 size={12} className="text-red-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600">
                    {event.description && <p>{event.description}</p>}
                    <p>Time: {event.startTime} - {event.endTime}</p>
                    <p>Category: {event.category}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Event Dialog */}
      <Dialog open={isAddingEvent} onOpenChange={setIsAddingEvent}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Event Title</Label>
              <Input
                id="title"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Meeting with John"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newEvent.description}
                onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the event"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newEvent.startTime}
                  onChange={(e) => handleTimeChange('startTime', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newEvent.endTime}
                  onChange={(e) => handleTimeChange('endTime', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={newEvent.category} onValueChange={(value) => setNewEvent(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={newEvent.priority} onValueChange={(value: CalendarEvent['priority']) => setNewEvent(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map(priority => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={newEvent.location}
                onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Conference Room A"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={addEvent}>Add Event</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={() => setEditingEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Event Title</Label>
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
                  value={editingEvent.description}
                  onChange={(e) => setEditingEvent(prev => prev ? { ...prev, description: e.target.value } : null)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-startTime">Start Time</Label>
                  <Input
                    id="edit-startTime"
                    type="time"
                    value={editingEvent.startTime}
                    onChange={(e) => setEditingEvent(prev => prev ? { ...prev, startTime: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-endTime">End Time</Label>
                  <Input
                    id="edit-endTime"
                    type="time"
                    value={editingEvent.endTime}
                    onChange={(e) => setEditingEvent(prev => prev ? { ...prev, endTime: e.target.value } : null)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Select value={editingEvent.category} onValueChange={(value) => setEditingEvent(prev => prev ? { ...prev, category: value } : null)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-priority">Priority</Label>
                <Select 
                  value={editingEvent.priority} 
                  onValueChange={(value) => setEditingEvent(prev => prev ? { ...prev, priority: value as CalendarEvent['priority'] } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map(priority => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editingEvent.location}
                  onChange={(e) => setEditingEvent(prev => prev ? { ...prev, location: e.target.value } : null)}
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
    </div>
  );
}
