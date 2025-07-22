import type React from "react";
import { useState, useRef, useEffect } from "react";
import ViewEventModal from "./ViewEventModal";

const MONTHS = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];
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

interface CalendarYearProps {
  currentDate: Date;
  onDateClick: (date: Date) => void;
  onMonthClick: (date: Date) => void;
  events: CalendarEvent[];
}

const CalendarYear: React.FC<CalendarYearProps> = ({
  currentDate,
  onDateClick,
  onMonthClick,
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
  const [popoverAnimation, setPopoverAnimation] = useState(false);
  const [popoverClosing, setPopoverClosing] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const year = currentDate.getFullYear();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    if (hoveredDay) {
      setPopoverAnimation(true);
      setPopoverClosing(false);
    }
  }, [hoveredDay]);

  useEffect(() => {
    const handleGlobalScroll = (e: Event) => {
      if (hoveredDay) {
        const target = e.target as HTMLElement;
        if (target && !popoverRef.current?.contains(target)) {
          setHoveredDay(null);
        }
      }
    };

    document.addEventListener("scroll", handleGlobalScroll, true);
    return () => {
      document.removeEventListener("scroll", handleGlobalScroll, true);
    };
  }, [hoveredDay]);

  const handleDayClick = (day: Date, e: React.MouseEvent) => {
    e.stopPropagation();

    // Se il giorno cliccato è lo stesso di quello già visualizzato, chiudi il popup (effetto toggle)
    if (hoveredDay && hoveredDay.toDateString() === day.toDateString()) {
      setPopoverClosing(true);
      setTimeout(() => {
        setHoveredDay(null);
      }, 200);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const shouldShowOnRight = rect.left < windowWidth / 2;
    const shouldShowAbove = rect.top > windowHeight / 2;

    setHoveredDay(day);
    setPopoverPosition({
      x: shouldShowOnRight ? rect.right : rect.left,
      y: shouldShowAbove ? rect.top : rect.bottom,
      isRight: shouldShowOnRight,
      isAbove: shouldShowAbove,
    });
  };

  const getEventsForDay = (date: Date) => {
    return events.filter((event) => {
      const startDate = new Date(event.EventStartDate);
      const endDate = new Date(event.EventEndDate);
      return (
        date >= new Date(startDate.setHours(0, 0, 0, 0)) &&
        date <= new Date(endDate.setHours(0, 0, 0, 0))
      );
    });
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
    <div className="h-full bg-background overflow-y-auto">
      <div
        className="flex-1 bg-default-50 dark:bg-default-100"
        style={{ minHeight: "100%" }}
        onClick={() => {
          if (hoveredDay) {
            closePopover();
          }
        }}
      >
        <div className="grid xl:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-6 p-6">
          {MONTHS.map((month, monthIndex) => (
            <div
              key={month}
              className="p-4 rounded-lg border border-default-200 dark:border-default-300 bg-background shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <h3
                className="text-lg font-medium text-center mb-4 px-4 py-2 rounded-full cursor-pointer w-fit mx-auto hover:bg-default-100 dark:hover:bg-default-200 transition-colors duration-200 text-foreground"
                onClick={() => onMonthClick(new Date(year, monthIndex, 1))}
              >
                {month}
              </h3>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {DAYS.map((day) => (
                  <div
                    key={day}
                    className="text-center font-medium text-default-600 dark:text-default-700 flex items-center justify-center h-8"
                  >
                    {day}
                  </div>
                ))}
                {Array(new Date(year, monthIndex, 1).getDay() || 7 - 1)
                  .fill(null)
                  .map((_, i) => (
                    <div key={`empty-${i}`} className="h-8"></div>
                  ))}
                {Array.from(
                  { length: new Date(year, monthIndex + 1, 0).getDate() },
                  (_, i) => i + 1
                ).map((day) => {
                  const currentDay = new Date(year, monthIndex, day);
                  const isToday =
                    currentDay.toDateString() === today.toDateString();
                  const dayEvents = getEventsForDay(currentDay);
                  const hasEvents = dayEvents.length > 0;

                  return (
                    <div
                      key={day}
                      className={`h-8 text-center rounded-full relative cursor-pointer transition-all duration-200 flex items-center justify-center text-sm font-medium
                        ${
                          isToday
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : hasEvents
                            ? "bg-primary/10 text-primary hover:bg-primary/20"
                            : "text-foreground hover:bg-default-100 dark:hover:bg-default-200"
                        }`}
                      onClick={(e) => {
                        if (dayEvents.length > 0) {
                          handleDayClick(currentDay, e);
                        } else {
                          onDateClick(currentDay);
                        }
                      }}
                    >
                      {day}
                      {hasEvents && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Popover eventi con tema responsive */}
        {hoveredDay && (
          <div
            ref={popoverRef}
            className={`fixed z-50 max-w-sm bg-background dark:bg-default-100 border border-default-200 dark:border-default-300 rounded-lg shadow-lg transition-all duration-200 ${
              popoverAnimation && !popoverClosing
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95"
            }`}
            style={{
              left: popoverPosition.isRight
                ? `${popoverPosition.x + 8}px`
                : "auto",
              right: !popoverPosition.isRight
                ? `calc(100% - ${popoverPosition.x - 8}px)`
                : "auto",
              top: popoverPosition.isAbove
                ? "auto"
                : `${popoverPosition.y + 8}px`,
              bottom: popoverPosition.isAbove
                ? `calc(100% - ${popoverPosition.y - 8}px)`
                : "auto",
            }}
            onClick={(e) => e.stopPropagation()}
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
                {getEventsForDay(hoveredDay).map((event) => (
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
      </div>

      {/* Modal evento */}
      <ViewEventModal
        isOpen={isOpen}
        eventId={selectedEventId}
        isClosed={() => setIsOpen(false)}
      />
    </div>
  );
};

export default CalendarYear;
