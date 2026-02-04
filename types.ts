
export type ServiceType = 'New installation' | 'Repair / Maintenance' | 'Ducted systems' | 'Emergency service';
export type SystemType = 'Split System' | 'Ducted' | 'Evaporative' | 'Gas Heating' | 'Multi-head Split';
export type TeamType = 'Repair' | 'Installation';
export type JobStatus = 'New' | 'Confirmed' | 'Assigned' | 'In Progress' | 'Completed' | 'Cancelled';
export type UserRole = 'Admin' | 'Staff';

export interface Location {
  address: string;
  suburb: string;
  lat?: number;
  lng?: number;
}

export interface LineItem {
  id: string;
  description: string;
  amount: number;
}

export interface Payment {
  id: string;
  amount: number;
  date: string;
  method: string;
  note?: string;
  recordedBy?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'document';
  url: string;
  uploadedAt: string;
}

export interface InternalNote {
  id: string;
  text: string;
  author: string;
  timestamp: string;
}

export interface BusinessSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  logoUrl?: string;
  hourlyRate: number;
  gstRate: number;
  equipmentCatalog: { model: string; cost: number }[];
}

export interface CompletionReport {
  workPerformed: string;
  partsUsed: string[];
  systemBrand: string;
  systemModel: string;
  serialNumber: string;
  capacityKw: string;
  refrigerantType: string;
  refrigerantAmountKg: number;
  safetyChecks: {
    electrical: boolean;
    leakCheck: boolean;
    pressureTest: boolean;
    airflowBalanced: boolean;
    mountingSecure: boolean;
  };
  arcLicense: string;
  technicianNotes: string;
  customerName: string;
  customerSignature: string;
  completedAt: string;
  photos: string[];
}

export interface Booking {
  id: string;
  name: string;
  phone: string;
  email?: string;
  service_type: ServiceType;
  system_type?: SystemType;
  team_type: TeamType;
  description: string;
  location: Location;
  preferred_date_time: string;
  status: JobStatus;
  createdAt: string;
  assignedStaffIds: string[];
  notes: string[];
  internalNotes: InternalNote[];
  estimatedCost?: string;
  lineItems: LineItem[];
  payments: Payment[];
  isInvoiced: boolean;
  completionReport?: CompletionReport;
  attachments: Attachment[];
  laborHours?: number;
  equipmentUsed?: string[];
}

export interface OutboundCall {
  id: string;
  bookingId?: string;
  phoneNumber: string;
  customerName: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  result?: {
    booking_confirmed: boolean;
    selected_time: string | null;
    urgency: 'low' | 'medium' | 'high';
    notes: string;
  };
  createdAt: string;
}

export interface Staff {
  id: string;
  name: string;
  username: string;
  password?: string;
  phone: string;
  email: string;
  role: UserRole;
  teamType: TeamType;
  status: 'Available' | 'Busy' | 'Offline';
  active: boolean;
  arcLicense?: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  teamType?: TeamType;
}

export enum Page {
  Home = 'home',
  AdminDashboard = 'admin_dashboard',
  BookingDetails = 'booking_details',
  StaffDashboard = 'staff_dashboard',
  Login = 'login'
}
