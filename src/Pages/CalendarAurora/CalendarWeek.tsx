import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
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
  // CosmicHub specific fields
  EventType?: string;
  EventPriority?: string;
  EstimatedDuration?: number;
  CustomerInfo?: {
    customer_id: string;
    customer_name: string;
    customer_phone: string;
    customer_email: string;
    customer_address: string;
    customer_type: string;
  };
  TechnicianAssignment?: {
    technician_id: string;
    technician_name: string;
    role: string;
    availability_status: string;
  };
  InterventionNotes?: string;
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

const CalendarWeek: React.FC<CalendarWeekProps> = ({
  currentDate,
  onDateClick,
  redLineBehavior,
  events,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [groupDropdown, setGroupDropdown] = useState<{
    isOpen: boolean;
    events: any[];
    position: { x: number; y: number };
  }>({ isOpen: false, events: [], position: { x: 0, y: 0 } });
  const [hoveredEvent, setHoveredEvent] = useState<any>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hoverRef = useRef<HTMLDivElement>(null);
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - ((currentDate.getDay() + 6) % 7));

  const [now, setNow] = useState(new Date());
  const currentTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Europe/Rome" })
  );
  const [currentHour, setCurrentHour] = useState(
    currentTime.getHours() + currentTime.getMinutes() / 60
  );
  const [, setCurrentDayIndex] = useState(
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

  // Gestisce click fuori dal dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setGroupDropdown({
          isOpen: false,
          events: [],
          position: { x: 0, y: 0 },
        });
      }
    };

    if (groupDropdown.isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [groupDropdown.isOpen]);

  // Funzione per aprire il dropdown di selezione eventi
  const openEventDropdown = (events: any[], e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setGroupDropdown({
      isOpen: true,
      events,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8,
      },
    });
  };

  // Funzione per calcolare la posizione ottimale del popup di hover
  const calculateOptimalHoverPosition = (rect: DOMRect) => {
    const popupWidth = 320; // Larghezza stimata del popup
    const popupHeight = 200; // Altezza stimata del popup
    const margin = 16; // Margine di sicurezza
    const eventGap = 8; // Distanza dall'evento
    const minLeftDistance = 8; // Distanza minima dal bordo sinistro
    const minRightDistance = 8; // Distanza minima dal bordo destro

    let x = rect.right + eventGap; // Posizione predefinita a destra
    let y = rect.top;

    // Calcola lo spazio disponibile a destra e a sinistra
    const spaceRight = window.innerWidth - rect.right - margin;
    const spaceLeft = rect.left - margin;

    // Se c'è spazio sufficiente a destra, posiziona lì
    if (spaceRight >= popupWidth) {
      x = rect.right + eventGap;
    }
    // Altrimenti, se c'è più spazio a sinistra, posiziona lì
    else if (spaceLeft >= popupWidth) {
      x = rect.left - popupWidth - eventGap;
    }
    // Se non c'è spazio sufficiente da nessuna parte, trova la posizione migliore
    else {
      // Calcola quale lato ha più spazio
      if (spaceRight > spaceLeft) {
        // Più spazio a destra, posiziona il più possibile a destra
        x = window.innerWidth - popupWidth - minRightDistance;
      } else {
        // Più spazio a sinistra, posiziona il più possibile a sinistra
        x = minLeftDistance;
      }
    }

    // Assicurati che il popup non vada mai fuori dai bordi
    x = Math.max(minLeftDistance, Math.min(x, window.innerWidth - popupWidth - minRightDistance));

    // Controlla se il popup va fuori in basso
    if (y + popupHeight + margin > window.innerHeight) {
      y = Math.max(margin, window.innerHeight - popupHeight - margin);
    }

    // Controlla se il popup va fuori in alto
    if (y < margin) {
      y = margin;
    }

    return { x, y };
  };

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header dei giorni della settimana */}
      <div className="flex-none bg-background border-b border-default-200 dark:border-default-300">
        <div className="flex">
          <div className="w-16 bg-background border-r border-default-200 dark:border-default-300"></div>
          {Array.from({ length: 7 }).map((_, dayIndex) => {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + dayIndex);
            const isToday = dayDate.toDateString() === now.toDateString();
            const isPastDay = isPastDate(dayDate);

            return (
              <div
                key={dayIndex}
                className={`flex-1 text-center py-3 text-sm font-semibold border-r border-default-200 dark:border-default-300 ${
                  isToday
                    ? "bg-primary-50 text-primary-800"
                    : isPastDay
                    ? "bg-default-50 text-default-400"
                    : "bg-background text-foreground"
                }`}
              >
                <div>{DAYS[dayIndex]}</div>
                <div className="text-lg font-bold">{dayDate.getDate()}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sezione "Tutto il giorno" */}
      <div className="flex-none border-b border-default-200 dark:border-default-300">
        <div className="flex">
          <div className="w-16 bg-background text-center py-2 text-xs text-default-600 border-r border-default-200 dark:border-default-300">
            Tutto il giorno
          </div>
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
                className="flex-1 border-r border-default-200 dark:border-default-300"
                style={{ minHeight: "3rem" }}
              >
                <div className="p-1 space-y-1">
                  {allDayEvents.map((event) => (
                    <div
                      key={event.EventId}
                      onClick={() => {
                        setIsOpen(true);
                        setSelectedEventId(event.EventId);
                      }}
                      className="rounded-md p-1 text-xs font-medium hover:shadow-sm transition-all cursor-pointer border border-opacity-30"
                      style={{
                        backgroundColor: event.EventColor + "15",
                        borderColor: event.EventColor,
                        color: "currentColor",
                      }}
                    >
                      <div className="truncate text-foreground">
                        {event.EventTitle}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Area principale con scroll sincronizzato */}
      <div className="flex-1 overflow-y-auto bg-background" ref={scrollRef}>
        <div
          className="flex relative"
          style={{ height: `${24 * ROW_HEIGHT}px` }}
        >
          {/* Colonna delle ore - sticky */}
          <div className="w-16 flex-shrink-0">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="sticky left-0 z-20 text-center py-3 text-xs text-default-600 dark:text-default-700 border-b border-r border-default-200 dark:border-default-300 bg-background"
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
            const isToday = dayDate.toDateString() === now.toDateString();

            return (
              <div
                key={dayIndex}
                className="flex-1 relative border-r border-default-200 dark:border-default-300"
              >
                {/* Righe delle ore per questo giorno */}
                {HOURS.map((hour) => (
                  <div
                    key={`${dayIndex}-${hour}`}
                    className={`absolute w-full group hover:bg-default-100 dark:hover:bg-default-200 transition-colors cursor-pointer border-b border-default-200 dark:border-default-300 ${
                      isPastDay ? "bg-default-50 dark:bg-default-100" : ""
                    }`}
                    style={{
                      height: `${ROW_HEIGHT}px`,
                      top: `${hour * ROW_HEIGHT}px`,
                    }}
                    onClick={() => onDateClick(dayDate)}
                  />
                ))}

                {/* Eventi posizionati assolutamente per questo giorno */}
                {(() => {
                  // Raggruppa eventi per ora per gestire sovrapposizioni
                  const eventsByHour: { [hour: number]: any[] } = {};

                  events.forEach((event) => {
                    const eventStartDate = new Date(event.EventStartDate);
                    const eventStartHour = parseInt(
                      event.EventStartTime.split(":")[0]
                    );

                    // Verifica se l'evento è nel giorno corrente
                    if (
                      dayDate.toDateString() === eventStartDate.toDateString()
                    ) {
                      // Non includere eventi di tutto il giorno
                      if (
                        !(
                          eventStartHour === 0 && event.EventEndTime === "00:00"
                        )
                      ) {
                        if (!eventsByHour[eventStartHour]) {
                          eventsByHour[eventStartHour] = [];
                        }
                        eventsByHour[eventStartHour].push(event);
                      }
                    }
                  });

                  // Renderizza eventi con raggruppamento intelligente
                  return Object.entries(eventsByHour).flatMap(
                    ([hourStr, hourEvents]) => {
                      // Se ci sono più di 3 eventi nella stessa ora, raggruppa
                      if (hourEvents.length > 3) {
                        const firstEvent = hourEvents[0];
                        const eventStartHour = parseInt(
                          firstEvent.EventStartTime.split(":")[0]
                        );
                        const eventEndHour = parseInt(
                          firstEvent.EventEndTime.split(":")[0]
                        );
                        const eventStartMinutes = parseInt(
                          firstEvent.EventStartTime.split(":")[1]
                        );
                        const eventEndMinutes = parseInt(
                          firstEvent.EventEndTime.split(":")[1]
                        );

                        const duration =
                          eventEndHour +
                          eventEndMinutes / 60 -
                          (eventStartHour + eventStartMinutes / 60);
                        const topOffset =
                          (eventStartHour + eventStartMinutes / 60) *
                          ROW_HEIGHT;

                        return [
                          <div
                            key={`group-${hourStr}-${dayIndex}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEventDropdown(hourEvents, e);
                            }}
                            className="absolute rounded-md p-1 text-xs cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 border border-opacity-50 overflow-hidden bg-default-100 dark:bg-default-200"
                            style={{
                              borderColor: "#6366f1",
                              borderLeftWidth: "3px",
                              borderLeftColor: "#6366f1",
                              zIndex: 10,
                              height: `${Math.max(
                                duration * ROW_HEIGHT - 2,
                                ROW_HEIGHT * 0.7
                              )}px`,
                              top: `${topOffset + 1}px`,
                              width: "calc(95% - 2px)",
                              left: "2px",
                            }}
                            title={`${hourEvents.length} eventi alle ${
                              firstEvent.EventStartTime
                            }\n${hourEvents
                              .map((e) => e.EventTitle)
                              .join("\n")}`}
                          >
                            <div className="h-full flex flex-col justify-start">
                              <div className="flex items-center gap-1 mb-1">
                                <div className="flex -space-x-1">
                                  {hourEvents.slice(0, 3).map((event, idx) => (
                                    <div
                                      key={event.EventId}
                                      className="w-3 h-3 rounded-full border border-background shadow-sm"
                                      style={{
                                        backgroundColor: event.EventColor,
                                        zIndex: 3 - idx,
                                      }}
                                    />
                                  ))}
                                </div>
                                <div className="text-xs font-bold text-foreground">
                                  {hourEvents.length} eventi
                                </div>
                              </div>
                              <div className="text-[10px] text-default-600 truncate">
                                {hourEvents
                                  .map((e) => e.EventTitle)
                                  .slice(0, 2)
                                  .join(", ")}
                                {hourEvents.length > 2 && "..."}
                              </div>
                            </div>
                          </div>,
                        ];
                      }

                      // Renderizza eventi normalmente se sono ≤ 3
                      return hourEvents.map((event, index) => {
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

                        const duration =
                          eventEndHour +
                          eventEndMinutes / 60 -
                          (eventStartHour + eventStartMinutes / 60);
                        const topOffset =
                          (eventStartHour + eventStartMinutes / 60) *
                          ROW_HEIGHT;

                        // Calcola posizione per eventi sovrapposti - ora più larghi
                        const totalEvents = hourEvents.length;
                        const eventWidth =
                          totalEvents > 1
                            ? `calc(${85 / totalEvents}% - 1px)`
                            : "calc(95% - 2px)";
                        const leftOffset =
                          totalEvents > 1
                            ? `calc(${(85 / totalEvents) * index}% + 2px)`
                            : "2px";

                        const technicianName =
                          event.TechnicianAssignment?.technician_name ||
                          "Non assegnato";
                        const customerName =
                          event.CustomerInfo?.customer_name || "Cliente N/A";

                        return (
                          <div
                            key={event.EventId}
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsOpen(true);
                              setSelectedEventId(event.EventId);
                              setSelectedEvent(event);
                            }}
                            onMouseEnter={(e) => {
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              setHoveredEvent(event);
                              const optimalPosition =
                                calculateOptimalHoverPosition(rect);
                              setHoverPosition(optimalPosition);
                            }}
                            onMouseLeave={() => {
                              setHoveredEvent(null);
                            }}
                            className="absolute rounded-md p-1 text-xs cursor-pointer shadow-sm hover:shadow-lg hover:scale-105 transition-all duration-200 border border-opacity-50 overflow-hidden hover:border-opacity-80"
                            style={{
                              backgroundColor: event.EventColor + "20",
                              borderColor: event.EventColor,
                              borderLeftWidth: "3px",
                              borderLeftColor: event.EventColor,
                              zIndex: 10 + index,
                              height: `${Math.max(
                                duration * ROW_HEIGHT - 2,
                                ROW_HEIGHT * 0.7
                              )}px`,
                              top: `${topOffset + 1}px`,
                              width: eventWidth,
                              left: leftOffset,
                            }}
                          >
                            <div className="h-full flex flex-col justify-start overflow-hidden">
                              {/* Titolo evento - sempre visibile */}
                              <div className="font-medium text-foreground text-xs truncate">
                                {event.EventTitle}
                              </div>

                              {/* VISTA SETTIMANALE - Layout normalizzato: 1°Tecnico, 2°Cliente */}

                              {/* Prima riga: Tecnico - sempre visibile se c'è spazio */}
                              {duration > 0.5 && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Icon
                                    icon="solar:wrench-bold"
                                    width={8}
                                    className="text-default-500 flex-shrink-0"
                                  />
                                  <div className="text-xs text-default-700 font-medium truncate">
                                    {technicianName}
                                  </div>
                                </div>
                              )}

                              {/* Seconda riga: Cliente - priorità alta */}
                              {duration > 0.8 && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Icon
                                    icon="solar:user-bold"
                                    width={8}
                                    className="text-default-500 flex-shrink-0"
                                  />
                                  <div className="text-xs text-default-600 truncate">
                                    {customerName}
                                  </div>
                                </div>
                              )}

                              {/* Orario - solo se c'è molto spazio, priorità bassa */}
                              {duration > 2.2 && (
                                <div className="text-xs text-default-500 mt-1 opacity-75">
                                  {event.EventStartTime}
                                </div>
                              )}

                              {/* Location - solo se c'è molto spazio */}
                              {duration > 2.8 && event.EventLocation && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Icon
                                    icon="solar:map-point-bold"
                                    width={8}
                                    className="text-default-500 flex-shrink-0"
                                  />
                                  <div className="text-xs text-default-500 truncate">
                                    {event.EventLocation}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    }
                  );
                })()}

                {/* Linea rossa per l'ora corrente (solo per il giorno corrente) */}
                {isToday && isCurrentWeek && redLineBehavior === "show" && (
                  <div
                    className="absolute z-30 pointer-events-none"
                    style={{
                      top: `${currentHour * ROW_HEIGHT}px`,
                      left: "0",
                      right: "0",
                      height: "2px",
                      backgroundColor: "#ef4444",
                      boxShadow: "0 0 6px rgba(239, 68, 68, 0.6)",
                    }}
                  >
                    <div
                      className="absolute left-0 top-0"
                      style={{
                        width: "6px",
                        height: "6px",
                        backgroundColor: "#ef4444",
                        borderRadius: "50%",
                        transform: "translate(-50%, -25%)",
                        boxShadow: "0 0 4px rgba(239, 68, 68, 0.8)",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dropdown per selezione eventi raggruppati */}
      {groupDropdown.isOpen && (
        <div
          ref={dropdownRef}
          className="fixed z-50 bg-background dark:bg-default-100 border border-default-200 dark:border-default-300 rounded-lg shadow-lg max-w-xs"
          style={{
            left: `${groupDropdown.position.x - 150}px`,
            top: `${groupDropdown.position.y}px`,
          }}
        >
          <div className="p-3">
            <div className="text-sm font-semibold text-foreground mb-2">
              Seleziona appuntamento ({groupDropdown.events.length})
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {groupDropdown.events.map((event) => {
                const technicianName =
                  event.TechnicianAssignment?.technician_name ||
                  "Non assegnato";
                const customerName =
                  event.CustomerInfo?.customer_name || "Cliente N/A";

                return (
                  <div
                    key={event.EventId}
                    onClick={() => {
                      setIsOpen(true);
                      setSelectedEventId(event.EventId);
                      setSelectedEvent(event);
                      setGroupDropdown({
                        isOpen: false,
                        events: [],
                        position: { x: 0, y: 0 },
                      });
                    }}
                    className="flex items-start gap-3 p-2 rounded-md hover:bg-default-100 dark:hover:bg-default-200 cursor-pointer transition-colors"
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                      style={{ backgroundColor: event.EventColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-foreground truncate">
                        {event.EventTitle}
                      </div>
                      <div className="text-xs text-default-600 mt-0.5">
                        {event.EventStartTime} - {event.EventEndTime}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Icon
                            icon="solar:wrench-bold"
                            width={10}
                            className="text-default-500"
                          />
                          <span className="text-xs text-default-700 truncate">
                            {technicianName}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Icon
                          icon="solar:user-bold"
                          width={10}
                          className="text-default-500"
                        />
                        <span className="text-xs text-default-600 truncate">
                          {customerName}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Hover personalizzato per eventi singoli */}
      {hoveredEvent && (
        <div
          ref={hoverRef}
          className="fixed z-40 bg-background dark:bg-default-100 border border-default-200 dark:border-default-300 rounded-lg shadow-lg max-w-sm pointer-events-none"
          style={{
            left: `${hoverPosition.x}px`,
            top: `${hoverPosition.y}px`,
            transform: "translateY(-50%)",
          }}
        >
          <div className="p-3">
            <div className="flex items-start gap-3 mb-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                style={{ backgroundColor: hoveredEvent.EventColor }}
              />
              <div className="flex-1">
                <div className="font-semibold text-sm text-foreground">
                  {hoveredEvent.EventTitle}
                </div>
                <div className="text-xs text-default-600 mt-0.5">
                  {hoveredEvent.EventStartTime} - {hoveredEvent.EventEndTime}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Icon
                  icon="solar:wrench-bold"
                  width={12}
                  className="text-default-500 flex-shrink-0"
                />
                <span className="text-sm text-default-700 font-medium">
                  {hoveredEvent.TechnicianAssignment?.technician_name ||
                    "Non assegnato"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Icon
                  icon="solar:user-bold"
                  width={12}
                  className="text-default-500 flex-shrink-0"
                />
                <span className="text-sm text-default-600">
                  {hoveredEvent.CustomerInfo?.customer_name || "Cliente N/A"}
                </span>
              </div>

              {hoveredEvent.EventLocation && (
                <div className="flex items-center gap-2">
                  <Icon
                    icon="solar:map-point-bold"
                    width={12}
                    className="text-default-500 flex-shrink-0"
                  />
                  <span className="text-sm text-default-500 truncate">
                    {hoveredEvent.EventLocation}
                  </span>
                </div>
              )}

              {hoveredEvent.EventDescription && (
                <div className="mt-2 pt-2 border-t border-default-200 dark:border-default-300">
                  <p className="text-xs text-default-600 line-clamp-3">
                    {hoveredEvent.EventDescription}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal evento */}
      <ViewEventModal
        isOpen={isOpen}
        eventId={selectedEventId}
        eventData={selectedEvent}
        isClosed={() => {
          setIsOpen(false);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
};

export default CalendarWeek;
