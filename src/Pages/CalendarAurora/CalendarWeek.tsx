import React, { useState, useEffect, useRef } from "react";
import ViewEventModal from "./ViewEventModal";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const ROW_HEIGHT = 60;
const HEADER_HEIGHT = 78;

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

interface CalendarWeekProps {
  currentDate: Date;
  onDateClick: (date: Date) => void;
  redLineBehavior: string;
  events: CalendarEvent[];
}

const isPastDate = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

const stripHtml = (html: string) => {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

const CalendarWeek: React.FC<CalendarWeekProps> = ({
  currentDate,
  onDateClick,
  redLineBehavior,
  events,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(0);
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - ((currentDate.getDay() + 6) % 7));

  const [now, setNow] = useState(new Date());
  const currentTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Europe/Rome" })
  );
  const [currentHour, setCurrentHour] = useState(
    currentTime.getHours() + currentTime.getMinutes() / 60
  );
  const [currentDayIndex, setCurrentDayIndex] = useState(
    (new Date(
      new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Rome" }).format(now)
    ).getDay() +
      6) %
      7
  );

  const isCurrentWeek =
    startOfWeek.getTime() <= now.getTime() &&
    now.getTime() < startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000;

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const newNow = new Date();
      setNow(newNow);
      const newCurrentTime = new Date(
        newNow.toLocaleString("en-US", { timeZone: "Europe/Rome" })
      );
      setCurrentHour(
        newCurrentTime.getHours() + newCurrentTime.getMinutes() / 60
      );
      setCurrentDayIndex(
        (new Date(
          new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Rome" }).format(
            newNow
          )
        ).getDay() +
          6) %
          7
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isCurrentWeek && scrollRef.current) {
      const scrollPosition =
        currentHour * ROW_HEIGHT - window.innerHeight / 2 + HEADER_HEIGHT;
      scrollRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, [isCurrentWeek]);

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header settimana con tema responsive */}
      <div className="flex-none bg-background dark:bg-default-50 sticky top-0 z-20 border-b border-default-200 dark:border-default-300">
        <div className="grid grid-cols-8 text-sm leading-6 text-default-600 dark:text-default-700">
          <div className="py-3"></div>
          {DAYS.map((day, i) => {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            const isToday = date.toDateString() === now.toDateString();
            const isPast = isPastDate(date);
            
            return (
              <div
                key={day}
                className="py-3 text-center font-medium cursor-pointer hover:bg-default-100 dark:hover:bg-default-200 rounded-lg transition-colors"
                onClick={() => onDateClick(date)}
              >
                <span className="block text-lg text-foreground">{day}</span>
                <span
                  className={`block text-base font-semibold ${
                    isToday
                      ? "text-primary"
                      : isPast
                      ? "text-default-400 dark:text-default-500"
                      : "text-foreground"
                  }`}
                >
                  {date.getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sezione "Tutto il giorno" con tema responsive */}
      <div className="flex-none flex border-b border-default-200 dark:border-default-300">
        <div className="w-[12.5%] bg-background dark:bg-default-50 text-center py-3 text-sm leading-5 text-default-600 dark:text-default-700 sticky left-0 border-r border-default-200 dark:border-default-300">
          Tutto il giorno
        </div>
        <div className="flex flex-1">
          {Array.from({ length: 7 }).map((_, dayIndex) => {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + dayIndex);

            const allDayEvents = events.filter((event) => {
              const eventStartHour = parseInt(
                event.EventStartTime.split(":")[0]
              );
              return (
                eventStartHour === 0 &&
                event.EventEndTime === "00:00" &&
                dayDate.toDateString() ===
                  new Date(event.EventStartDate).toDateString()
              );
            });

            return (
              <div
                key={dayIndex}
                className="flex-1 border-r border-default-200 dark:border-default-300 last:border-r-0"
                style={{
                  minHeight: "3rem",
                  height:
                    allDayEvents.length > 0
                      ? `${allDayEvents.length * 2.5}rem`
                      : "3rem",
                  padding: allDayEvents.length > 0 ? "0.5rem 0" : "0",
                }}
              >
                {allDayEvents.map((event) => (
                  <div
                    key={event.EventId}
                    onClick={() => {
                      setIsOpen(true);
                      setSelectedEventId(event.EventId);
                    }}
                    className="mx-1 rounded-lg p-2 text-xs font-medium hover:shadow-sm transition-all cursor-pointer mb-1 last:mb-0 border border-opacity-30"
                    style={{
                      backgroundColor: event.EventColor + '15',
                      borderColor: event.EventColor,
                      color: 'currentColor'
                    }}
                  >
                    <div className="truncate text-foreground">
                      {event.EventTitle}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Griglia oraria con tema responsive e scroll */}
      <div className="flex-1 overflow-y-auto bg-background" ref={scrollRef}>
        <div className="grid grid-cols-8 divide-x divide-default-200 dark:divide-default-300 relative min-h-full">
          {/* Colonna delle ore */}
          <div className="col-span-1 divide-y divide-default-200 dark:divide-default-300">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="sticky left-0 bg-background dark:bg-default-50 text-center pr-4 py-3 text-sm leading-5 text-default-600 dark:text-default-700 border-r border-default-200 dark:border-default-300"
                style={{ height: `${ROW_HEIGHT}px` }}
              >
                {hour === 0
                  ? "00:00"
                  : `${hour.toString().padStart(2, "0")}:00`}
              </div>
            ))}
          </div>

          {/* Colonne dei giorni */}
          {Array.from({ length: 7 }).map((_, dayIndex) => {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + dayIndex);
            const isPastDay = isPastDate(dayDate);

            return (
              <div
                key={dayIndex}
                className="col-span-1 divide-y divide-default-200 dark:divide-default-300"
              >
                {HOURS.map((hour) => (
                  <div
                    key={`${dayIndex}-${hour}`}
                    className={`group hover:bg-default-100 dark:hover:bg-default-200 relative transition-colors cursor-pointer ${
                      isPastDay ? "bg-default-50 dark:bg-default-100" : ""
                    }`}
                    style={{ height: `${ROW_HEIGHT}px` }}
                    onClick={() => {
                      const dayDate = new Date(startOfWeek);
                      dayDate.setDate(startOfWeek.getDate() + dayIndex);
                      onDateClick(dayDate);
                    }}
                  >
                    {/* Eventi nelle celle orarie */}
                    {(() => {
                      const eventsAtThisHour = events.filter((event) => {
                        const eventStartDate = new Date(event.EventStartDate);
                        const eventEndDate = new Date(event.EventEndDate);
                        const eventStartHour = parseInt(
                          event.EventStartTime.split(":")[0]
                        );

                        if (
                          eventStartHour === 0 &&
                          event.EventEndTime === "00:00"
                        ) {
                          return false;
                        }

                        const isMiddleDay =
                          dayDate.toDateString() !==
                            eventStartDate.toDateString() &&
                          dayDate.toDateString() !==
                            eventEndDate.toDateString() &&
                          dayDate >= eventStartDate &&
                          dayDate <= eventEndDate;

                        if (isMiddleDay) {
                          return hour === 0;
                        }

                        if (
                          dayDate.toDateString() ===
                          eventStartDate.toDateString()
                        ) {
                          return Math.floor(eventStartHour) === hour;
                        }

                        if (
                          dayDate.toDateString() ===
                          eventEndDate.toDateString()
                        ) {
                          return hour === 0;
                        }

                        return false;
                      });

                      const width =
                        eventsAtThisHour.length > 1
                          ? 100 / eventsAtThisHour.length
                          : 100;

                      return eventsAtThisHour.map((event, index) => {
                        const eventStartDate = new Date(event.EventStartDate);
                        const eventEndDate = new Date(event.EventEndDate);
                        const eventStartHour = parseInt(
                          event.EventStartTime.split(":")[0]
                        );
                        const eventEndHour = parseInt(
                          event.EventEndTime.split(":")[0]
                        );
                        const eventStartMinutes = parseInt(
                          event.EventStartTime.split(":")[1]
                        );
                        const eventEndMinutes = parseInt(
                          event.EventEndTime.split(":")[1]
                        );

                        let duration = 0;
                        let topOffset = 0;

                        if (
                          dayDate.toDateString() ===
                          eventStartDate.toDateString()
                        ) {
                          if (
                            eventStartDate.toDateString() ===
                            eventEndDate.toDateString()
                          ) {
                            duration =
                              eventEndHour +
                              eventEndMinutes / 60 -
                              (eventStartHour + eventStartMinutes / 60);
                            topOffset = (eventStartMinutes / 60) * ROW_HEIGHT;
                          } else {
                            duration =
                              24 - (eventStartHour + eventStartMinutes / 60);
                            topOffset = (eventStartMinutes / 60) * ROW_HEIGHT;
                          }
                        } else if (
                          dayDate.toDateString() ===
                          eventEndDate.toDateString()
                        ) {
                          duration = eventEndHour + eventEndMinutes / 60;
                          topOffset = 0;
                        } else {
                          duration = 24;
                          topOffset = 0;
                        }

                        return (
                          <div
                            onClick={() => {
                              setIsOpen(true);
                              setSelectedEventId(event.EventId);
                            }}
                            key={event.EventId}
                            className="absolute mx-0.5 rounded-lg p-2 text-sm cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 border border-opacity-30"
                            style={{
                              backgroundColor: event.EventColor + '15',
                              borderColor: event.EventColor,
                              zIndex: 10,
                              height: `${duration * ROW_HEIGHT}px`,
                              top: `${topOffset}px`,
                              width: `${width}%`,
                              left: index * (width + 1) + "%",
                            }}
                          >
                            <div className="h-full flex flex-col">
                              <div
                                className={`flex flex-col ${
                                  duration <= 1.5 ? "h-full justify-center" : ""
                                }`}
                              >
                                <div className="font-semibold text-foreground truncate text-xs">
                                  {event.EventTitle}
                                </div>
                                {duration > 1 && (
                                  <div className="text-xs text-default-600 opacity-90">
                                    {event.EventStartTime} - {event.EventEndTime}
                                  </div>
                                )}
                                {duration > 2 && event.EventLocation && (
                                  <div className="text-xs text-default-500 truncate mt-1">
                                    📍 {event.EventLocation}
                                  </div>
                                )}
                                {duration > 3 && event.EventDescription && (
                                  <div className="text-xs text-default-600 mt-1 line-clamp-2">
                                    {stripHtml(event.EventDescription)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Linea rossa per l'ora corrente */}
        {isCurrentWeek && redLineBehavior === "show" && (
          <div
            className="absolute z-30 pointer-events-none"
            style={{
              top: `${currentHour * ROW_HEIGHT}px`,
              left: `${12.5 + currentDayIndex * 12.5}%`,
              width: "12.5%",
              height: "2px",
              backgroundColor: "#ef4444",
              boxShadow: "0 0 6px rgba(239, 68, 68, 0.6)",
            }}
          >
            <div
              className="absolute left-0 top-0"
              style={{
                width: "8px",
                height: "8px",
                backgroundColor: "#ef4444",
                borderRadius: "50%",
                transform: "translate(-50%, -25%)",
                boxShadow: "0 0 4px rgba(239, 68, 68, 0.8)",
              }}
            />
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

export default CalendarWeek;
