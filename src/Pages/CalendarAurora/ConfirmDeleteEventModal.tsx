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

  const handleConfirmDelete = () => {
    DeleteEvent(EventData);
    setIsOpen(false);
  };

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen} placement="top">
      <PopoverTrigger>
        <Button
          color="danger"
          variant="flat"
          size="md"
          startContent={<Icon icon="solar:trash-bin-trash-bold" width={16} />}
          onPress={() => setIsOpen(true)}
        >
          Elimina Evento
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Icon
              icon="solar:danger-triangle-bold"
              width={24}
              className="text-danger"
            />
            <div>
              <h3 className="font-semibold text-lg">Conferma Eliminazione</h3>
              <p className="text-sm text-default-600">
                Sei sicuro di voler eliminare l'evento "{EventData.EventTitle}"?
              </p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="light" onPress={() => setIsOpen(false)}>
              Annulla
            </Button>
            <Button color="danger" onPress={handleConfirmDelete}>
              Elimina
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
