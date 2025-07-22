import React, { useState, useRef, useEffect } from "react";
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

              {/* Events with improved theme support */}
              <div className="absolute top-10 left-1 right-1 flex flex-col gap-1.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(true);
                      setSelectedEventId(event.EventId);
                    }}
                    key={event.EventId}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-md border border-opacity-30"
                    style={{ 
                      backgroundColor: event.EventColor + '15', // 15% opacity background for better theme compatibility
                      borderColor: event.EventColor,
                      color: 'currentColor' // Use current text color for theme compatibility
                    }}
                    title={`${event.EventTitle}\n${event.EventDescription}\nDove: ${event.EventLocation}\nOrario: ${event.EventStartTime} - ${event.EventEndTime}`}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: event.EventColor }}
                    />
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="truncate font-semibold text-foreground">{event.EventTitle}</div>
                      {event.EventStartTime === "00:00" && event.EventEndTime === "00:00" ? (
                        <div className="text-[10px] opacity-75 font-medium text-default-600">
                          Tutto il giorno
                        </div>
                      ) : (
                        <div className="text-[10px] opacity-75 font-medium text-default-600">
                          {event.EventStartTime} - {event.EventEndTime}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* More events indicator with theme support */}
                {dayEvents.length > 3 && (
                  <div className="mt-0.5 flex items-center justify-center">
                    <div
                      onClick={(e) => handleDayClick(day, e)}
                      className="px-2 py-0.5 bg-default-100 dark:bg-default-200 hover:bg-default-200 dark:hover:bg-default-300 rounded-full text-[10px] text-default-600 dark:text-default-700 transition-colors flex items-center gap-1 group hover:shadow-sm cursor-pointer"
                    >
                      <svg
                        className="w-3 h-3 transition-transform group-hover:-translate-y-0.5 group-hover:text-primary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                      <span className="group-hover:text-primary font-medium">
                        +{dayEvents.length - 3}
                      </span>
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
