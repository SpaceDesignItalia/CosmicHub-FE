export interface Employee {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'inactive';
  assignedVanId?: string; // ID del furgone assegnato
} 