
import React, { useState, useMemo, useRef } from 'react';
import { Booking, Staff, TeamType, BusinessSettings, ServiceType, UserRole, JobStatus, OutboundCall } from '../types';
import { CallService } from '../services/callService';

interface AdminDashboardProps {
  bookings: Booking[];
  staff: Staff[];
  masterPrompt: string;
  setMasterPrompt: (prompt: string) => void;
  businessSettings: BusinessSettings;
  setBusinessSettings: (s: BusinessSettings) => void;
  onViewDetails: (id: string) => void;
  onDelete: (id: string) => void;
  onAddStaff: (s: any) => void;
  onToggleStaff: (id: string) => void;
  onAddBooking: (booking: any) => void;
  checkAvailability: (dateTime: string, teamType: TeamType) => Staff[];
  onLogout: () => void;
}

type Tab = 'dashboard' | 'bookings' | 'calendar' | 'staff' | 'revenue' | 'outbound' | 'agent' | 'settings';

interface CSVRow {
  name: string;
  phone: string;
  email: string;
  service_type: string;
  address: string;
  suburb: string;
  date: string;
  time: string;
  notes: string;
  isValid: boolean;
  error?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  bookings, staff, masterPrompt, setMasterPrompt, 
  businessSettings, setBusinessSettings,
  onViewDetails, onDelete, onAddStaff, onToggleStaff, onAddBooking, checkAvailability, onLogout
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState<CSVRow[]>([]);
  const [outboundCalls, setOutboundCalls] = useState<OutboundCall[]>([]);
  const [isCalling, setIsCalling] = useState<string | null>(null);
  
  const csvInputRef = useRef<HTMLInputElement>(null);
  
  const [newStaff, setNewStaff] = useState({ 
    name: '', username: '', password: '', phone: '', email: '', teamType: 'Repair' as TeamType, arcLicense: '', role: 'Staff' as UserRole
  });

  const [newBooking, setNewBooking] = useState({
    name: '', phone: '', email: '', service_type: 'Repair / Maintenance' as ServiceType, description: '', address: '', suburb: '', date: '', time: '09:00'
  });

  const stats = useMemo(() => {
    const invoiced = bookings.reduce((sum, b) => sum + b.lineItems.reduce((s, li) => s + li.amount, 0), 0);
    const paid = bookings.reduce((sum, b) => sum + b.payments.reduce((s, p) => s + p.amount, 0), 0);
    const activeTechnicians = staff.filter(s => s.role === 'Staff' && s.active).length;
    const pendingJobs = bookings.filter(b => b.status !== 'Completed' && b.status !== 'Cancelled').length;
    
    return { invoiced, paid, balance: invoiced - paid, activeTechnicians, pendingJobs };
  }, [bookings, staff]);

  const timeBlocks = ['01:00', '03:00', '09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00'];

  const triggerOutboundCall = async (booking: Booking) => {
    setIsCalling(booking.id);
    try {
      const callId = await CallService.startOutboundCall({
        phoneNumber: booking.phone,
        customerName: booking.name,
        jobType: booking.service_type,
        callReason: 'Confirming your recent service request and checking for available time slots.',
        availableTimeSlots: 'Next Monday 9am, Tuesday 2pm',
        bookingId: booking.id
      });

      const newCall: OutboundCall = {
        id: callId,
        bookingId: booking.id,
        phoneNumber: booking.phone,
        customerName: booking.name,
        status: 'active',
        createdAt: new Date().toISOString()
      };
      setOutboundCalls(prev => [newCall, ...prev]);
      setActiveTab('outbound');
    } catch (err) {
      alert('Failed to initiate AI call. Please check VAPI configuration.');
    } finally {
      setIsCalling(null);
    }
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      const rows: CSVRow[] = lines.slice(1).filter(l => l.trim()).map(line => {
        const values = line.split(',').map(v => v.trim());
        const rowData: any = {};
        headers.forEach((h, idx) => {
          if (h.includes('name')) rowData.name = values[idx];
          if (h.includes('phone')) rowData.phone = values[idx];
          if (h.includes('email')) rowData.email = values[idx];
          if (h.includes('service')) rowData.service_type = values[idx];
          if (h.includes('address')) rowData.address = values[idx];
          if (h.includes('suburb')) rowData.suburb = values[idx];
          if (h.includes('date')) rowData.date = values[idx];
          if (h.includes('time')) rowData.time = values[idx];
          if (h.includes('note')) rowData.notes = values[idx];
        });
        let error = '';
        if (!rowData.name || (!rowData.phone && !rowData.email) || !rowData.address || !rowData.suburb || !rowData.date || !rowData.time) {
          error = "Missing required fields";
        }
        return { ...rowData, isValid: !error, error };
      });
      setImportRows(rows);
      setShowImportModal(true);
    };
    reader.readAsText(file);
  };

  const commitImport = () => {
    importRows.filter(r => r.isValid).forEach(row => {
      onAddBooking({
        name: row.name, phone: row.phone, email: row.email,
        service_type: row.service_type || 'Repair / Maintenance',
        description: row.notes || 'CSV Import',
        address: row.address, suburb: row.suburb,
        preferred_date_time: `${row.date} ${row.time}`
      });
    });
    setShowImportModal(false);
    setImportRows([]);
  };

  return (
    <div className="flex h-screen bg-white font-normal text-slate-700 overflow-hidden">
      <aside className="w-64 border-r border-slate-100 flex flex-col p-6 hidden lg:flex bg-slate-50/30 shrink-0">
        <div className="flex items-center space-x-3 px-2 mb-10">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" /></svg>
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">ArcticFlow</span>
        </div>
        <nav className="flex-grow space-y-1">
          <NavItem id="dashboard" activeTab={activeTab} setActiveTab={setActiveTab} label="Overview" icon={<IconDashboard />} />
          <NavItem id="bookings" activeTab={activeTab} setActiveTab={setActiveTab} label="Dispatch Ledger" icon={<IconBookings />} />
          <NavItem id="calendar" activeTab={activeTab} setActiveTab={setActiveTab} label="Capacity Planner" icon={<IconCalendar />} />
          <NavItem id="staff" activeTab={activeTab} setActiveTab={setActiveTab} label="Personnel Registry" icon={<IconStaff />} />
          <NavItem id="revenue" activeTab={activeTab} setActiveTab={setActiveTab} label="Financial Registry" icon={<IconRevenue />} />
          <div className="pt-6 pb-2 px-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Automation</div>
          <NavItem id="outbound" activeTab={activeTab} setActiveTab={setActiveTab} label="Voice Outbound" icon={<IconAgent />} />
          <NavItem id="agent" activeTab={activeTab} setActiveTab={setActiveTab} label="AI Directives" icon={<IconAgent />} />
          <NavItem id="settings" activeTab={activeTab} setActiveTab={setActiveTab} label="Business Profile" icon={<IconSettings />} />
        </nav>
        <button onClick={onLogout} className="mt-auto flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all font-bold text-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          <span>System Logout</span>
        </button>
      </aside>

      <div className="flex-grow flex flex-col min-w-0">
        <header className="h-20 flex items-center justify-between px-8 border-b border-slate-100 shrink-0">
          <h2 className="text-lg font-bold text-slate-900 capitalize tracking-tight">{activeTab.replace('_', ' ')}</h2>
          <div className="flex gap-2">
            <input type="file" ref={csvInputRef} accept=".csv" className="hidden" onChange={handleCSVUpload} />
            <button onClick={() => csvInputRef.current?.click()} className="bg-white border border-slate-200 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">Bulk CSV Import</button>
            <button onClick={() => setShowBookingForm(true)} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/10">Manual Booking</button>
          </div>
        </header>

        <main className="flex-grow overflow-y-auto p-8 custom-scrollbar">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-10 animate-in fade-in duration-500">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard label="Pipeline Value" value={`$${stats.invoiced.toLocaleString()}`} color="blue" />
                  <StatCard label="Funds Collected" value={`$${stats.paid.toLocaleString()}`} color="emerald" />
                  <StatCard label="Personnel Active" value={stats.activeTechnicians} color="slate" />
                  <StatCard label="Pending Cases" value={stats.pendingJobs} color="amber" />
               </div>
               
               <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                  <div className="xl:col-span-2 bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
                     <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-widest">Recent Case Ledger</h3>
                     <div className="space-y-4">
                        {bookings.slice(0, 5).map(b => (
                          <div key={b.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                             <div className="flex items-center gap-4 cursor-pointer" onClick={() => onViewDetails(b.id)}>
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                                   {b.name.charAt(0)}
                                </div>
                                <div>
                                   <p className="text-sm font-bold text-slate-900">{b.name}</p>
                                   <p className="text-[10px] text-slate-400 font-medium">{b.preferred_date_time}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-3">
                                {b.status === 'New' && (
                                   <button 
                                      onClick={() => triggerOutboundCall(b)}
                                      disabled={isCalling === b.id}
                                      className="px-4 py-1.5 bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                                   >
                                      {isCalling === b.id ? 'Starting Call...' : 'Trigger AI Follow-up'}
                                   </button>
                                )}
                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${
                                    b.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                }`}>{b.status}</span>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
                  <div className="xl:col-span-1 bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl shadow-slate-200">
                     <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-6 opacity-60">System Intelligence</h3>
                     <p className="text-sm leading-relaxed mb-10 text-slate-400 font-normal">Your AI Dispatch agent is currently managing incoming requests and <span className="text-blue-400 font-bold">VAPI Outbound Calls</span> for confirmation.</p>
                     <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs p-4 bg-white/5 rounded-2xl">
                           <span>Agent Status</span>
                           <span className="text-emerald-400 font-black">ONLINE</span>
                        </div>
                        <div className="flex justify-between items-center text-xs p-4 bg-white/5 rounded-2xl">
                           <span>Calls Today</span>
                           <span className="font-black">{outboundCalls.length}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'outbound' && (
             <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-end">
                   <div>
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">AI Outbound Queue</h3>
                      <p className="text-sm text-slate-500">Monitoring real-time AI voice interactions with customers.</p>
                   </div>
                </div>
                
                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                         <tr>
                            <th className="px-8 py-6">VAPI Call ID</th>
                            <th className="px-8 py-6">Customer / Target</th>
                            <th className="px-8 py-6">Status</th>
                            <th className="px-8 py-6">Result Outcome</th>
                            <th className="px-8 py-6">Urgency</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {outboundCalls.length === 0 ? (
                            <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic">No voice interactions recorded in current session.</td></tr>
                         ) : outboundCalls.map(call => (
                            <tr key={call.id}>
                               <td className="px-8 py-6">
                                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">#{call.id.slice(-8)}</p>
                                  <p className="text-[10px] text-slate-400 mt-1">{new Date(call.createdAt).toLocaleTimeString()}</p>
                               </td>
                               <td className="px-8 py-6">
                                  <p className="text-sm font-bold text-slate-900">{call.customerName}</p>
                                  <p className="text-xs text-slate-500">{call.phoneNumber}</p>
                               </td>
                               <td className="px-8 py-6">
                                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                     call.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                                  }`}>{call.status}</span>
                               </td>
                               <td className="px-8 py-6">
                                  <p className="text-xs font-semibold text-slate-900">{call.result?.notes || 'Processing AI Summary...'}</p>
                                  {call.result?.booking_confirmed && <p className="text-[9px] font-bold text-emerald-600 uppercase mt-1">✓ Booking Confirmed</p>}
                               </td>
                               <td className="px-8 py-6">
                                  <span className={`text-[9px] font-black uppercase ${
                                     call.result?.urgency === 'high' ? 'text-red-500' : call.result?.urgency === 'medium' ? 'text-amber-500' : 'text-slate-400'
                                  }`}>{call.result?.urgency || 'N/A'}</span>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {activeTab === 'bookings' && (
             <div className="animate-in fade-in duration-500">
                <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                         <tr>
                            <th className="px-8 py-6">Identity / Record</th>
                            <th className="px-8 py-6">Service Type</th>
                            <th className="px-8 py-6">Schedule</th>
                            <th className="px-8 py-6">Settlement</th>
                            <th className="px-8 py-6">Status</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {bookings.map(b => {
                            const b_invoiced = b.lineItems.reduce((s, li) => s + li.amount, 0);
                            const b_paid = b.payments.reduce((s, p) => s + p.amount, 0);
                            return (
                            <tr key={b.id} className="hover:bg-slate-50 transition-colors group">
                               <td className="px-8 py-6 cursor-pointer" onClick={() => onViewDetails(b.id)}>
                                  <p className="text-sm font-bold text-slate-900">{b.name}</p>
                                  <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-1">Ref: #{b.id.toUpperCase()}</p>
                               </td>
                               <td className="px-8 py-6 text-sm text-slate-600">{b.service_type}</td>
                               <td className="px-8 py-6 text-sm font-semibold text-slate-900">{b.preferred_date_time}</td>
                               <td className="px-8 py-6">
                                  <p className="text-xs font-bold text-slate-900">${b_invoiced.toLocaleString()}</p>
                                  <p className={`text-[10px] font-medium ${b_invoiced - b_paid > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                    {b_invoiced - b_paid > 0 ? `$${(b_invoiced - b_paid).toLocaleString()} Due` : 'Paid'}
                                  </p>
                               </td>
                               <td className="px-8 py-6 flex items-center gap-3">
                                  {b.status === 'New' && (
                                     <button 
                                        onClick={() => triggerOutboundCall(b)}
                                        className="p-2 bg-blue-50 text-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-100"
                                        title="Initiate AI Voice Outreach"
                                     >
                                        <IconAgent />
                                     </button>
                                  )}
                                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                    b.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 
                                    b.status === 'In Progress' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                                  }`}>{b.status}</span>
                               </td>
                            </tr>
                         )})}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {activeTab === 'calendar' && (
            <div className="space-y-8 animate-in zoom-in duration-300">
               <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm overflow-x-auto">
                  <div className="min-w-[1000px]">
                    <div className="grid grid-cols-8 gap-4 mb-8">
                       <div className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Time (AEST)</div>
                       {Array.from({length: 7}).map((_, i) => {
                         const d = new Date();
                         d.setDate(new Date().getDate() + i);
                         return (
                           <div key={i} className="text-center">
                             <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{d.toLocaleDateString('en-AU', { weekday: 'short' })}</p>
                             <p className="text-lg font-bold text-slate-900">{d.toLocaleDateString('en-AU', { day: 'numeric' })}</p>
                           </div>
                         );
                       })}
                    </div>
                    {timeBlocks.map(time => (
                      <div key={time} className="grid grid-cols-8 gap-4 py-6 border-t border-slate-50 items-start">
                         <div className="text-xs font-bold text-slate-400 pt-1">{time}</div>
                         {Array.from({length: 7}).map((_, i) => {
                           const d = new Date();
                           d.setDate(new Date().getDate() + i);
                           const ds = d.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
                           const dtMatch = `${ds} ${time}`;
                           const jobs = bookings.filter(b => b.preferred_date_time === dtMatch && b.status !== 'Cancelled');
                           return (
                             <div key={i} className="min-h-[120px] rounded-2xl bg-slate-50/30 p-2 border-2 border-transparent transition-all flex flex-col gap-2 relative hover:bg-slate-50 hover:border-blue-100">
                               {jobs.map(j => (
                                 <div key={j.id} onClick={() => onViewDetails(j.id)} className={`p-3 rounded-xl border shadow-sm cursor-pointer transition-transform hover:scale-105 ${j.status === 'Completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-blue-600 border-blue-700 text-white'}`}>
                                    <p className="text-[10px] font-bold truncate">{j.name}</p>
                                    <p className="text-[8px] font-black uppercase tracking-widest mt-1 opacity-90">{j.status}</p>
                                 </div>
                               ))}
                               {jobs.length === 0 && (
                                 <div className="flex-grow flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                   <button onClick={() => { setNewBooking({ ...newBooking, date: ds, time }); setShowBookingForm(true); }} className="text-blue-500 font-bold">+</button>
                                 </div>
                               )}
                             </div>
                           );
                         })}
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'staff' && (
             <div className="space-y-8 animate-in fade-in duration-500">
                <div className="flex justify-between items-end">
                   <div>
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Active Force Registry</h3>
                      <p className="text-sm text-slate-500">Manage field technicians and administrative access.</p>
                   </div>
                   <button onClick={() => setShowStaffForm(true)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black shadow-lg">Enlist Personnel</button>
                </div>
                
                <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                         <tr>
                            <th className="px-8 py-6">Name / Role</th>
                            <th className="px-8 py-6">Specialization</th>
                            <th className="px-8 py-6">ARC License</th>
                            <th className="px-8 py-6">Registry Status</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {staff.map(s => (
                            <tr key={s.id}>
                               <td className="px-8 py-6">
                                  <p className="text-sm font-bold text-slate-900">{s.name}</p>
                                  <p className="text-[10px] font-medium text-slate-400 uppercase mt-1">{s.role} User</p>
                               </td>
                               <td className="px-8 py-6 text-sm font-medium text-slate-600">{s.teamType} Unit</td>
                               <td className="px-8 py-6 text-xs font-bold text-blue-600">{s.arcLicense || 'N/A'}</td>
                               <td className="px-8 py-6">
                                  <button onClick={() => onToggleStaff(s.id)} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] transition-all ${
                                    s.active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'
                                  }`}>
                                    {s.active ? 'ACTIVE' : 'DEACTIVATED'}
                                  </button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          )}

          {activeTab === 'revenue' && (
             <div className="space-y-10 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
                      <h3 className="text-lg font-bold text-slate-900 mb-8 tracking-tight">Financial Aggregation</h3>
                      <div className="space-y-6">
                         {bookings.map(b => (
                           <div key={b.id} className="flex justify-between items-center p-5 rounded-2xl bg-slate-50/50 border border-slate-100">
                              <div>
                                 <p className="text-sm font-bold text-slate-900">{b.name}</p>
                                 <p className="text-[10px] text-slate-400 font-medium">Recorded: {new Date(b.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-sm font-bold text-slate-900">${b.lineItems.reduce((s, li) => s + li.amount, 0).toLocaleString()}</p>
                                 <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                   Paid: ${b.payments.reduce((s, p) => s + p.amount, 0).toLocaleString()}
                                 </p>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                   <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col justify-center h-fit">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Uncollected Funds</p>
                      <h3 className="text-5xl font-black tracking-tighter text-amber-400 mb-2">${stats.balance.toLocaleString()}</h3>
                      <p className="text-xs text-slate-400 font-normal">Across {bookings.filter(b => b.lineItems.reduce((s, li) => s+li.amount,0) > b.payments.reduce((s, p) => s+p.amount,0)).length} open accounts.</p>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'agent' && (
             <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
                   <div className="flex justify-between items-end mb-8">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Behavioral Master File</h3>
                        <p className="text-sm text-slate-500">Modify the core intelligence guiding AI dispatch operations.</p>
                      </div>
                      <button onClick={() => setMasterPrompt(masterPrompt)} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-all">Propagate Changes</button>
                   </div>
                   <textarea 
                     className="w-full h-[500px] bg-slate-50 p-8 rounded-[2rem] border-none outline-none font-mono text-xs leading-relaxed text-slate-600 focus:ring-4 focus:ring-blue-50 transition-all shadow-inner"
                     value={masterPrompt}
                     onChange={(e) => setMasterPrompt(e.target.value)}
                   />
                </div>
             </div>
          )}

          {activeTab === 'settings' && (
             <div className="space-y-8 animate-in fade-in duration-500">
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm max-w-2xl mx-auto">
                   <h3 className="text-2xl font-bold text-slate-900 mb-10 tracking-tight">Organization Profile</h3>
                   <div className="space-y-8">
                      <SettingField label="Business Entity Name" value={businessSettings.name} onChange={(v) => setBusinessSettings({...businessSettings, name: v})} />
                      <SettingField label="Headquarters Address" value={businessSettings.address} onChange={(v) => setBusinessSettings({...businessSettings, address: v})} />
                      <div className="grid grid-cols-2 gap-6">
                        <SettingField label="Primary Contact Phone" value={businessSettings.phone} onChange={(v) => setBusinessSettings({...businessSettings, phone: v})} />
                        <SettingField label="Admin Contact Email" value={businessSettings.email} onChange={(v) => setBusinessSettings({...businessSettings, email: v})} />
                      </div>
                      <SettingField label="Tax Identification (ABN/ACN)" value={businessSettings.taxId} onChange={(v) => setBusinessSettings({...businessSettings, taxId: v})} />
                   </div>
                </div>
             </div>
          )}
        </main>
      </div>

      {/* Manual Booking Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-xl font-bold mb-6 tracking-tight">Manual Dispatch Entry</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              onAddBooking({ ...newBooking, preferred_date_time: `${newBooking.date} ${newBooking.time}` });
              setShowBookingForm(false);
            }} className="space-y-4">
              <input required placeholder="Client Full Name" className="w-full p-4 bg-slate-50 rounded-xl outline-none" value={newBooking.name} onChange={e => setNewBooking({...newBooking, name: e.target.value})} />
              <input required placeholder="Contact Number" className="w-full p-4 bg-slate-50 rounded-xl outline-none" value={newBooking.phone} onChange={e => setNewBooking({...newBooking, phone: e.target.value})} />
              <input required placeholder="Service Location Address" className="w-full p-4 bg-slate-50 rounded-xl outline-none" value={newBooking.address} onChange={e => setNewBooking({...newBooking, address: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input required type="date" className="w-full p-4 bg-slate-50 rounded-xl outline-none" value={newBooking.date} onChange={e => setNewBooking({...newBooking, date: e.target.value})} />
                <select className="w-full p-4 bg-slate-50 rounded-xl outline-none" value={newBooking.time} onChange={e => setNewBooking({...newBooking, time: e.target.value})}>
                  {timeBlocks.map(t => <option key={t} value={t}>{t} AEST</option>)}
                </select>
              </div>
              <textarea placeholder="Job Diagnostics / Operational Notes" className="w-full p-4 bg-slate-50 rounded-xl outline-none h-24" value={newBooking.description} onChange={e => setNewBooking({...newBooking, description: e.target.value})} />
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowBookingForm(false)} className="flex-grow font-bold text-slate-400">Cancel</button>
                <button type="submit" className="flex-grow py-4 bg-blue-600 text-white rounded-xl font-bold shadow-xl shadow-blue-500/10">Initialize Dispatch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Enlistment Modal */}
      {showStaffForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-xl font-bold mb-6 tracking-tight">Personnel Registry Entry</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              onAddStaff(newStaff);
              setShowStaffForm(false);
            }} className="space-y-4">
              <input required placeholder="Personnel Full Name" className="w-full p-4 bg-slate-50 rounded-xl outline-none" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Login Username" className="w-full p-4 bg-slate-50 rounded-xl outline-none" value={newStaff.username} onChange={e => setNewStaff({...newStaff, username: e.target.value})} />
                <input required type="password" placeholder="Secure Password" className="w-full p-4 bg-slate-50 rounded-xl outline-none" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select className="w-full p-4 bg-slate-50 rounded-xl outline-none" value={newStaff.teamType} onChange={e => setNewStaff({...newStaff, teamType: e.target.value as TeamType})}>
                  <option value="Repair">Repair Specialist</option>
                  <option value="Installation">Installation Specialist</option>
                </select>
                <input placeholder="ARC License #" className="w-full p-4 bg-slate-50 rounded-xl outline-none" value={newStaff.arcLicense} onChange={e => setNewStaff({...newStaff, arcLicense: e.target.value})} />
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowStaffForm(false)} className="flex-grow font-bold text-slate-400">Cancel</button>
                <button type="submit" className="flex-grow py-4 bg-slate-900 text-white rounded-xl font-bold shadow-xl shadow-slate-200/20">Commit Registry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6">
           <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in">
              <header className="p-10 border-b border-slate-50">
                <h3 className="text-2xl font-black text-slate-900">Verify Import Schema</h3>
                <p className="text-sm text-slate-500">Processing {importRows.length} potential records.</p>
              </header>
              <div className="flex-grow overflow-y-auto p-10">
                <table className="w-full text-left text-sm">
                  <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 sticky top-0">
                    <tr><th className="px-4 py-2">Sync Check</th><th className="px-4 py-2">Name</th><th className="px-4 py-2">Schedule</th><th className="px-4 py-2">Location</th></tr>
                  </thead>
                  <tbody>
                    {importRows.map((r, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        <td className="px-4 py-3">
                          <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${r.isValid ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                            {r.isValid ? 'Verified' : 'Invalid'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">{r.name}</td>
                        <td className="px-4 py-3 text-slate-500">{r.date} {r.time}</td>
                        <td className="px-4 py-3 text-xs">{r.address}, {r.suburb}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <footer className="p-10 bg-slate-50 rounded-b-[3rem] flex justify-between">
                <button onClick={() => setShowImportModal(false)} className="font-bold text-slate-400">Discard</button>
                <button onClick={commitImport} className="px-10 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-xl shadow-blue-500/20">Sync Data</button>
              </footer>
           </div>
        </div>
      )}
    </div>
  );
};

const NavItem = ({ id, label, icon, activeTab, setActiveTab }: any) => (
  <button onClick={() => setActiveTab(id)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === id ? 'bg-white text-blue-600 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
    <span className={activeTab === id ? 'text-blue-600' : 'text-slate-400'}>{icon}</span>
    <span className="text-sm tracking-tight">{label}</span>
  </button>
);

const SettingField = ({ label, value, onChange }: any) => (
  <div>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">{label}</p>
    <input 
      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-50 outline-none transition-all font-semibold text-slate-900" 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
    />
  </div>
);

const StatCard = ({ label, value, color }: { label: string, value: string | number, color: string }) => {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    slate: 'text-slate-900',
    amber: 'text-amber-600',
    indigo: 'text-indigo-600'
  };
  return (
    <div className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-sm">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-3xl font-black tracking-tighter ${colorMap[color]}`}>{value}</p>
    </div>
  );
};

const IconDashboard = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const IconBookings = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
const IconCalendar = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 00-2 2z" /></svg>;
const IconStaff = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const IconRevenue = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16v1m-3-9h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconAgent = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const IconSettings = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>;

export default AdminDashboard;
