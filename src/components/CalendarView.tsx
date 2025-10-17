import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from 'date-fns';
import * as api from '../services/api';
import EventModal from './EventModal';

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const response = await api.getEvents(start.toISOString(), end.toISOString());
      setEvents(response.events || []);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.start_time);
      return isSameDay(eventStart, day);
    });
  };

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
    setShowEventModal(true);
    setSelectedEvent(null);
  };

  const handleEventClick = (event: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleSaveEvent = async (eventData: any) => {
    try {
      if (selectedEvent) {
        await api.updateEvent(selectedEvent.id, eventData);
      } else {
        await api.createEvent(eventData);
      }
      await loadEvents();
      setShowEventModal(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      await api.deleteEvent(eventId);
      await loadEvents();
      setShowEventModal(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  return (
    <div className="flex h-full" data-testid="calendar-view">
      {/* Main Calendar */}
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl shadow-sm h-full flex flex-col">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {events.length} events this month
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Today
              </button>

              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  className="p-2 hover:bg-white rounded-md transition"
                  data-testid="prev-month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  className="p-2 hover:bg-white rounded-md transition"
                  data-testid="next-month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => {
                  setSelectedDate(new Date());
                  setShowEventModal(true);
                  setSelectedEvent(null);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                data-testid="new-event-button"
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium">New Event</span>
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 p-6">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="calendar-grid">
              {calendarDays.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isCurrentDay = isToday(day);

                return (
                  <div
                    key={index}
                    className={`calendar-cell p-2 cursor-pointer hover:bg-blue-50 transition ${
                      !isCurrentMonth ? 'opacity-40' : ''
                    }`}
                    onClick={() => handleDateClick(day)}
                    data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isCurrentDay 
                        ? 'w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center' 
                        : 'text-gray-900'
                    }`}>
                      {format(day, 'd')}
                    </div>

                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event: any) => (
                        <div
                          key={event.id}
                          onClick={(e) => handleEventClick(event, e)}
                          className="text-xs p-1.5 rounded truncate hover:shadow-sm transition"
                          style={{ backgroundColor: event.color + '20', color: event.color }}
                          data-testid={`event-${event.id}`}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          {event.start_time && (
                            <div className="text-[10px] opacity-75">
                              {format(new Date(event.start_time), 'h:mm a')}
                            </div>
                          )}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-gray-500 pl-1.5">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Today's Events Sidebar */}
      <div className="w-80 p-6 bg-gray-50">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h3>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {getEventsForDay(new Date()).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No events today</p>
                </div>
              ) : (
                getEventsForDay(new Date()).map((event: any) => (
                  <div
                    key={event.id}
                    onClick={(e) => handleEventClick(event, e)}
                    className="p-4 rounded-lg border-l-4 hover:shadow-sm transition cursor-pointer bg-gray-50"
                    style={{ borderLeftColor: event.color }}
                  >
                    <h4 className="font-semibold text-gray-900 mb-2">{event.title}</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}
                        </span>
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.is_ai_generated && (
                        <div className="flex items-center gap-1 text-purple-600 mt-2">
                          <span className="text-xs bg-purple-50 px-2 py-1 rounded">AI Suggested</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {showEventModal && (
        <EventModal
          event={selectedEvent}
          date={selectedDate}
          onClose={() => {
            setShowEventModal(false);
            setSelectedEvent(null);
          }}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  );
}
