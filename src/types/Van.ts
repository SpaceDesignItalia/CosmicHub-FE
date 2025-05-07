export interface Van {
  id: string;
  model: string;
  licensePlate: string;
  status: 'available' | 'in_use' | 'maintenance';
  capacity: number;
  year: number;
  assignedTo?: string; // ID del dipendente a cui è assegnato
} 