import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import ViewEventModal from "./ViewEventModal";

const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

interface EventPartecipant {
  EventPartecipantId: number;
  EventPartecipantEmail: string;
  EventPartecipantRole: string;
  EventPartecipantStatus: string;
}

interface EventAttachment {
  EventAttachmentId: number;
  EventAttachmentUrl: string;
  EventAttachmentName: string;
}

interface CalendarEvent {
  EventId: number;
  EventTitle: string;
  EventStartDate: Date;
  EventEndDate: Date;
  EventStartTime: string;
  EventEndTime: string;
  EventColor: string;
  EventDescription: string;
  EventLocation: string;
  EventTagName: string;
  EventAttachments: EventAttachment[];
  EventPartecipants: EventPartecipant[];
}

interface CalendarMonthProps {
  currentDate: Date;
  onDateClick: (date: Date) => void;
  events: CalendarEvent[];
}

const CalendarMonth: React.FC<CalendarMonthProps> = ({
  currentDate,
  onDateClick,
  events,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(0);
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);
  const [showEventSelector, setShowEventSelector] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);
  const [selectorPosition, setSelectorPosition] = useState({ x: 0, y: 0 });
  const [popoverPosition, setPopoverPosition] = useState({
    x: 0,
    y: 0,
    isRight: false,
    isAbove: false,
  });
  const popoverRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const firstDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const prevMonthDays = Array.from({ length: firstDayIndex }, (_, i) => {
    return new Date(year, month - 1, prevMonthLastDay - firstDayIndex + i + 1);
  });

  const totalDays = prevMonthDays.length + daysInMonth;
  const nextMonthDays = Array.from({ length: 42 - totalDays }, (_, i) => {
    return new Date(year, month + 1, i + 1);
  });

  const days = Array.from(
    { length: daysInMonth },
    (_, i) => new Date(year, month, i + 1)
  );

  const [popoverAnimation, setPopoverAnimation] = useState(false);
  const [popoverClosing, setPopoverClosing] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (hoveredDay) {
        setHoveredDay(null);
      }
    };

    const calendar = calendarRef.current;
    if (calendar) {
      calendar.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      if (calendar) {
        calendar.removeEventListener("scroll", handleScroll);
      }
    };
  }, [hoveredDay]);

  const handleDayClick = (day: Date, e: React.MouseEvent) => {
    const dayEvents = events.filter(
      (event) =>
        day >= new Date(event.EventStartDate) &&
        day <= new Date(event.EventEndDate)
    );

    if (dayEvents.length > 3) {
      // Show popover for more events
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const calendarRect = calendarRef.current?.getBoundingClientRect();
      
      if (calendarRect) {
        const relativeX = rect.left - calendarRect.left;
        const relativeY = rect.top - calendarRect.top;
        
        setPopoverPosition({
          x: relativeX + rect.width / 2,
          y: relativeY + rect.height,
          isRight: relativeX > calendarRect.width / 2,
          isAbove: relativeY > calendarRect.height / 2,
        });
      }
      
      setHoveredDay(day);
      setPopoverAnimation(true);
    } else {
      onDateClick(day);
    }
  };

  const closePopover = () => {
    setPopoverClosing(true);
    setTimeout(() => {
      setHoveredDay(null);
      setPopoverAnimation(false);
      setPopoverClosing(false);
    }, 200);
  };

  return (
    <div className="h-full bg-background" ref={calendarRef}>
      {/* Calendar Header with theme support */}
      <div className="bg-background border-b border-default-200 dark:border-default-300">
        <div className="grid grid-cols-7 border-b border-default-200 dark:border-default-300">
          {DAYS.map((day) => (
            <div
              key={day}
              className="px-3 py-4 text-center text-sm font-semibold text-foreground bg-default-50 dark:bg-default-100"
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid with responsive theme */}
      <div className="grid grid-cols-7 h-full">
        {/* Previous Month Days */}
        {prevMonthDays.map((day) => (
          <div
            key={day.toISOString()}
            data-cell
            className="relative hover:bg-default-100 dark:hover:bg-default-200 cursor-pointer bg-default-50 dark:bg-default-100 opacity-50 border-r border-b border-default-200 dark:border-default-300"
            style={{ height: "18vh" }}
            onClick={(e) => handleDayClick(day, e)}
          >
            <div className="absolute top-2 right-2">
              <time
                dateTime={day.toISOString()}
                className="flex h-6 w-6 items-center justify-center rounded-full text-sm text-default-400 dark:text-default-500"
              >
                {day.getDate()}
              </time>
            </div>
          </div>
        ))}

        {/* Current Month Days */}
        {days.map((day) => {
          const dayEvents = events.filter(
            (event) =>
              day >= new Date(event.EventStartDate) &&
              day <= new Date(event.EventEndDate)
          );

          const isToday = day.toDateString() === today.toDateString();
          const isPast = day < today;

          return (
            <div
              key={day.toISOString()}
              data-cell
              className={`relative cursor-pointer border-r border-b border-default-200 dark:border-default-300 transition-colors duration-200 ${
                isPast 
                  ? "bg-default-100 dark:bg-default-200 hover:bg-default-200 dark:hover:bg-default-300" 
                  : "bg-background hover:bg-default-50 dark:hover:bg-default-100"
              } ${
                hoveredDay?.toISOString() === day.toISOString() ? "z-10" : ""
              }`}
              style={{ height: "18vh" }}
              onClick={(e) => handleDayClick(day, e)}
            >
              <div className="absolute top-2 right-2">
                <time
                  dateTime={day.toISOString()}
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium ${
                    isToday
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : isPast
                      ? "text-default-400 dark:text-default-500"
                      : "text-foreground"
                  }`}
                >
                  {day.getDate()}
                </time>
              </div>

              {/* Vista eventi con scrollbar e raggruppamento per ora */}
              <div className="absolute top-9 left-1 right-1 bottom-1">
                {dayEvents.length > 0 && (
                  <div className="h-full overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-default-300 scrollbar-track-transparent hover:scrollbar-thumb-default-400">
                    <div className="space-y-1 pr-1">
                      {(() => {
                        // Raggruppa eventi per ora
                        const eventsByTime: { [timeKey: string]: any[] } = {};
                        
                        dayEvents.forEach((event) => {
                          const timeKey = `${event.EventStartTime}-${event.EventEndTime}`;
                          if (!eventsByTime[timeKey]) {
                            eventsByTime[timeKey] = [];
                          }
                          eventsByTime[timeKey].push(event);
                        });

                        // Renderizza eventi raggruppati
                        return Object.entries(eventsByTime).map(([timeKey, timeEvents]) => {
                          if (timeEvents.length === 1) {
                            // Evento singolo - renderizza normalmente
                            const event = timeEvents[0];
                            const technicianName = event.TechnicianAssignment?.technician_name || 
                                                 event.CustomerInfo?.customer_name ||
                                                 'Non assegnato';
                            
                            return (
                              <div
                                key={event.EventId}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsOpen(true);
                                  setSelectedEventId(event.EventId);
                                }}
                                className="px-1 py-1 rounded-md text-xs cursor-pointer transition-all hover:shadow-sm border border-opacity-40 hover:border-opacity-60"
                                style={{ 
                                  backgroundColor: event.EventColor + '10',
                                  borderColor: event.EventColor,
                                  borderLeftWidth: '3px',
                                  borderLeftColor: event.EventColor,
                                }}
                                title={`${event.EventTitle}\n${event.EventStartTime} - ${event.EventEndTime}\nTecnico: ${technicianName}\nLocation: ${event.EventLocation || 'N/A'}\n\nClick per dettagli completi`}
                              >
                                {/* Prima riga: Orario e Titolo */}
                                <div className="flex items-center gap-2 mb-0.5">
                                  <div className="text-[10px] font-bold text-default-700 min-w-[32px]">
                                    {event.EventStartTime}
                                  </div>
                                  <div className="truncate font-medium text-foreground text-[11px] flex-1">
                                    {event.EventTitle}
                                  </div>
                                  <div
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: event.EventColor }}
                                  />
                                </div>
                                
                                {/* Seconda riga: Tecnico/Cliente */}
                                <div className="flex items-center gap-2">
                                  <div className="w-8"></div> {/* Spazio per allineamento */}
                                  <div className="flex items-center gap-1 flex-1 min-w-0">
                                    <Icon icon="solar:user-bold" width={10} className="text-default-500 flex-shrink-0" />
                                    <div className="truncate text-[10px] text-default-600">
                                      {technicianName}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          } else {
                            // Eventi multipli alla stessa ora - renderizza come gruppo
                            return (
                              <div
                                key={timeKey}
                                className="px-1 py-1 rounded-md text-xs cursor-pointer transition-all hover:shadow-sm border border-default-200 bg-default-100 dark:bg-default-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Apri il selettore di eventi
                                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                  setSelectorPosition({
                                    x: rect.left + rect.width / 2,
                                    y: rect.top - 10
                                  });
                                  setSelectedEvents(timeEvents);
                                  setShowEventSelector(true);
                                }}
                                title={`${timeEvents.length} eventi alle ${timeEvents[0].EventStartTime}:\n${timeEvents.map(e => `• ${e.EventTitle} (${e.TechnicianAssignment?.technician_name || e.CustomerInfo?.customer_name || 'Non assegnato'})`).join('\n')}\n\nClicca per scegliere quale aprire`}
                              >
                                {/* Prima riga: Orario e indicatore gruppo */}
                                <div className="flex items-center gap-2 mb-0.5">
                                  <div className="text-[10px] font-bold text-default-700 min-w-[32px]">
                                    {timeEvents[0].EventStartTime}
                                  </div>
                                  <div className="flex -space-x-1">
                                    {timeEvents.slice(0, 4).map((event, idx) => (
                                      <div
                                        key={event.EventId}
                                        className="w-3 h-3 rounded-full border border-background shadow-sm"
                                        style={{ 
                                          backgroundColor: event.EventColor,
                                          zIndex: 4 - idx
                                        }}
                                      />
                                    ))}
                                  </div>
                                  <div className="truncate font-medium text-foreground text-[11px] flex-1">
                                    {timeEvents.length} eventi
                                  </div>
                                  <Icon icon="solar:alt-arrow-down-bold" width={12} className="text-default-500" />
                                </div>
                                
                                {/* Seconda riga: Anteprima titoli */}
                                <div className="flex items-center gap-2">
                                  <div className="w-8"></div> {/* Spazio per allineamento */}
                                  <div className="truncate text-[10px] text-default-600 flex-1">
                                    {timeEvents.map(e => e.EventTitle.substring(0, 12)).join(', ')}...
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        });
                      })()}
                      
                      {/* Spazio extra per evitare che l'ultimo evento sia troppo vicino al bordo */}
                      <div className="h-1"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Next Month Days */}
        {nextMonthDays.map((day) => (
          <div
            key={day.toISOString()}
            data-cell
            className="relative hover:bg-default-100 dark:hover:bg-default-200 cursor-pointer bg-default-50 dark:bg-default-100 opacity-50 border-r border-b border-default-200 dark:border-default-300"
            style={{ height: "18vh" }}
            onClick={(e) => handleDayClick(day, e)}
          >
            <div className="absolute top-2 right-2">
              <time
                dateTime={day.toISOString()}
                className="flex h-6 w-6 items-center justify-center rounded-full text-sm text-default-400 dark:text-default-500"
              >
                {day.getDate()}
              </time>
            </div>
          </div>
        ))}
      </div>

      {/* Events Popover with theme support */}
      {hoveredDay && (
        <div
          ref={popoverRef}
          className={`absolute z-50 max-w-sm bg-background dark:bg-default-100 border border-default-200 dark:border-default-300 rounded-lg shadow-lg transition-all duration-200 ${
            popoverAnimation && !popoverClosing
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95"
          }`}
          style={{
            left: popoverPosition.isRight
              ? popoverPosition.x - 320
              : popoverPosition.x,
            top: popoverPosition.isAbove
              ? popoverPosition.y - 200
              : popoverPosition.y + 10,
          }}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">
                {hoveredDay.toLocaleDateString('it-IT', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </h3>
              <button
                onClick={closePopover}
                className="text-default-500 hover:text-foreground transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {events
                .filter(
                  (event) =>
                    hoveredDay >= new Date(event.EventStartDate) &&
                    hoveredDay <= new Date(event.EventEndDate)
                )
                .map((event) => (
                  <div
                    key={event.EventId}
                    onClick={() => {
                      setIsOpen(true);
                      setSelectedEventId(event.EventId);
                      closePopover();
                    }}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-default-100 dark:hover:bg-default-200 cursor-pointer transition-colors"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: event.EventColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">
                        {event.EventTitle}
                      </div>
                      <div className="text-xs text-default-600">
                        {event.EventStartTime} - {event.EventEndTime}
                      </div>
                      {event.EventLocation && (
                        <div className="text-xs text-default-500 truncate">
                          📍 {event.EventLocation}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Selettore eventi sovrapposti */}
      {showEventSelector && (
        <>
          {/* Overlay per chiudere il selettore */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowEventSelector(false)}
          />
          
          {/* Menu selettore */}
          <div
            className="fixed z-50 bg-background border border-default-200 rounded-lg shadow-lg min-w-72 max-w-80"
            style={{
              left: selectorPosition.x - 160, // Centra il menu
              top: selectorPosition.y,
              transform: 'translateY(-100%)'
            }}
          >
            <div className="p-3">
              <div className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                <Icon icon="solar:calendar-bold" width={16} />
                Scegli evento da aprire
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedEvents.map((event) => (
                  <div
                    key={event.EventId}
                    onClick={() => {
                      setSelectedEventId(event.EventId);
                      setIsOpen(true);
                      setShowEventSelector(false);
                    }}
                    className="flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all duration-200 hover:bg-default-100 dark:hover:bg-default-200 border border-transparent hover:border-default-300"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: event.EventColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground text-sm truncate">
                        {event.EventTitle}
                      </div>
                      <div className="text-xs text-default-600 flex items-center gap-2">
                        <span>{event.EventStartTime} - {event.EventEndTime}</span>
                        {event.EventLocation && (
                          <>
                            <span>•</span>
                            <span className="truncate">{event.EventLocation}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Icon icon="solar:arrow-right-bold" width={16} className="text-default-400" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Event Modal */}
      <ViewEventModal
        isOpen={isOpen}
        eventId={selectedEventId}
        isClosed={() => setIsOpen(false)}
      />
    </div>
  );
};

export default CalendarMonth;
