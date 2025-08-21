import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import ViewEventModal from "./ViewEventModal";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
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

interface CalendarDayProps {
  currentDate: Date;
  onDateClick: (date: Date) => void;
  redLineBehavior: string;
  events: CalendarEvent[];
}

const CalendarDay: React.FC<CalendarDayProps> = ({
  currentDate,
  onDateClick,
  redLineBehavior,
  events,
}) => {
  const now = new Date();
  const currentTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Europe/Rome" })
  );
  const [currentHour, setCurrentHour] = useState(
    currentTime.getHours() + currentTime.getMinutes() / 60
  );
  const isToday = currentDate.toDateString() === now.toDateString();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const newNow = new Date();
      const newCurrentTime = new Date(
        newNow.toLocaleString("en-US", { timeZone: "Europe/Rome" })
      );
      setCurrentHour(
        newCurrentTime.getHours() + newCurrentTime.getMinutes() / 60
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isToday && scrollRef.current) {
      const scrollPosition =
        currentHour * ROW_HEIGHT - window.innerHeight / 2 + HEADER_HEIGHT;
      scrollRef.current.scrollTop = Math.max(0, scrollPosition);
    }
  }, [isToday]);

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Sezione "Tutto il giorno" */}
      <div className="flex-none flex border-b border-default-200 dark:border-default-300">
        <div className="w-16 bg-background dark:bg-default-50 text-center py-3 text-xs text-default-600 dark:text-default-700 border-r border-default-200 dark:border-default-300">
          Tutto il giorno
        </div>
        <div className="flex-1">
          {(() => {
            const allDayEvents = events.filter((event) => {
              const eventStartHour = parseInt(
                event.EventStartTime.split(":")[0]
              );
              return (
                eventStartHour === 0 &&
                event.EventEndTime === "00:00" &&
                currentDate.toDateString() ===
                  new Date(event.EventStartDate).toDateString()
              );
            });

            return (
              <div
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
          })()}
        </div>
      </div>

      {/* Area principale con scroll sincronizzato */}
      <div className="flex-1 overflow-y-auto bg-background" ref={scrollRef}>
        <div className="flex relative" style={{ height: `${24 * ROW_HEIGHT}px` }}>
          {/* Colonna delle ore - sticky */}
          <div className="w-16 flex-shrink-0">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="sticky left-0 z-20 text-center py-3 text-xs text-default-600 dark:text-default-700 border-b border-r border-default-200 dark:border-default-300 bg-background"
                style={{ height: `${ROW_HEIGHT}px` }}
              >
                {`${hour.toString().padStart(2, "0")}:00`}
              </div>
            ))}
          </div>

          {/* Area eventi */}
          <div className="flex-1 relative">
            {/* Righe delle ore */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute w-full group hover:bg-default-100 dark:hover:bg-default-200 transition-colors cursor-pointer border-b border-default-200 dark:border-default-300"
                style={{ 
                  height: `${ROW_HEIGHT}px`,
                  top: `${hour * ROW_HEIGHT}px`
                }}
                onClick={() => onDateClick(currentDate)}
              />
            ))}

            {/* Eventi posizionati assolutamente */}
            {(() => {
              // Raggruppa eventi per ora per gestire sovrapposizioni
              const eventsByHour: { [hour: number]: CalendarEvent[] } = {};
              
              events.forEach((event) => {
                const eventStartDate = new Date(event.EventStartDate);
                const eventStartHour = parseInt(event.EventStartTime.split(":")[0]);
                
                // Verifica se l'evento è nel giorno corrente
                if (currentDate.toDateString() === eventStartDate.toDateString()) {
                  // Non includere eventi di tutto il giorno
                  if (!(eventStartHour === 0 && event.EventEndTime === "00:00")) {
                    if (!eventsByHour[eventStartHour]) {
                      eventsByHour[eventStartHour] = [];
                    }
                    eventsByHour[eventStartHour].push(event);
                  }
                }
              });

              // Renderizza tutti gli eventi
              return Object.entries(eventsByHour).flatMap(([hourStr, hourEvents]) => {
                return hourEvents.map((event, index) => {
                  const eventStartHour = parseInt(event.EventStartTime.split(":")[0]);
                  const eventEndHour = parseInt(event.EventEndTime.split(":")[0]);
                  const eventStartMinutes = parseInt(event.EventStartTime.split(":")[1]);
                  const eventEndMinutes = parseInt(event.EventEndTime.split(":")[1]);

                  const duration = eventEndHour + eventEndMinutes / 60 - (eventStartHour + eventStartMinutes / 60);
                  const topOffset = (eventStartHour + eventStartMinutes / 60) * ROW_HEIGHT;
                  
                  // Calcola posizione per eventi sovrapposti
                  const totalEvents = hourEvents.length;
                  const eventWidth = totalEvents > 1 ? `calc(${95 / totalEvents}% - 2px)` : 'calc(95% - 4px)';
                  const leftOffset = totalEvents > 1 ? `calc(${(95 / totalEvents) * index}% + 4px)` : '4px';

                                        const technicianName = event.TechnicianAssignment?.technician_name || 'Non assegnato';
                      const customerName = event.CustomerInfo?.customer_name || 'Cliente N/A';
                      
                      return (
                        <div
                          key={event.EventId}
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(true);
                            setSelectedEventId(event.EventId);
                          }}
                          className="absolute rounded-lg p-2 text-sm cursor-pointer shadow-sm hover:shadow-md transition-all duration-200 border border-opacity-50 overflow-hidden"
                          style={{
                            backgroundColor: event.EventColor + '20',
                            borderColor: event.EventColor,
                            borderLeftWidth: '3px',
                            borderLeftColor: event.EventColor,
                            zIndex: 10 + index,
                            height: `${Math.max(duration * ROW_HEIGHT - 2, ROW_HEIGHT * 0.8)}px`,
                            top: `${topOffset + 1}px`,
                            width: eventWidth,
                            left: leftOffset,
                          }}
                          title={`${event.EventTitle}\n${event.EventStartTime} - ${event.EventEndTime}\nTecnico: ${technicianName}\nCliente: ${customerName}\nLocation: ${event.EventLocation || 'N/A'}`}
                        >
                          <div className="h-full flex flex-col justify-start overflow-hidden">
                            {/* Titolo evento - sempre visibile */}
                            <div className="font-medium text-foreground text-xs truncate">
                              {event.EventTitle}
                            </div>
                            
                            {/* VISTA GIORNALIERA - Soglie basse per mostrare più info */}
                            
                            {/* Orario - quasi sempre visibile */}
                            {duration > 0.5 && (
                              <div className="text-xs text-default-600 opacity-90 mt-0.5">
                                {event.EventStartTime} - {event.EventEndTime}
                              </div>
                            )}
                            
                            {/* Tecnico - priorità alta, soglia bassa */}
                            {duration > 0.8 && (
                              <div className="flex items-center gap-1 mt-1">
                                <Icon icon="solar:wrench-bold" width={10} className="text-default-500 flex-shrink-0" />
                                <div className="text-xs text-default-700 font-medium truncate">
                                  {technicianName}
                                </div>
                              </div>
                            )}
                            
                            {/* Cliente - priorità alta, soglia bassa */}
                            {duration > 1.1 && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Icon icon="solar:user-bold" width={10} className="text-default-500 flex-shrink-0" />
                                <div className="text-xs text-default-600 truncate">
                                  {customerName}
                                </div>
                              </div>
                            )}
                            
                            {/* Location - soglia media */}
                            {duration > 1.5 && event.EventLocation && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Icon icon="solar:map-point-bold" width={10} className="text-default-500 flex-shrink-0" />
                                <div className="text-xs text-default-500 truncate">
                                  {event.EventLocation}
                                </div>
                              </div>
                            )}
                            
                            {/* Tipo intervento - se c'è spazio */}
                            {duration > 2.0 && event.EventType && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Icon icon="solar:settings-bold" width={10} className="text-default-500 flex-shrink-0" />
                                <div className="text-xs text-default-500 truncate">
                                  {event.EventType}
                                </div>
                              </div>
                            )}
                            
                            {/* Descrizione - se c'è molto spazio */}
                            {duration > 2.8 && event.EventDescription && (
                              <div className="text-xs text-default-600 mt-1 line-clamp-2 opacity-80">
                                {event.EventDescription}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                });
              });
            })()}

            {/* Linea rossa per l'ora corrente */}
            {isToday && redLineBehavior === "show" && (
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
        </div>
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

export default CalendarDay;