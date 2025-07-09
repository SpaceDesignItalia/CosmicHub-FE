import React from "react";
import PageHeader from "../../Components/Layout/PageHeader";
import CalendarBooking from "../../Components/Calendar/CalendarBooking";

export default function BookingCalendar() {
  return (
    <div className="flex flex-col h-screen">
      <PageHeader
        title="Book Appointment"
        description="Select date and time for your appointment"
        icon="solar:calendar-add-bold-duotone"
      />
      
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto flex justify-center">
          <CalendarBooking />
        </div>
      </div>
    </div>
  );
} 