"use client";

import type {CalendarBookingStepType} from "./types";

import React, {useState} from "react";
import {type DateValue, type SharedSelection} from "@heroui/react";

import BookingDetails from "./BookingDetails";
import {DurationEnum, durations, type TimeSlot} from "./calendar-utils";
import BookingForm from "./BookingForm";

interface CalendarBookingFormProps {
  setCalendarBookingStep: (step: CalendarBookingStepType) => void;
  selectedTimeSlotRange?: TimeSlot[];
  selectedDate?: DateValue;
}

export default function CalendarBookingForm({
  setCalendarBookingStep,
  selectedTimeSlotRange,
  selectedDate,
}: CalendarBookingFormProps) {
  const [selectedTimeZone, setSelectedTimeZone] = useState<string>(
    // use system time zone as default
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  const [selectedDuration, setSelectedDuration] = useState<DurationEnum>(
    DurationEnum.FifteenMinutes,
  );

  const onTimeZoneChange = (keys: SharedSelection) => {
    const newTimeZone = Array.from(keys)[0];

    if (newTimeZone) {
      setSelectedTimeZone(newTimeZone.toString());
    }
  };

  const onDurationChange = (selectedKey: React.Key) => {
    const durationIndex = durations.findIndex((d) => d.key === selectedKey);

    setSelectedDuration(durations[durationIndex].key);
  };

  const onConfirm = (formData: {name: string; email: string; notes: string}) => {
    // Here you should save the appointment data to your system
    console.log("Appointment data:", {
      ...formData,
      selectedDate,
      selectedTimeSlotRange,
      selectedTimeZone,
      selectedDuration
    });
    
    setCalendarBookingStep("booking_confirmation");
  };

  return (
    <div className="flex w-[393px] flex-col items-center gap-5 rounded-large bg-default-50 shadow-small md:w-fit md:flex-row md:items-start md:px-6">
      <BookingDetails
        className="md:w-[220px] md:px-4 md:pt-8"
        selectedDate={selectedDate}
        selectedDuration={selectedDuration}
        selectedTimeSlotRange={selectedTimeSlotRange}
        selectedTimeZone={selectedTimeZone}
        onDurationChange={onDurationChange}
        onTimeZoneChange={onTimeZoneChange}
      />
      <BookingForm setCalendarBookingStep={setCalendarBookingStep} onConfirm={onConfirm} />
    </div>
  );
} 