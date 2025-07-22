// ConfirmDeleteModal.tsx

import { Button, Popover, PopoverContent, PopoverTrigger } from "@heroui/react";
import { useState } from "react";
import { Icon } from "@iconify/react";

interface Event {
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
}

interface ConfirmDeleteEventModalProps {
  EventData: Event;
  DeleteEvent: (Event: Event) => void;
}

export default function ConfirmDeleteEventModal({
  EventData,
  DeleteEvent,
}: ConfirmDeleteEventModalProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  return (
 <p></p>
  );
}
