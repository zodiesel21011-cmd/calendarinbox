import React, { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Plus, Video, MapPin, Users, X } from 'lucide-react'
import { format } from 'date-fns'
import type { CalendarEvent } from '../types'
import { calendarService } from '../services/calendarService'

export const CalendarView: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    setLoading(true)
    const data = await calendarService.getEvents()
    setEvents(data)
    setLoading(false)
  }

  const handleEventClick = (info: any) => {
    const event = events.find(e => e.id === info.event.id)
    if (event) {
      setSelectedEvent(event)
      setShowModal(true)
    }
  }

  const calendarEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    backgroundColor: event.color,
    borderColor: event.color,
  }))

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Calendar</h2>
            <p className="text-blue-100 mt-1">Manage your schedule with AI</p>
          </div>
          <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-blue-50 transition-colors">
            <Plus className="w-5 h-5" />
            New Event
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading calendar...</p>
            </div>
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            events={calendarEvents}
            eventClick={handleEventClick}
            editable={true}
            selectable={true}
            height="auto"
          />
        )}
      </div>

      {/* Event Modal */}
      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Event Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedEvent.title}
                </h2>
                <p className="text-gray-600">{selectedEvent.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <p className="text-gray-900">{format(selectedEvent.start, 'PPpp')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <p className="text-gray-900">{format(selectedEvent.end, 'PPpp')}</p>
                </div>
              </div>

              {selectedEvent.location && (
                <div className="flex items-center gap-2 text-gray-700 bg-gray-50 p-3 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}

              {selectedEvent.isOnlineMeeting && (
                <div className="flex items-center gap-2 text-gray-700 bg-blue-50 p-3 rounded-lg">
                  <Video className="w-5 h-5 text-blue-600" />
                  <span>Microsoft Teams Meeting</span>
                  {selectedEvent.teamsLink && (
                    <a
                      href={selectedEvent.teamsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto text-blue-600 hover:underline text-sm font-medium"
                    >
                      Join Meeting
                    </a>
                  )}
                </div>
              )}

              {selectedEvent.attendees.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Attendees
                  </label>
                  <div className="space-y-2">
                    {selectedEvent.attendees.map((attendee, idx) => (
                      <div key={idx} className="bg-gray-50 px-4 py-2 rounded-lg text-gray-700">
                        {attendee}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-6 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
