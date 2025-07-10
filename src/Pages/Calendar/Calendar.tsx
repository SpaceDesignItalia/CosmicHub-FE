import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Badge,
  Avatar,
  AvatarGroup,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  Tooltip,
  ScrollShadow,
  Divider,
  ButtonGroup
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import type { Appointment, Technician } from '../../types/Appointment';
import type { Customer } from '../../types/Customer';

// Mock data semplificata
const technicians: Technician[] = [
  {
    technician_id: '1',
    name: 'Marco',
    surname: 'Rossi',
    email: 'marco.rossi@cosmichub.it',
    phone: '+39 333 1234567',
    specialization: ['Elettrici', 'Domotica'],
    color: '#3b82f6',
    is_available: true
  },
  {
    technician_id: '2',
    name: 'Laura',
    surname: 'Bianchi',
    email: 'laura.bianchi@cosmichub.it',
    phone: '+39 335 7654321',
    specialization: ['Climatizzazione'],
    color: '#10b981',
    is_available: true
  },
  {
    technician_id: '3',
    name: 'Andrea',
    surname: 'Verdi',
    email: 'andrea.verdi@cosmichub.it',
    phone: '+39 339 9876543',
    specialization: ['Idraulica'],
    color: '#f59e0b',
    is_available: true
  }
];

const customers: Customer[] = [
  {
    customer_id: '1',
    name: 'Giovanni',
    surname: 'Neri',
    email: 'giovanni.neri@email.com',
    phone: '+39 338 1111111',
    address: 'Via Roma 15, Milano',
    city: 'Milano',
    zip_code: '20121',
    country: 'Italia',
    vat_number: 'IT12345678901',
    status: 'active',
    customer_type: 'private',
    created_at: new Date(),
    updated_at: new Date(),
    created_by: 'admin'
  }
];

const appointments: Appointment[] = [
  {
    appointment_id: '1',
    customer_id: '1',
    technician_id: '1',
    title: 'Manutenzione Impianto Elettrico',
    description: 'Controllo generale dell\'impianto elettrico',
    appointment_date: new Date(),
    start_time: '09:00',
    end_time: '12:00',
    status: 'confirmed',
    priority: 'medium',
    appointment_type: 'maintenance',
    location: 'Via Roma 15, Milano',
    estimated_duration: 180,
    notes: 'Portare materiale per sostituzione quadro',
    created_at: new Date(),
    updated_at: new Date(),
    created_by: 'admin',
    send_reminder: true,
    technician: technicians[0]
  },
  {
    appointment_id: '2',
    customer_id: '1',
    technician_id: '2',
    title: 'Installazione Climatizzatore',
    description: 'Installazione nuovo sistema di climatizzazione split',
    appointment_date: new Date(),
    start_time: '14:00',
    end_time: '17:00',
    status: 'scheduled',
    priority: 'high',
    appointment_type: 'installation',
    location: 'Via Roma 15, Milano',
    estimated_duration: 180,
    notes: 'Cliente preferisce installazione pomeridiana',
    created_at: new Date(),
    updated_at: new Date(),
    created_by: 'admin',
    send_reminder: true,
    technician: technicians[1]
  }
];

const statusColorMap = {
  scheduled: 'warning',
  confirmed: 'primary',
  in_progress: 'secondary',
  completed: 'success',
  cancelled: 'danger',
  no_show: 'default'
} as const;

const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
const MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const generateCalendarDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const days = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    days.push({
      date: new Date(date),
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: date.toDateString() === new Date().toDateString()
    });
  }
  
  return days;
};

const generateWeekDays = (date: Date) => {
  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - date.getDay());
  
  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    days.push({
      date: new Date(day),
      dayNumber: day.getDate(),
      dayName: day.toLocaleDateString('it-IT', { weekday: 'long' }),
      isToday: day.toDateString() === new Date().toDateString()
    });
  }
  
  return days;
};

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 7; hour <= 19; hour++) {
    slots.push({
      time: `${hour.toString().padStart(2, '0')}:00`,
      hour: hour
    });
  }
  return slots;
};

export default function Calendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const calendarDays = generateCalendarDays(year, month);
  const weekDays = generateWeekDays(currentDate);
  const timeSlots = generateTimeSlots();

  // Helper functions
  const appointmentsForDate = (date: Date) => {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointment_date);
      return appointmentDate.toDateString() === date.toDateString();
    });
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      scheduled: 'Programmato',
      confirmed: 'Confermato',
      in_progress: 'In Corso',
      completed: 'Completato',
      cancelled: 'Cancellato',
      no_show: 'Non Presentato'
    };
    return labels[status as keyof typeof labels] || status;
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const getDateRangeTitle = () => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('it-IT', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } else if (viewMode === 'week') {
      const weekStart = weekDays[0].date;
      const weekEnd = weekDays[6].date;
      return `${weekStart.getDate()}-${weekEnd.getDate()} ${MONTHS[weekStart.getMonth()]} ${weekStart.getFullYear()}`;
    } else {
      return `${MONTHS[month]} ${year}`;
    }
  };

  const getAppointmentsForDateAndTime = (date: Date, hour: number) => {
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointment_date);
      const appointmentHour = parseInt(appointment.start_time.split(':')[0]);
      return appointmentDate.toDateString() === date.toDateString() && 
             appointmentHour === hour;
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-divider bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Title and main controls */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Calendario</h1>
              <p className="text-small text-default-500 mt-1">
                Gestisci tutti gli appuntamenti e le programmazioni
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="flat"
                onPress={() => setCurrentDate(new Date())}
                startContent={<Icon icon="solar:home-bold" width={16} />}
              >
                Oggi
              </Button>
              

              
              <Button
                color="primary"
                onPress={() => navigate("/calendar/new")}
                startContent={<Icon icon="solar:calendar-add-bold" width={16} />}
              >
                Nuovo Appuntamento
              </Button>
            </div>
          </div>
          
          {/* Navigation and view controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  isIconOnly
                  variant="light"
                  onPress={() => navigateDate('prev')}
                >
                  <Icon icon="solar:arrow-left-linear" width={20} />
                </Button>
                
                <div className="min-w-[200px] text-center">
                  <h2 className="text-xl font-semibold text-foreground">
                    {getDateRangeTitle()}
                  </h2>
                </div>
                
                <Button
                  isIconOnly
                  variant="light"
                  onPress={() => navigateDate('next')}
                >
                  <Icon icon="solar:arrow-right-linear" width={20} />
                </Button>
              </div>
            </div>
            
            <ButtonGroup variant="flat">
              <Button
                variant={viewMode === 'day' ? 'solid' : 'flat'}
                color={viewMode === 'day' ? 'primary' : 'default'}
                onPress={() => setViewMode('day')}
                startContent={<Icon icon="solar:calendar-bold" width={16} />}
              >
                Giorno
              </Button>
              <Button
                variant={viewMode === 'week' ? 'solid' : 'flat'}
                color={viewMode === 'week' ? 'primary' : 'default'}
                onPress={() => setViewMode('week')}
                startContent={<Icon icon="solar:calendar-minimalistic-bold" width={16} />}
              >
                Settimana
              </Button>
              <Button
                variant={viewMode === 'month' ? 'solid' : 'flat'}
                color={viewMode === 'month' ? 'primary' : 'default'}
                onPress={() => setViewMode('month')}
                startContent={<Icon icon="solar:calendar-mark-bold" width={16} />}
              >
                Mese
              </Button>
            </ButtonGroup>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Month View */}
        {viewMode === 'month' && (
          <Card>
            <CardBody className="p-0">
              {/* Days header */}
              <div className="grid grid-cols-7 border-b border-divider">
                {DAYS_OF_WEEK.map((day) => (
                  <div
                    key={day}
                    className="p-3 text-center text-small font-semibold text-default-600 bg-default-50"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, index) => {
                  const dayAppointments = appointmentsForDate(day.date);
                  const hasAppointments = dayAppointments.length > 0;
                  
                  return (
                    <div
                      key={index}
                      className={`
                        min-h-[120px] p-3 border-r border-b border-divider cursor-pointer
                        hover:bg-default-50 transition-colors
                        ${!day.isCurrentMonth ? 'text-default-400 bg-default-25' : ''}
                        ${day.isToday ? 'bg-primary-50 border-primary-200' : ''}
                      `}
                      onClick={() => setSelectedDate(day.date)}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className={`
                          text-small font-semibold
                          ${day.isToday ? 'text-primary font-bold' : ''}
                          ${!day.isCurrentMonth ? 'text-default-400' : 'text-default-700'}
                        `}>
                          {day.dayNumber}
                        </span>
                        
                        {hasAppointments && (
                          <Badge
                            color="primary"
                            size="sm"
                          >
                            {dayAppointments.length}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        {dayAppointments.slice(0, 3).map((appointment) => (
                          <div
                            key={appointment.appointment_id}
                            className="p-1 rounded text-tiny cursor-pointer"
                            style={{
                              backgroundColor: `${appointment.technician?.color}20`,
                              borderLeft: `3px solid ${appointment.technician?.color}`
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppointment(appointment);
                              onOpen();
                            }}
                          >
                            <div className="font-medium truncate">
                              {appointment.start_time} {appointment.title}
                            </div>
                          </div>
                        ))}
                        {dayAppointments.length > 3 && (
                          <div className="text-tiny text-default-500 text-center">
                            +{dayAppointments.length - 3} altri
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Week View */}
        {viewMode === 'week' && (
          <Card>
            <CardBody className="p-0">
              {/* Week header */}
              <div className="grid grid-cols-8 border-b border-divider">
                <div className="p-3 text-small font-semibold text-default-600 bg-default-50">
                  Orario
                </div>
                {weekDays.map((day) => (
                  <div
                    key={day.date.toISOString()}
                    className={`p-3 text-center text-small font-semibold ${
                      day.isToday ? 'text-primary bg-primary-50' : 'text-default-600 bg-default-50'
                    }`}
                  >
                    <div className="capitalize">{day.dayName.substring(0, 3)}</div>
                    <div className="text-lg font-bold">{day.dayNumber}</div>
                  </div>
                ))}
              </div>

              {/* Time slots */}
              <ScrollShadow className="max-h-[600px]">
                {timeSlots.map((slot) => (
                  <div key={slot.time} className="grid grid-cols-8 border-b border-divider">
                    <div className="p-3 text-small text-default-500 font-medium bg-default-25">
                      {slot.time}
                    </div>
                    {weekDays.map((day) => {
                      const slotAppointments = getAppointmentsForDateAndTime(day.date, slot.hour);
                      
                      return (
                        <div 
                          key={`${day.date.toISOString()}-${slot.time}`}
                          className={`min-h-[60px] p-2 border-r border-divider cursor-pointer hover:bg-default-50 ${
                            day.isToday ? 'bg-primary-25' : ''
                          }`}
                          onClick={() => setSelectedDate(day.date)}
                        >
                          {slotAppointments.map((appointment) => (
                            <div
                              key={appointment.appointment_id}
                              className="p-2 rounded text-tiny mb-1 cursor-pointer"
                              style={{
                                backgroundColor: `${appointment.technician?.color}20`,
                                borderLeft: `3px solid ${appointment.technician?.color}`
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAppointment(appointment);
                                onOpen();
                              }}
                            >
                              <div className="font-semibold truncate">{appointment.title}</div>
                              <div className="text-default-600">{appointment.start_time} - {appointment.end_time}</div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </ScrollShadow>
            </CardBody>
          </Card>
        )}

        {/* Day View */}
        {viewMode === 'day' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Appuntamenti del giorno</h3>
                </CardHeader>
                <CardBody className="p-0">
                  <ScrollShadow className="max-h-[600px]">
                    {timeSlots.map((slot) => {
                      const slotAppointments = getAppointmentsForDateAndTime(currentDate, slot.hour);
                      
                      return (
                        <div key={slot.time} className="flex border-b border-divider">
                          <div className="w-20 p-4 text-small text-default-500 font-medium bg-default-25">
                            {slot.time}
                          </div>
                          <div className="flex-1 min-h-[80px] p-4">
                            {slotAppointments.length > 0 ? (
                              <div className="space-y-2">
                                {slotAppointments.map((appointment) => (
                                  <div
                                    key={appointment.appointment_id}
                                    className="p-3 rounded-lg cursor-pointer hover:shadow-sm transition-shadow"
                                    style={{
                                      backgroundColor: `${appointment.technician?.color}10`,
                                      borderLeft: `4px solid ${appointment.technician?.color}`
                                    }}
                                    onClick={() => {
                                      setSelectedAppointment(appointment);
                                      onOpen();
                                    }}
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <h4 className="font-semibold text-default-800">{appointment.title}</h4>
                                      <Chip
                                        color={statusColorMap[appointment.status]}
                                        size="sm"
                                        variant="flat"
                                      >
                                        {getStatusLabel(appointment.status)}
                                      </Chip>
                                    </div>
                                    <p className="text-small text-default-600 mb-2">{appointment.description}</p>
                                    <div className="flex items-center gap-4 text-tiny text-default-500">
                                      <span>⏰ {appointment.start_time} - {appointment.end_time}</span>
                                      <span>📍 {appointment.location}</span>
                                      {appointment.technician && (
                                        <span>👨‍🔧 {appointment.technician.name} {appointment.technician.surname}</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-full text-default-400 text-small">
                                Nessun appuntamento
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </ScrollShadow>
                </CardBody>
              </Card>
            </div>

            {/* Day sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Riepilogo</h3>
                </CardHeader>
                <CardBody>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary mb-1">
                      {appointmentsForDate(currentDate).length}
                    </div>
                    <div className="text-small text-default-500">Appuntamenti oggi</div>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Tecnici</h3>
                </CardHeader>
                <CardBody className="space-y-3">
                  {technicians.map((tech) => (
                    <div key={tech.technician_id} className="flex items-center gap-3">
                      <Avatar
                        size="sm"
                        style={{ backgroundColor: tech.color }}
                        name={`${tech.name.charAt(0)}${tech.surname.charAt(0)}`}
                        classNames={{
                          name: "text-white text-xs font-bold"
                        }}
                      />
                      <div className="flex-1">
                        <div className="text-small font-medium">{tech.name} {tech.surname}</div>
                        <div className="text-tiny text-default-500">{tech.specialization.join(', ')}</div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${tech.is_available ? 'bg-success' : 'bg-default-300'}`} />
                    </div>
                  ))}
                </CardBody>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <h3 className="text-xl font-semibold">Dettagli Appuntamento</h3>
              </ModalHeader>
              <ModalBody>
                {selectedAppointment && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-lg font-semibold mb-2">{selectedAppointment.title}</h4>
                      <p className="text-default-600">{selectedAppointment.description}</p>
                    </div>

                    <Divider />

                    <div className="grid grid-cols-2 gap-4 text-small">
                      <div>
                        <span className="font-medium">Data:</span> {new Date(selectedAppointment.appointment_date).toLocaleDateString('it-IT')}
                      </div>
                      <div>
                        <span className="font-medium">Orario:</span> {selectedAppointment.start_time} - {selectedAppointment.end_time}
                      </div>
                      <div>
                        <span className="font-medium">Indirizzo:</span> {selectedAppointment.location}
                      </div>
                      <div>
                        <span className="font-medium">Durata:</span> {selectedAppointment.estimated_duration} min
                      </div>
                    </div>

                    {selectedAppointment.technician && (
                      <div className="flex items-center gap-3 p-3 bg-default-50 rounded-lg">
                        <Avatar
                          size="sm"
                          style={{ backgroundColor: selectedAppointment.technician.color }}
                          name={`${selectedAppointment.technician.name.charAt(0)}${selectedAppointment.technician.surname.charAt(0)}`}
                          classNames={{
                            name: "text-white text-xs font-bold"
                          }}
                        />
                        <div>
                          <div className="font-medium">{selectedAppointment.technician.name} {selectedAppointment.technician.surname}</div>
                          <div className="text-small text-default-500">{selectedAppointment.technician.specialization.join(', ')}</div>
                        </div>
                      </div>
                    )}

                    {selectedAppointment.notes && (
                      <div>
                        <h5 className="font-medium mb-1">Note:</h5>
                        <p className="text-small text-default-600">{selectedAppointment.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Chiudi
                </Button>
                <Button
                  color="primary"
                  onPress={() => {
                    navigate(`/calendar/edit/${selectedAppointment?.appointment_id}`);
                    onClose();
                  }}
                >
                  Modifica
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
} 