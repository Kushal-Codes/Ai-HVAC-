
import React, { useState, useMemo, useRef } from 'react';
import { Booking, Staff, JobStatus, LineItem, Payment, BusinessSettings, InternalNote, ServiceType } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface AdminBookingDetailsProps {
  booking: Booking;
  staff: Staff[];
  businessSettings: BusinessSettings;
  onUpdate: (updated: Booking) => void;
  onBack: () => void;
}

const AdminBookingDetails: React.FC<AdminBookingDetailsProps> = ({ booking, staff, businessSettings, onUpdate, onBack }) => {
  const [editedBooking, setEditedBooking] = useState<Booking>({ ...booking });
  const [isEditing, setIsEditing] = useState(false);
  const [newInternalNote, setNewInternalNote] = useState('');
  const [chargeName, setChargeName] = useState('');
  const [chargeAmount, setChargeAmount] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const invoiceRef = useRef<HTMLDivElement>(null);

  const financialDetails = useMemo(() => {
    const laborSub = (editedBooking.laborHours || 0) * businessSettings.hourlyRate;
    const equipSub = (editedBooking.equipmentUsed || []).reduce((sum, model) => {
      const entry = businessSettings.equipmentCatalog.find(e => e.model === model);
      return sum + (entry?.cost || 0);
    }, 0);
    const manualSub = editedBooking.lineItems
      .filter(li => !li.description.includes('Labour:') && !li.description.includes('Equipment:') && !li.description.includes('GST'))
      .reduce((s, li) => s + li.amount, 0);

    const subtotal = laborSub + equipSub + manualSub;
    const gst = subtotal * 0.1;
    const total = subtotal + gst;
    const paid = editedBooking.payments.reduce((s, p) => s + p.amount, 0);
    const balance = total - paid;

    return { laborSub, equipSub, manualSub, subtotal, gst, total, paid, balance };
  }, [editedBooking, businessSettings]);

  const handleReassign = (staffId: string) => {
    const newStaffMember = staff.find(s => s.id === staffId);
    const logNote = {
      id: Math.random().toString(36).substr(2, 5),
      text: `Personnel Reassignment: [${newStaffMember?.name || 'Unassigned'}]`,
      author: 'Admin Dashboard',
      timestamp: new Date().toISOString()
    };
    const updated = {
      ...editedBooking,
      assignedStaffIds: staffId ? [staffId] : [],
      status: staffId ? 'Assigned' : 'New' as JobStatus,
      internalNotes: [logNote, ...(editedBooking.internalNotes || [])]
    };
    setEditedBooking(updated);
    onUpdate(updated);
  };

  const commitCalculatedCharges = () => {
    const manualLines = editedBooking.lineItems.filter(li => 
      !li.description.includes('Labour:') && !li.description.includes('Equipment:') && !li.description.includes('GST')
    );
    const newItems: LineItem[] = [...manualLines];
    if (editedBooking.laborHours && editedBooking.laborHours > 0) {
      newItems.push({ id: 'L'+Date.now(), description: `Labour: ${editedBooking.laborHours}hrs @ $${businessSettings.hourlyRate}/hr`, amount: financialDetails.laborSub });
    }
    (editedBooking.equipmentUsed || []).forEach(model => {
      const cost = businessSettings.equipmentCatalog.find(e => e.model === model)?.cost || 0;
      newItems.push({ id: 'E'+Date.now()+Math.random(), description: `Equipment: ${model}`, amount: cost });
    });
    newItems.push({ id: 'G'+Date.now(), description: `GST (10%)`, amount: financialDetails.gst });
    const updated = { ...editedBooking, lineItems: newItems, isInvoiced: true };
    setEditedBooking(updated);
    onUpdate(updated);
  };

  const handleDownloadInvoice = async () => {
    if (!invoiceRef.current) return;
    setIsDownloading(true);
    
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 3, // Higher scale for better print quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice-${editedBooking.id.toUpperCase()}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditedBooking(prev => {
      const keys = field.split('.');
      if (keys.length > 1) {
        return { ...prev, [keys[0]]: { ...(prev as any)[keys[0]], [keys[1]]: value } };
      }
      return { ...prev, [field]: value };
    });
  };

  const saveBooking = () => { onUpdate(editedBooking); setIsEditing(false); };

  const addInternalNote = () => {
    if (!newInternalNote.trim()) return;
    const note: InternalNote = {
      id: Math.random().toString(36).substr(2, 5),
      text: newInternalNote, author: 'Admin HQ',
      timestamp: new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Sydney', dateStyle: 'short', timeStyle: 'short' }).format(new Date())
    };
    const updated = { ...editedBooking, internalNotes: [note, ...(editedBooking.internalNotes || [])] };
    setEditedBooking(updated); onUpdate(updated); setNewInternalNote('');
  };

  const addCharge = () => {
    const amount = parseFloat(chargeAmount);
    if (!chargeName || isNaN(amount)) return;
    const newItem: LineItem = { id: Math.random().toString(36).substr(2, 5), description: chargeName, amount };
    const updated = { ...editedBooking, lineItems: [...editedBooking.lineItems, newItem], isInvoiced: false };
    setEditedBooking(updated); onUpdate(updated); setChargeName(''); setChargeAmount('');
  };

  const addPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;
    const newPay: Payment = { id: Math.random().toString(36).substr(2, 5), amount, method: 'Office Receipt', date: new Date().toISOString(), note: paymentNote, recordedBy: 'HQ Admin' };
    const updated = { ...editedBooking, payments: [...editedBooking.payments, newPay] };
    setEditedBooking(updated); onUpdate(updated); setPaymentAmount(''); setPaymentNote('');
  };

  return (
    <div className="max-w-7xl mx-auto px-8 py-10 animate-in fade-in duration-500 font-normal text-slate-700">
      <div className="flex justify-between items-center mb-12">
        <button onClick={onBack} className="flex items-center text-slate-500 hover:text-slate-900 font-bold text-sm transition-colors group">
          <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Return to Ledger
        </button>
        <div className="flex gap-4">
          {!isEditing ? <button onClick={() => setIsEditing(true)} className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm">Edit Information</button> : <button onClick={saveBooking} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20">Commit Updates</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start mb-10">
               <div><h2 className="text-3xl font-black text-slate-900 mb-2">{editedBooking.name}</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 inline-block px-2 py-1 rounded">Ref: #{editedBooking.id.toUpperCase()}</p></div>
               <span className={`px-4 py-1.5 rounded-full text-white text-[10px] font-bold uppercase tracking-widest ${editedBooking.status === 'Completed' ? 'bg-emerald-600' : 'bg-blue-600'}`}>{editedBooking.status}</span>
            </div>

            <div className="grid grid-cols-2 gap-12 py-10 border-t border-slate-50">
               <section className="space-y-6">
                 <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Metadata Registry</p>
                 <EditableField isEditing={isEditing} label="Phone Contact" value={editedBooking.phone} onChange={(v) => handleFieldChange('phone', v)} />
                 <EditableField isEditing={isEditing} label="Service Address" value={editedBooking.location.address} onChange={(v) => handleFieldChange('location.address', v)} />
                 <EditableField isEditing={isEditing} label="Service Window" value={editedBooking.preferred_date_time} onChange={(v) => handleFieldChange('preferred_date_time', v)} />
               </section>
               <section className="space-y-6 p-8 bg-slate-50 rounded-3xl border border-slate-100">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel Assignment</p>
                 <div className="space-y-4">
                    <label className="text-[9px] font-bold text-slate-400 uppercase block">Assign Technician</label>
                    <select 
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                      value={editedBooking.assignedStaffIds[0] || ''}
                      onChange={(e) => handleReassign(e.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {staff.filter(s => s.role === 'Staff' && s.active).map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.teamType})</option>
                      ))}
                    </select>
                    {editedBooking.assignedStaffIds.length > 0 && (
                      <div className="pt-2 flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Personnel Synchronized</p>
                      </div>
                    )}
                 </div>
               </section>
            </div>
            
            <div className="pt-10 border-t border-slate-50">
               <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-4">Diagnostic Narrative</p>
               <p className="text-sm text-slate-600 leading-relaxed italic bg-slate-50/50 p-6 rounded-2xl border border-slate-50">"{editedBooking.description}"</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-8 border-b pb-4 tracking-tight">Internal Operational Journal</h3>
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                <textarea className="w-full bg-slate-50 p-6 rounded-2xl border-none outline-none text-sm h-24 shadow-inner" placeholder="Record confidential diagnostic findings..." value={newInternalNote} onChange={e => setNewInternalNote(e.target.value)} />
                <div className="flex justify-end"><button onClick={addInternalNote} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">Commit Entry</button></div>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {editedBooking.internalNotes?.map(note => (
                  <div key={note.id} className="p-6 rounded-2xl bg-slate-50 border border-slate-100/50">
                    <div className="flex justify-between items-center mb-2"><span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">{note.author}</span><span className="text-[9px] text-slate-400">{note.timestamp}</span></div>
                    <p className="text-sm text-slate-600 leading-relaxed font-normal">{note.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-10">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
             <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-10">Financial Summary</p>
             <div className="space-y-5 mb-10">
                <div className="flex justify-between text-xs text-slate-400"><span>Labor Components</span><span className="font-bold text-white">${financialDetails.laborSub.toLocaleString()}</span></div>
                <div className="flex justify-between text-xs text-slate-400"><span>Hardware Components</span><span className="font-bold text-white">${financialDetails.equipSub.toLocaleString()}</span></div>
                <div className="pt-5 border-t border-white/5 flex justify-between text-sm font-bold"><span>Subtotal (Net)</span><span>${financialDetails.subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm text-blue-400 font-bold"><span>Tax Component (10%)</span><span>+ ${financialDetails.gst.toLocaleString()}</span></div>
                <div className="pt-8 border-t border-white/10 flex justify-between items-end"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Gross Total</p><h3 className="text-5xl font-black text-white tracking-tighter">${financialDetails.total.toLocaleString()}</h3></div>
             </div>
             <div className="space-y-4">
               <button onClick={commitCalculatedCharges} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-blue-700 transition-all tracking-widest">Update Ledger Charges</button>
               {editedBooking.isInvoiced && (
                  <button 
                    onClick={() => setShowInvoicePreview(true)} 
                    className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-slate-100 transition-all tracking-widest"
                  >
                    View & Export Invoice
                  </button>
               )}
             </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
            <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em] mb-8">Payment Registry</h4>
            <div className="space-y-8">
              <section>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input type="number" placeholder="$ Amount" className="flex-grow bg-slate-50 px-4 py-2.5 rounded-xl text-xs font-bold outline-none border shadow-inner" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} />
                    <button onClick={addPayment} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Add</button>
                  </div>
                  <input placeholder="Transaction Reference" className="w-full bg-slate-50 px-4 py-2 rounded-xl text-[9px] outline-none border shadow-inner" value={paymentNote} onChange={e => setPaymentNote(e.target.value)} />
                </div>
              </section>
              
              <div className="pt-6 border-t border-slate-50">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Transaction History</p>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {editedBooking.payments.length === 0 ? (
                    <p className="text-[10px] text-slate-300 italic">No payments recorded.</p>
                  ) : (
                    editedBooking.payments.map(p => (
                      <div key={p.id} className="flex justify-between items-center text-[10px] p-3 rounded-xl bg-slate-50/50 border border-slate-50">
                        <div className="flex flex-col">
                           <span className="font-black text-slate-900">${p.amount.toLocaleString()}</span>
                           <span className="text-[8px] text-slate-400 uppercase font-bold">{new Date(p.date).toLocaleDateString('en-AU')}</span>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600">{p.method}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showInvoicePreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-6 overflow-y-auto custom-scrollbar">
           <div className="bg-white rounded-[3rem] w-full max-w-3xl p-10 md:p-16 shadow-2xl relative my-auto animate-in zoom-in">
              <div className="flex justify-between mb-8">
                <button 
                  onClick={handleDownloadInvoice}
                  disabled={isDownloading}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  {isDownloading ? 'Capturing Registry...' : 'Download Invoice PDF'}
                </button>
                <button onClick={() => setShowInvoicePreview(false)} className="text-slate-300 hover:text-slate-900 transition-colors">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div ref={invoiceRef} className="bg-white p-8 md:p-12 border border-slate-50 shadow-inner rounded-2xl">
                <div className="flex justify-between items-start mb-16">
                   <div className="max-w-[240px]">
                      <h2 className="text-xl font-black text-slate-900 tracking-tighter uppercase leading-tight mb-2">{businessSettings.name}</h2>
                      <div className="space-y-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        <p className="text-blue-600">{businessSettings.taxId}</p>
                        <p>{businessSettings.address}</p>
                        <p>{businessSettings.phone}</p>
                        <p>{businessSettings.email}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">TAX INVOICE</h1>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest space-y-1">
                        <p>INV-#{editedBooking.id.toUpperCase()}</p>
                        <p>DATE: {new Date().toLocaleDateString('en-AU')}</p>
                      </div>
                   </div>
                </div>

                <div className="mb-12">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Recipient Information</p>
                   <div className="text-sm font-bold text-slate-900">
                      <p className="text-lg">{editedBooking.name}</p>
                      <p className="text-slate-500 font-medium">{editedBooking.location.address}</p>
                      <p className="text-slate-500 font-medium">{editedBooking.location.suburb}</p>
                   </div>
                </div>

                <div className="border-t border-slate-100 pt-8 space-y-4 mb-16">
                   <div className="grid grid-cols-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">
                      <div className="col-span-2">Description</div>
                      <div className="text-right">Tax (GST)</div>
                      <div className="text-right">Amount</div>
                   </div>
                   {editedBooking.lineItems.map(item => (
                      <div key={item.id} className="grid grid-cols-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-100/50">
                        <span className="col-span-2 text-xs font-bold text-slate-700">{item.description}</span>
                        <span className="text-right text-[10px] font-bold text-slate-400">10%</span>
                        <span className="text-right text-sm font-black text-slate-900">${item.amount.toLocaleString()}</span>
                      </div>
                   ))}
                </div>

                <div className="flex justify-end pt-10 border-t-2 border-slate-900/5">
                   <div className="w-72 space-y-4">
                      <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <span>Subtotal (Net)</span>
                        <span>${financialDetails.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold text-blue-600 uppercase tracking-widest">
                        <span>GST Component (10%)</span>
                        <span>${financialDetails.gst.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t text-slate-900">
                        <span className="text-sm font-black uppercase tracking-tighter">Gross Total</span>
                        <span className="text-3xl font-black tracking-tighter">${financialDetails.total.toLocaleString()}</span>
                      </div>
                      
                      {financialDetails.paid > 0 && (
                        <div className="flex justify-between text-xs font-bold text-emerald-600 uppercase tracking-widest">
                          <span>Less Payments Received</span>
                          <span>-${financialDetails.paid.toLocaleString()}</span>
                        </div>
                      )}

                      <div className="bg-slate-900 text-white p-5 rounded-2xl flex justify-between items-center mt-6 shadow-xl">
                         <span className="text-[10px] uppercase font-black tracking-widest opacity-60">Balance Outstanding</span>
                         <span className="text-xl font-black tracking-tighter">${financialDetails.balance.toLocaleString()}</span>
                      </div>
                   </div>
                </div>

                <div className="mt-20 text-center">
                   <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em]">Thank you for partnering with {businessSettings.name}</p>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

const EditableField = ({ isEditing, label, value, onChange }: any) => (
  <div className="min-w-0">
    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
    {isEditing ? (
      <input 
        className="w-full bg-blue-50/50 px-4 py-2.5 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-inner" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
      />
    ) : (
      <p className="text-sm font-bold text-slate-900 truncate">{value || 'NOT RECORDED'}</p>
    )}
  </div>
);

export default AdminBookingDetails;
