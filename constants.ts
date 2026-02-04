
import { Booking, Staff, BusinessSettings } from './types';

export const INITIAL_PROMPT = `You are a professional HVAC operations assistant for ArcticFlow AI. Your goal is to provide a seamless, world-class experience for customers and staff.

STRICT OPERATIONAL GUIDELINES:
1. COLLECTION: Precisely collect Full Name, Valid Phone Number, Service Type (Installation or Repair), Problem Description, Site Address, and Preferred Date/Time.
2. DATE VALIDATION: You MUST NOT accept "ASAP", "tomorrow", or "next week" without resolving it to a specific date and time from the available slots. If a user says "ASAP", suggest the next earliest available slot and ask for their explicit confirmation.
3. CONFIRMATION FLOW: Once all 6 data points are collected, you MUST present a summary of the booking and ask the user: "Is this information correct? Shall I proceed with the booking?"
4. ATOMIC SUBMISSION: Only consider a booking "Complete" after the user has explicitly confirmed the summary you provided.
5. PROFESSIONALISM: Maintain a confident, concise, and helpful tone. Use natural language. Avoid unnecessary formatting.
6. LOGIC: Check availability status before confirming slots. Only book between 09:00 and 17:00 AEST for future dates.

CURRENT SYSTEM TIME: {{CURRENT_TIME}}
CALENDAR DISPATCH STATUS:
{{AVAILABILITY_INFO}}`;

export const VAPI_SYSTEM_PROMPT = `You are an Australian HVAC outbound calling assistant.

Objectives:
- Confirm customer request
- Book a job or schedule a callback
- Escalate emergencies

Rules:
- Be professional and concise
- Do NOT quote or negotiate prices
- Do NOT promise availability
- Keep call under 3 minutes
- If customer is busy, offer callback
- If emergency, mark urgency as HIGH

At call end, output structured JSON ONLY in this format:

{
  "booking_confirmed": boolean,
  "selected_time": string | null,
  "urgency": "low" | "medium" | "high",
  "notes": string
}`;

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  name: 'ArcticFlow AI HVAC Solutions',
  address: '101 Innovation Way, Canberra ACT 2601',
  phone: '1300 ARCTIC',
  email: 'service@arcticflow.ai',
  taxId: 'ABN 12 345 678 910',
  hourlyRate: 110,
  gstRate: 10,
  equipmentCatalog: [
    { model: '7kW Split System Unit', cost: 1450 },
    { model: '5kW Split System Unit', cost: 1100 },
    { model: 'Ducted Zone Controller', cost: 450 },
    { model: 'Inverter Compressor', cost: 890 }
  ]
};

export const MOCK_STAFF: Staff[] = [
  { 
    id: 'admin1', 
    name: 'Main Admin', 
    username: 'admin', 
    password: '1234',
    phone: '0000 000 000', 
    email: 'admin@arcticflow.ai', 
    role: 'Admin', 
    teamType: 'Repair',
    status: 'Available',
    active: true 
  },
  { 
    id: 's1', 
    name: 'Mike Tech', 
    username: 'mike_repair', 
    password: 'password123',
    phone: '0412 345 678', 
    email: 'mike@arcticflow.ai', 
    role: 'Staff', 
    teamType: 'Repair',
    status: 'Available',
    active: true,
    arcLicense: 'AU12345'
  },
  { 
    id: 's2', 
    name: 'Sarah Build', 
    username: 'sarah_install', 
    password: 'password123',
    phone: '0422 999 000', 
    email: 'sarah@arcticflow.ai', 
    role: 'Staff', 
    teamType: 'Installation',
    status: 'Available',
    active: true,
    arcLicense: 'AU67890'
  }
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: '1',
    name: 'John Doe',
    phone: '555-0101',
    email: 'john@example.com',
    service_type: 'Repair / Maintenance',
    team_type: 'Repair',
    system_type: 'Ducted',
    description: 'AC making strange rattling noises.',
    location: { address: '123 Maple St', suburb: 'Springfield', lat: -35.2809, lng: 149.1300 },
    preferred_date_time: '2025-05-20 09:00',
    status: 'Assigned',
    createdAt: new Date().toISOString(),
    assignedStaffIds: ['s1'],
    notes: [],
    internalNotes: [
      {
        id: 'in1',
        text: 'Customer sounds urgent.',
        author: 'System',
        timestamp: new Date().toISOString()
      }
    ],
    estimatedCost: '$250 - $400',
    lineItems: [
      { id: 'li1', description: 'Diagnostic Fee', amount: 80 },
      { id: 'li2', description: 'Refrigerant Refill', amount: 120 }
    ],
    payments: [
      { id: 'p1', amount: 200, method: 'Credit Card', date: new Date().toISOString() }
    ],
    isInvoiced: true,
    attachments: [
      { id: 'a1', name: 'Unit_Photo_Front.jpg', type: 'image', url: 'https://picsum.photos/seed/hvac1/400/300', uploadedAt: new Date().toISOString() }
    ],
    laborHours: 2.5,
    equipmentUsed: ['5kW Split System Unit']
  }
];
