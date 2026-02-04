
import React, { useState, useRef } from 'react';
import { Booking, Staff, JobStatus, CompletionReport, Attachment, InternalNote, Payment, LineItem, BusinessSettings } from '../types';

interface StaffBookingDetailsProps {
  booking: Booking;
  staff: Staff[];
  businessSettings: BusinessSettings;
  onUpdate: (updated: Booking) => void;
  onBack: () => void;
}

const StaffBookingDetails: React.FC<StaffBookingDetailsProps> = ({ booking, staff, businessSettings, onUpdate, onBack }) => {
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [newInternalNote, setNewInternalNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [paymentData, setPaymentData] = useState({ amount: '', method: 'Cash', note: '' });
  const [laborHoursInput, setLaborHoursInput] = useState(booking.laborHours?.toString() || '');
  const [selectedEquipment, setSelectedEquipment] = useState('');

  const [reportForm, setReportForm] = useState<Partial<CompletionReport>>({
    workPerformed: '', partsUsed: [], systemBrand: '', systemModel: '', serialNumber: '', capacityKw: '', refrigerantType: 'R32', refrigerantAmountKg: 0,
    safetyChecks: { electrical: false, leakCheck: false, pressureTest: false, airflowBalanced: false, mountingSecure: false },
    technicianNotes: '', customerName: '', customerSignature: '', photos: []
  });

  const currentTechnician = staff.find(s => booking.assignedStaffIds.includes(s.id));

  const handleUpdate = async (updated: Booking) => {
    setIsSubmitting(true);
    try {
      // Simulate network persistence
      await new Promise(resolve => setTimeout(resolve, 800));
      onUpdate(updated);
      setIsSubmitting(false);
    } catch (e) {
      alert("System Sync Failure. Please verify your connection.");
      setIsSubmitting(false);
    }
  };

  const updateLabor = () => {
    const hours = parseFloat(laborHoursInput);
    if (isNaN(hours)) return;
    handleUpdate({ ...booking, laborHours: hours });
  };

  const addEquipment = () => {
    if (!selectedEquipment.trim()) return;
    const current = booking.equipmentUsed || [];
    handleUpdate({ ...booking, equipmentUsed: [...current, selectedEquipment.trim()] });
    setSelectedEquipment('');
  };

  const removeEquipment = (index: number) => {
    const current = [...(booking.equipmentUsed || [])];
    current.splice(index, 1);
    handleUpdate({ ...booking, equipmentUsed: current });
  };

  const addInternalNote = () => {
    if (!newInternalNote.trim()) return;
    const author = currentTechnician?.name || 'Field Technician';
    const note: InternalNote = {
      id: Math.random().toString(36).substr(2, 5),
      text: newInternalNote, author,
      timestamp: new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', dateStyle: 'short', timeStyle: 'short' }).format(new Date())
    };
    const updated = { ...booking, internalNotes: [note, ...(booking.internalNotes || [])] };
    handleUpdate(updated);
    setNewInternalNote('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const newAttachment: Attachment = {
        id: Math.random().toString(36).substr(2, 5),
        name: file.name, type: file.type.startsWith('image') ? 'image' : 'document',
        url: base64, uploadedAt: new Date().toISOString()
      };
      handleUpdate({ ...booking, attachments: [...(booking.attachments || []), newAttachment] });
    };
    reader.readAsDataURL(file);
  };

  const recordFieldPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentData.amount);
    if (isNaN(amount) || amount <= 0) return;
    const newPay: Payment = { id: Math.random().toString(36).substr(2, 5), amount, method: paymentData.method, date: new Date().toISOString(), note: paymentData.note, recordedBy: currentTechnician?.name || 'Field Technician' };
    handleUpdate({ ...booking, payments: [...(booking.payments || []), newPay] });
    setShowPaymentForm(false);
    setPaymentData({ amount: '', method: 'Cash', note: '' });
  };

  const handleCompletionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.safetyChecks?.electrical) { alert("Mandatory Safety Check Required: Electrical Standards"); return; }
    if (!reportForm.customerSignature) { alert("Mandatory: Customer Digital Verification Seal"); return; }

    const finalReport: CompletionReport = {
      ...(reportForm as CompletionReport),
      arcLicense: currentTechnician?.arcLicense || 'N/A',
      completedAt: new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', dateStyle: 'full', timeStyle: 'short' }).format(new Date()),
    };

    await handleUpdate({ ...booking, status: 'Completed', completionReport: finalReport });
    setShowCompletionForm(false);
  };

  const openMaps = () => {
    const { address, suburb } = booking.location;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, ${suburb}, Canberra`)}`, '_blank');
  };

  const totalInvoiced = booking.lineItems.reduce((s, i) => s + i.amount, 0);
  const totalPaid = booking.payments.reduce((s, p) => s + p.amount, 0);
  const balanceDue = totalInvoiced - totalPaid;

  return (
    <div className="min-h-screen bg-white font-normal text-slate-700 pb-32">
      <div className="sticky top-0 z-40 bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between shadow-sm">
        <button onClick={onBack} className="text-slate-400 p-2 active:scale-90 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="flex flex-col items-center">
           <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Dispatch ID: #{booking.id.toUpperCase()}</span>
           {isSubmitting && <span className="text-[8px] font-bold text-blue-600 animate-pulse">SYNCING TO CLOUD...</span>}
        </div>
        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-blue-600 active:scale-90 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
      </div>

      <div className="px-6 py-8 space-y-12 max-w-lg mx-auto">
        <section>
          <div className="flex justify-between items-start">
             <div><p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1.5">Profile</p><h2 className="text-3xl font-bold text-slate-900 leading-tight">{booking.preferred_date_time.split(' ')[0]}<br /><span className="text-blue-600 font-black">{booking.preferred_date_time.split(' ')[1]} AEST</span></h2></div>
             <span className={`px-4 py-1.5 rounded-full text-white text-[10px] font-bold uppercase tracking-widest shadow-lg ${booking.status === 'Completed' ? 'bg-emerald-600' : 'bg-blue-600'}`}>{booking.status}</span>
          </div>
        </section>

        <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl">
           <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-6">Field Resource Registry</p>
           <div className="space-y-8">
              <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Labour Hours</label><div className="flex gap-2"><input type="number" step="0.5" className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold" value={laborHoursInput} onChange={e => setLaborHoursInput(e.target.value)} /><button onClick={updateLabor} className="px-6 py-3 bg-blue-600 rounded-xl font-bold text-[10px] uppercase">Sync</button></div></div>
              
              <div>
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Equipment Installed</label>
                 <div className="flex gap-2 mb-4">
                    <select 
                      className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                      value={selectedEquipment}
                      onChange={e => setSelectedEquipment(e.target.value)}
                    >
                       <option value="" className="text-slate-900">Select Hardware...</option>
                       {businessSettings.equipmentCatalog.map((item, idx) => (
                         <option key={idx} value={item.model} className="text-slate-900">{item.model} — ${item.cost}</option>
                       ))}
                       <option value="CUSTOM_ENTRY" className="text-slate-900 italic">+ Manual Entry...</option>
                    </select>
                    <button onClick={addEquipment} className="px-6 py-3 bg-blue-600 rounded-xl font-bold text-[10px] uppercase">Log</button>
                 </div>

                 {selectedEquipment === 'CUSTOM_ENTRY' && (
                   <div className="mb-4 animate-in slide-in-from-top-2">
                     <input 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm" 
                        placeholder="Type hardware name manually..." 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value;
                            if (val) {
                              handleUpdate({ ...booking, equipmentUsed: [...(booking.equipmentUsed || []), val] });
                              setSelectedEquipment('');
                            }
                          }
                        }}
                     />
                     <p className="text-[9px] text-slate-400 mt-1 ml-1">Press Enter to register custom hardware</p>
                   </div>
                 )}

                 <div className="space-y-2">
                    {booking.equipmentUsed?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-xs font-medium">{item}</span>
                        <button onClick={() => removeEquipment(idx)} className="text-red-400 text-[10px] font-black uppercase">Remove</button>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </section>

        <section className="bg-emerald-50/30 p-8 rounded-[2.5rem] border border-emerald-100/50">
          <div className="flex justify-between items-end mb-8"><div><p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-1.5">Settlement Ledger</p><h4 className="text-2xl font-bold text-slate-900 tracking-tight">Job Financials</h4></div><div className="text-right"><p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Due</p><p className={`text-xl font-black ${balanceDue > 0 ? 'text-amber-500' : 'text-emerald-600'}`}>${balanceDue.toLocaleString()}</p></div></div>
          <div className="space-y-4 mb-8">{booking.lineItems.map(item => (<div key={item.id} className="flex justify-between text-xs py-2 border-b border-emerald-100/30"><span className="text-slate-600">{item.description}</span><span className="font-bold text-slate-900">${item.amount.toLocaleString()}</span></div>))}</div>
          <div className="pt-6 border-t border-emerald-100/50">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Payment Receipts</p>
             <div className="space-y-2 mb-6">{booking.payments.map(p => (<div key={p.id} className="flex justify-between items-center text-[10px] p-3 bg-white/60 rounded-xl border"><div><span className="font-bold text-emerald-700">${p.amount}</span><span className="text-slate-400 ml-2">via {p.method}</span></div><span className="text-slate-300">{new Date(p.date).toLocaleDateString()}</span></div>))}</div>
             {balanceDue > 0 && <button onClick={() => setShowPaymentForm(true)} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-emerald-100">Report Field Payment</button>}
          </div>
        </section>

        <section className="space-y-6"><div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Location</p><p className="text-xl font-semibold text-slate-900">{booking.location.address}<br />{booking.location.suburb}</p></div><button onClick={openMaps} className="w-full flex items-center justify-center gap-3 py-5 bg-slate-900 text-white rounded-3xl text-xs font-bold uppercase tracking-widest shadow-xl">Launch Navigation</button></section>

        <section className="pt-8 border-t border-slate-50">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Field Journal</p>
           <div className="space-y-4 mb-8">{booking.internalNotes?.map(note => (<div key={note.id} className="bg-slate-50/50 p-5 rounded-[1.5rem] border border-slate-100 shadow-sm"><div className="flex justify-between items-center mb-2"><span className="text-[10px] font-black text-slate-900 uppercase">{note.author}</span><span className="text-[9px] text-slate-400 font-bold">{note.timestamp}</span></div><p className="text-sm text-slate-700 leading-relaxed">{note.text}</p></div>))}</div>
           <div className="space-y-4"><textarea className="w-full bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-sm outline-none focus:ring-4 focus:ring-blue-50 h-32 shadow-inner" placeholder="Log site observations..." value={newInternalNote} onChange={e => setNewInternalNote(e.target.value)} /><button onClick={addInternalNote} className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase">Sync to Journal</button></div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex gap-4 z-40 shadow-2xl">
        {booking.status !== 'Completed' && (
          <>
            {booking.status !== 'In Progress' ? (
              <button disabled={isSubmitting} onClick={() => handleUpdate({...booking, status: 'In Progress'})} className="flex-grow py-5 bg-blue-600 text-white rounded-3xl text-sm font-bold shadow-2xl uppercase tracking-widest active:scale-[0.98] disabled:opacity-50">Commence Job</button>
            ) : (
              <button disabled={isSubmitting} onClick={() => setShowCompletionForm(true)} className="flex-grow py-5 bg-emerald-600 text-white rounded-3xl text-sm font-bold shadow-2xl uppercase tracking-widest active:scale-[0.98] disabled:opacity-50">Job Done / Close File</button>
            )}
          </>
        )}
      </div>

      {showPaymentForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6 animate-in zoom-in">
           <div className="bg-white rounded-[3rem] w-full max-sm p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-8"><h3 className="text-xl font-black text-slate-900 uppercase">Field Payment</h3><button onClick={() => setShowPaymentForm(false)} className="text-slate-300">✕</button></div>
              <form onSubmit={recordFieldPayment} className="space-y-6">
                 <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">Amount ($)</label><input type="number" required placeholder="0.00" className="w-full bg-slate-50 p-4 rounded-xl text-lg font-bold outline-none border-none shadow-inner" value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: e.target.value})} /></div>
                 <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">Method</label><select className="w-full bg-slate-50 p-4 rounded-xl text-sm font-bold border-none outline-none shadow-inner" value={paymentData.method} onChange={e => setPaymentData({...paymentData, method: e.target.value})}><option value="Cash">Cash Handling</option><option value="EFT POS">EFT POS</option><option value="Direct Deposit">Bank Transfer</option></select></div>
                 <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] shadow-xl">Submit Registry</button>
              </form>
           </div>
        </div>
      )}

      {showCompletionForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-6 animate-in zoom-in">
           <div className="bg-white rounded-[3rem] w-full max-sm h-full max-h-[80vh] overflow-y-auto p-10 shadow-2xl custom-scrollbar">
              <div className="flex justify-between items-center mb-10"><h3 className="text-2xl font-black text-slate-900 tracking-tight">Final Registry</h3><button onClick={() => setShowCompletionForm(false)} className="text-slate-300">✕</button></div>
              <form onSubmit={handleCompletionSubmit} className="space-y-10">
                 <div className="space-y-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Hardware Record</p>
                    <input required className="w-full bg-slate-50 p-4 rounded-xl text-sm font-bold border-none outline-none shadow-inner" placeholder="System Brand" value={reportForm.systemBrand} onChange={e => setReportForm({...reportForm, systemBrand: e.target.value})} />
                    <input required className="w-full bg-slate-50 p-4 rounded-xl text-sm font-bold border-none outline-none shadow-inner" placeholder="Model ID" value={reportForm.systemModel} onChange={e => setReportForm({...reportForm, systemModel: e.target.value})} />
                 </div>
                 <div className="space-y-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Safety Declaration</p>
                    <label className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl cursor-pointer active:scale-95 transition-all"><input type="checkbox" required className="w-5 h-5 rounded" checked={reportForm.safetyChecks?.electrical} onChange={e => setReportForm({...reportForm, safetyChecks: {...reportForm.safetyChecks!, electrical: e.target.checked}})} /><span className="text-[10px] font-black uppercase text-slate-600 tracking-wide">Electrical Compliance Verify</span></label>
                 </div>
                 <div className="space-y-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Digital Seal</p>
                    <input required className="w-full bg-slate-50 p-4 rounded-xl text-sm font-bold border-none outline-none shadow-inner" placeholder="Client Signatory Name" value={reportForm.customerName} onChange={e => setReportForm({...reportForm, customerName: e.target.value})} />
                    <button type="button" onClick={() => setReportForm({...reportForm, customerSignature: 'Verified_Field_Seal_ID_'+Date.now()})} className={`w-full py-5 rounded-2xl border-2 border-dashed transition-all font-black text-[10px] uppercase tracking-widest ${reportForm.customerSignature ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>{reportForm.customerSignature ? 'Seal Verified ✓' : 'Add Digital Signature Seal'}</button>
                 </div>
                 <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black shadow-2xl uppercase tracking-widest hover:bg-black disabled:opacity-50">Sync Final Record</button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default StaffBookingDetails;
