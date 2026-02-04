
import React, { useState, useMemo } from 'react';
import { Booking, User, JobStatus } from '../types';

interface StaffDashboardProps {
  user: User;
  bookings: Booking[];
  onViewDetails: (id: string) => void;
}

const StaffDashboard: React.FC<StaffDashboardProps> = ({ user, bookings, onViewDetails }) => {
  const [view, setView] = useState<'agenda' | 'calendar'>('agenda');

  const todayISO = useMemo(() => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Australia/Sydney',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }, []);

  // SORTING: Earliest first (Upcoming jobs at the top)
  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => a.preferred_date_time.localeCompare(b.preferred_date_time));
  }, [bookings]);

  const getStatusStyle = (status: JobStatus) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'In Progress': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Assigned': return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const handleCall = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${phone}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-normal text-slate-700">
      <div className="bg-white border-b border-slate-200 px-4 py-6 sticky top-0 z-30 shadow-sm">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Field Dispatch</p>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{user.name}</h1>
              <p className="text-xs text-slate-500 font-medium">{user.teamType} Specialist</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timezone</p>
              <p className="text-xs font-semibold text-slate-700">AEST/AEDT</p>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner">
            <button 
              onClick={() => setView('agenda')} 
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all uppercase tracking-wider ${view === 'agenda' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              Agenda
            </button>
            <button 
              onClick={() => setView('calendar')} 
              className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all uppercase tracking-wider ${view === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              Weekly
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-lg mx-auto px-4 py-8">
        {view === 'agenda' ? (
          <div className="space-y-6">
            {sortedBookings.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-400 font-medium text-sm italic">No assignments detected.</p>
              </div>
            ) : (
              sortedBookings.map(booking => {
                const [date, time] = booking.preferred_date_time.split(' ');
                const isToday = date === todayISO;
                
                return (
                  <div 
                    key={booking.id} 
                    onClick={() => onViewDetails(booking.id)}
                    className={`bg-white rounded-3xl border shadow-sm overflow-hidden active:scale-[0.98] transition-all duration-300 ${isToday ? 'border-blue-200 ring-4 ring-blue-50' : 'border-slate-100'}`}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex flex-col">
                          <span className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5 ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
                            {isToday ? 'TODAY' : date}
                          </span>
                          <span className="text-xl font-bold text-slate-900 tracking-tight">{time} AEST</span>
                        </div>
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border ${getStatusStyle(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 mb-2">{booking.name}</h3>
                      <div className="flex items-start gap-2 mb-6 text-slate-500">
                        <svg className="w-5 h-5 mt-0.5 shrink-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <p className="text-sm font-normal leading-relaxed">{booking.location.address}, {booking.location.suburb}</p>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button 
                          onClick={(e) => handleCall(booking.phone, e)}
                          className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-600 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-50 transition-all uppercase tracking-widest"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          Call Client
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in duration-300">
            {Array.from({length: 7}).map((_, i) => {
              const d = new Date();
              d.setDate(d.getDate() + i);
              const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(d);
              const jobsToday = sortedBookings.filter(b => b.preferred_date_time.startsWith(dateStr));
              
              return (
                <div key={i} className="group">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-bold text-slate-900 uppercase tracking-widest">{d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                    <div className="h-px flex-grow bg-slate-200"></div>
                  </div>
                  
                  <div className="space-y-4">
                    {jobsToday.length > 0 ? (
                      jobsToday.map(j => (
                        <div 
                          key={j.id} 
                          onClick={() => onViewDetails(j.id)}
                          className={`p-5 rounded-2xl border bg-white flex justify-between items-center active:bg-slate-50 transition-all border-slate-100 shadow-sm ${j.status === 'In Progress' ? 'border-amber-200 bg-amber-50/20' : ''}`}
                        >
                          <div className="flex items-center gap-5">
                            <span className="text-xs font-bold text-slate-900 w-14 border-r border-slate-100">{j.preferred_date_time.split(' ')[1]}</span>
                            <div>
                              <p className="text-sm font-semibold text-slate-900 leading-tight">{j.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium truncate max-w-[160px] uppercase tracking-wide mt-1">{j.location.address}</p>
                            </div>
                          </div>
                          <svg className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </div>
                      ))
                    ) : (
                      <div className="px-5 py-3 rounded-xl bg-slate-50/50 border border-slate-100/50">
                        <p className="text-[10px] font-medium text-slate-400 italic uppercase tracking-widest">Available for dispatch</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default StaffDashboard;
