
import React, { useState, useEffect, useMemo } from 'react';
import { Page, Booking, Staff, User, JobStatus, TeamType, BusinessSettings } from './types';
import { INITIAL_PROMPT, MOCK_BOOKINGS, MOCK_STAFF, DEFAULT_BUSINESS_SETTINGS } from './constants';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import AdminBookingDetails from './pages/AdminBookingDetails';
import StaffBookingDetails from './pages/StaffBookingDetails';
import Login from './pages/Login';
import Header from './components/Header';
import Footer from './components/Footer';
import ChatAssistant from './components/ChatAssistant';
import VoiceModal from './components/VoiceModal';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('hvac_bookings');
    const parsed = saved ? JSON.parse(saved) : MOCK_BOOKINGS;
    return parsed.map((b: any) => ({
      ...b,
      lineItems: b.lineItems || [],
      payments: b.payments || [],
      isInvoiced: b.isInvoiced || false,
      attachments: b.attachments || [],
      internalNotes: Array.isArray(b.internalNotes) ? b.internalNotes : []
    }));
  });
  
  const [staff, setStaff] = useState<Staff[]>(() => {
    const saved = localStorage.getItem('hvac_staff');
    return saved ? JSON.parse(saved) : MOCK_STAFF;
  });

  const [masterPrompt, setMasterPrompt] = useState<string>(() => {
    return localStorage.getItem('hvac_master_prompt') || INITIAL_PROMPT;
  });

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(() => {
    const saved = localStorage.getItem('hvac_business_settings');
    return saved ? JSON.parse(saved) : DEFAULT_BUSINESS_SETTINGS;
  });

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('hvac_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('hvac_staff', JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem('hvac_business_settings', JSON.stringify(businessSettings));
  }, [businessSettings]);

  const getSydneyTime = () => {
    return new Date(new Intl.DateTimeFormat('en-US', {
      timeZone: 'Australia/Sydney',
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false
    }).format(new Date()));
  };

  const checkAvailability = (dateTime: string, teamType: TeamType) => {
    const relevantStaff = staff.filter(s => s.active && s.teamType === teamType && s.role === 'Staff');
    const bookedAtTime = bookings.filter(b => b.preferred_date_time === dateTime && b.status !== 'Cancelled');
    const availableStaff = relevantStaff.filter(s => !bookedAtTime.some(b => b.assignedStaffIds.includes(s.id)));
    return availableStaff;
  };

  const addBooking = (newBooking: any) => {
    const rawAddress = newBooking.address || (newBooking.location?.address) || (typeof newBooking.location === 'string' ? newBooking.location : '');
    const rawSuburb = newBooking.suburb || (newBooking.location?.suburb) || '';
    const dateTime = newBooking.preferred_date_time;

    const isDuplicate = bookings.some(b => 
      b.name.toLowerCase() === newBooking.name.toLowerCase() &&
      b.location.address.toLowerCase() === rawAddress.toLowerCase() &&
      b.preferred_date_time === dateTime &&
      b.status !== 'Cancelled'
    );

    if (isDuplicate) return;

    const teamType: TeamType = newBooking.team_type || 
      (newBooking.service_type?.toLowerCase().includes('installation') ? 'Installation' : 'Repair');

    let assignedIds = newBooking.assignedStaffIds || [];
    if (assignedIds.length === 0) {
      const availableStaff = checkAvailability(dateTime, teamType);
      assignedIds = availableStaff.length > 0 ? [availableStaff[0].id] : [];
    }

    const booking: Booking = {
      ...newBooking,
      id: Math.random().toString(36).substr(2, 9),
      name: newBooking.name || 'Unknown Client',
      phone: newBooking.phone || 'N/A',
      email: newBooking.email || '',
      service_type: newBooking.service_type || 'Repair / Maintenance',
      description: newBooking.description || 'No description provided.',
      team_type: teamType,
      status: assignedIds.length > 0 ? 'Assigned' : 'New',
      createdAt: getSydneyTime().toISOString(),
      assignedStaffIds: assignedIds,
      location: { address: rawAddress, suburb: rawSuburb },
      lineItems: newBooking.lineItems || [],
      payments: newBooking.payments || [],
      isInvoiced: false,
      attachments: [],
      internalNotes: []
    };

    setBookings(prev => [booking, ...prev]);
  };

  const updateBooking = (updated: Booking) => {
    setBookings(prev => prev.map(b => b.id === updated.id ? updated : b));
  };

  const deleteBooking = (id: string) => {
    setBookings(prev => prev.filter(b => b.id !== id));
  };

  const getAvailabilitySummary = useMemo(() => {
    const next7Days = Array.from({length: 7}, (_, i) => {
      const d = getSydneyTime(); d.setDate(d.getDate() + i);
      return d.toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
    });
    let summary = "Availability (AEST 09:00-17:00):\n";
    next7Days.forEach(date => {
      summary += `${date}: `;
      ['09:00', '11:00', '13:00', '15:00'].forEach(time => {
        const dt = `${date} ${time}`;
        const rep = checkAvailability(dt, 'Repair').length;
        const ins = checkAvailability(dt, 'Installation').length;
        if (rep > 0 || ins > 0) summary += `[${time}: ${rep}R ${ins}I] `;
      });
      summary += "\n";
    });
    return summary;
  }, [bookings, staff]);

  const currentLocalTimeStr = new Intl.DateTimeFormat('en-AU', { dateStyle: 'full', timeStyle: 'long', timeZone: 'Australia/Sydney' }).format(new Date());
  const dynamicPrompt = masterPrompt.replace('{{AVAILABILITY_INFO}}', getAvailabilitySummary).replace('{{CURRENT_TIME}}', currentLocalTimeStr);

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 ${currentPage === Page.AdminDashboard ? 'bg-slate-50' : 'bg-white'}`}>
      {currentPage !== Page.AdminDashboard && (
        <Header currentPage={currentPage} user={currentUser} onNavigate={setCurrentPage} onCallClick={() => setIsVoiceOpen(true)} onLogout={() => { setCurrentUser(null); setCurrentPage(Page.Home); }} />
      )}
      <main className="flex-grow">
        {currentPage === Page.Home && <Home onOpenChat={() => setIsChatOpen(true)} onOpenVoice={() => setIsVoiceOpen(true)} />}
        {currentPage === Page.Login && <Login staff={staff} onLogin={(u) => { setCurrentUser(u); setCurrentPage(u.role === 'Admin' ? Page.AdminDashboard : Page.StaffDashboard); }} />}
        {currentPage === Page.AdminDashboard && currentUser?.role === 'Admin' && (
          <AdminDashboard 
            bookings={bookings} staff={staff} masterPrompt={masterPrompt} setMasterPrompt={setMasterPrompt}
            businessSettings={businessSettings} setBusinessSettings={setBusinessSettings}
            onViewDetails={(id) => { setSelectedBookingId(id); setCurrentPage(Page.BookingDetails); }}
            onDelete={deleteBooking} onAddStaff={(s) => setStaff(prev => [...prev, { ...s, id: 's'+Date.now(), active: true, status: 'Available' }])}
            onToggleStaff={(id) => setStaff(prev => prev.map(s => s.id === id ? {...s, active: !s.active} : s))}
            onAddBooking={addBooking} checkAvailability={checkAvailability} onLogout={() => { setCurrentUser(null); setCurrentPage(Page.Home); }}
            onUpdateBooking={updateBooking}
          />
        )}
        {currentPage === Page.StaffDashboard && currentUser?.role === 'Staff' && (
          <StaffDashboard user={currentUser} bookings={bookings.filter(b => b.assignedStaffIds.includes(currentUser.id))} onViewDetails={(id) => { setSelectedBookingId(id); setCurrentPage(Page.BookingDetails); }} />
        )}
        {currentPage === Page.BookingDetails && bookings.find(b => b.id === selectedBookingId) && (
          currentUser?.role === 'Admin' ? (
            <AdminBookingDetails booking={bookings.find(b => b.id === selectedBookingId)!} staff={staff} businessSettings={businessSettings} onUpdate={updateBooking} onBack={() => setCurrentPage(Page.AdminDashboard)} />
          ) : (
            <StaffBookingDetails booking={bookings.find(b => b.id === selectedBookingId)!} staff={staff} businessSettings={businessSettings} onUpdate={updateBooking} onBack={() => setCurrentPage(Page.StaffDashboard)} />
          )
        )}
      </main>
      {currentPage === Page.Home && <Footer />}
      {isChatOpen && <ChatAssistant masterPrompt={dynamicPrompt} onClose={() => setIsChatOpen(false)} onBookingComplete={addBooking} />}
      {isVoiceOpen && <VoiceModal masterPrompt={dynamicPrompt} onClose={() => setIsVoiceOpen(false)} onBookingComplete={addBooking} />}
    </div>
  );
};

export default App;
