import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Ticket, 
  Calendar, 
  User, 
  CheckCircle, 
  Clock, 
  IndianRupee,
  Download,
  Share2,
  Mail,
  ShieldCheck,
  Sparkles,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const TicketCard = ({ ticket }) => {
  const isShowTicket = ticket.showName !== undefined;
  const [isDownloading, setIsDownloading] = React.useState(false);

  const isActive = ticket.status === 'ACTIVE';
  const isUsed = ticket.status === 'USED';

  const downloadTicket = async () => {
    setIsDownloading(true);
    try {
      // Create a printable ticket HTML
      const ticketHTML = `
        <html>
          <head>
            <title>Ticket - ${ticket.ticketNumber}</title>
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; }
              .ticket-container { background: #ffffff; border: 2px solid #10b981; border-radius: 16px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
              .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 20px; }
              .header h1 { color: #0f172a; margin: 0 0 6px; font-size: 22px; }
              .header h2 { color: #059669; margin: 0; font-size: 16px; font-weight: 600; }
              .ticket-info { background: #f1f5f9; padding: 16px; border-radius: 12px; margin: 16px 0; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
              .qr-code { text-align: center; margin: 20px 0; padding: 16px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; }
              .status-badge { display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 999px; font-weight: bold; font-size: 12px; }
              .footer { text-align: center; color: #64748b; font-size: 12px; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 12px; }
            </style>
          </head>
          <body>
            <div class="ticket-container">
              <div class="header">
                <span class="status-badge">${ticket.status} PASS</span>
                <h1>${isShowTicket ? '🏛️ SHOW TICKET' : '🏛️ MUSEUM ENTRY TICKET'}</h1>
                <h2>${isShowTicket ? ticket.showName : ticket.museumName}</h2>
              </div>
              
              <div class="ticket-info">
                <div class="info-row"><strong>Ticket ID:</strong> <span>#${ticket.ticketNumber}</span></div>
                <div class="info-row"><strong>Status:</strong> <span>${ticket.status}</span></div>
                ${!isShowTicket ? 
                  `<div class="info-row"><strong>Visitors:</strong> <span>${ticket.adults || 0} Adult(s), ${ticket.children || 0} Child(ren)</span></div>` :
                  `<div class="info-row"><strong>Quantity:</strong> <span>${ticket.quantity} Tickets</span></div>`
                }
                <div class="info-row"><strong>Total Paid:</strong> <span>₹${ticket.totalPrice}</span></div>
                <div class="info-row"><strong>Booked At:</strong> <span>${format(new Date(ticket.createdAt), 'dd MMM yyyy, hh:mm a')}</span></div>
                ${ticket.usedAt ? `<div class="info-row"><strong>Used At:</strong> <span>${format(new Date(ticket.usedAt), 'dd MMM yyyy, hh:mm a')}</span></div>` : ''}
              </div>
              
              <div class="qr-code">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(JSON.stringify({
                  ticketNumber: ticket.ticketNumber,
                  type: isShowTicket ? 'SHOW' : 'ENTRY',
                  status: ticket.status,
                }))}" alt="QR Code" />
                <p style="margin: 8px 0 0; font-size: 12px; color: #64748b;">Present this QR pass at the entrance scanner</p>
              </div>
              
              <div class="footer">
                <p>Official Digital Pass • Verified by Museum Security System</p>
              </div>
            </div>
          </body>
        </html>
      `;

      const blob = new Blob([ticketHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Museum-Ticket-${ticket.ticketNumber}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Dynamic Ticket Pass downloaded!');
    } catch (error) {
      toast.error('Failed to download ticket');
    } finally {
      setIsDownloading(false);
    }
  };

  const shareTicket = async () => {
    const shareUrl = `${window.location.origin}/ticket/${ticket.ticketNumber}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Museum Ticket Pass #${ticket.ticketNumber}`,
          text: `Here is my entry ticket pass for ${isShowTicket ? ticket.showName : ticket.museumName}`,
          url: shareUrl
        });
        toast.success('Ticket shared!');
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyToClipboard(shareUrl);
        }
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Ticket link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy ticket link');
    });
  };

  const emailTicket = () => {
    const subject = encodeURIComponent(`Museum Entry Pass - #${ticket.ticketNumber}`);
    const body = encodeURIComponent(`
Hello,

Here are your digital ticket details:

🏛️ ${isShowTicket ? 'Show' : 'Museum'}: ${isShowTicket ? ticket.showName : ticket.museumName}
🎫 Ticket Number: #${ticket.ticketNumber}
✨ Status: ${ticket.status}
👥 Visitors: ${!isShowTicket ? `${ticket.adults || 0} Adult(s), ${ticket.children || 0} Child(ren)` : `${ticket.quantity} Tickets`}
💰 Total Price: ₹${ticket.totalPrice}
📅 Booked: ${format(new Date(ticket.createdAt), 'dd MMM yyyy, hh:mm a')}

Please show this digital pass at the entrance scanner for instant verification.
    `);
    
    window.open(`mailto:?subject=${subject}&body=${body}`);
    toast.success('Email client opened with ticket pass!');
  };

  // Dynamic status wrapper class
  const dynamicWrapperClass = isActive
    ? 'ticket-dynamic-active'
    : isUsed
    ? 'ticket-dynamic-used'
    : 'ticket-dynamic-pending';

  return (
    <div className={`relative ${dynamicWrapperClass} group transition-all duration-300 print-friendly`}>
      {/* Dynamic Holographic Shimmer Effect */}
      {isActive && <div className="hologram-shimmer" />}

      {/* Ticket Canvas */}
      <div className="ticket-card-canvas p-5 sm:p-6 text-gray-900 relative">
        
        {/* Anti-tamper Live Security Watermark Stamp */}
        <div className="absolute right-4 top-4 opacity-10 pointer-events-none select-none">
          <ShieldCheck className="w-28 h-28 text-emerald-600" />
        </div>

        {/* Top Header: Category, Museum Name, Dynamic Live Status Badge */}
        <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 mb-1.5">
              <span className={`inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                isUsed ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                'bg-amber-50 text-amber-700 border border-amber-200'
              }`}>
                <Sparkles className="h-3 w-3 animate-spin text-emerald-500" style={{ animationDuration: '6s' }} />
                {isShowTicket ? 'LIVE SHOW PASS' : 'OFFICIAL ENTRY PASS'}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
              {isShowTicket ? ticket.showName : ticket.museumName}
            </h3>
          </div>

          {/* Dynamic Live Status Beacon */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide shadow-xs ${
              isActive ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-200' :
              isUsed ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white' :
              'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
            }`}>
              {isActive && <span className="w-2 h-2 rounded-full bg-white animate-ping" />}
              {isUsed ? <Check className="w-3.5 h-3.5" /> : null}
              {ticket.status}
            </span>
          </div>
        </div>

        {/* Ticket Perforation Cuts (Authentic Physical Ticket Illusion) */}
        <div className="relative my-2">
          <div className="absolute -left-8 -top-3 w-6 h-6 rounded-full bg-slate-900" />
          <div className="absolute -right-8 -top-3 w-6 h-6 rounded-full bg-slate-900" />
          <div className="border-t-2 border-dashed border-gray-200 my-1" />
        </div>

        {/* Dynamic Ticket Body */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-3 relative z-10">
          
          {/* Left Details (7 cols) */}
          <div className="md:col-span-7 space-y-3">
            {/* Ticket Code Tag */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-3 rounded-xl text-white shadow-inner flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">Ticket Number</p>
                <p className="font-mono text-base sm:text-lg font-black tracking-wider text-emerald-400">
                  #{ticket.ticketNumber}
                </p>
              </div>
              <ShieldCheck className="h-6 w-6 text-emerald-400 opacity-80" />
            </div>

            {/* Visitor Stats */}
            <div className="grid grid-cols-2 gap-2">
              {!isShowTicket ? (
                <>
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Adults</p>
                    <p className="text-base font-black text-gray-800">{ticket.adults || 0}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Children</p>
                    <p className="text-base font-black text-gray-800">{ticket.children || 0}</p>
                  </div>
                </>
              ) : (
                <div className="col-span-2 bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Quantity</p>
                  <p className="text-base font-black text-gray-800">{ticket.quantity} Passes</p>
                </div>
              )}
            </div>

            {/* Price Badge */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900">Total Paid</span>
              <span className="text-lg font-black text-emerald-700 flex items-center">
                <IndianRupee className="h-4 w-4 mr-0.5" />
                {ticket.totalPrice}
              </span>
            </div>

            {/* Timestamps */}
            <div className="text-[11px] text-gray-500 space-y-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                <span>Booked: {format(new Date(ticket.createdAt), 'dd MMM yyyy, hh:mm a')}</span>
              </div>
              {ticket.usedAt && (
                <div className="flex items-center gap-1.5 text-amber-700 font-semibold">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Verified & Scanned: {format(new Date(ticket.usedAt), 'dd MMM yyyy, hh:mm a')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Details: High-Tech QR Scanner Container (5 cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className="relative p-3 bg-white rounded-2xl shadow-md border-2 border-emerald-200 group/qr">
              {/* Dynamic Laser Scanning Line for Active Tickets */}
              {isActive && <div className="qr-scanner-laser" />}

              <QRCodeSVG
                value={JSON.stringify({
                  ticketNumber: ticket.ticketNumber,
                  type: isShowTicket ? 'SHOW' : 'ENTRY',
                  status: ticket.status,
                })}
                size={135}
                level="H"
                includeMargin={false}
                aria-label={`QR code for ticket ${ticket.ticketNumber}`}
              />
            </div>
            <p className="text-[11px] font-bold text-gray-600 mt-2 flex items-center gap-1">
              {isActive ? (
                <span className="text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Entry QR
                </span>
              ) : (
                <span className="text-slate-500">Scanned at gate</span>
              )}
            </p>
          </div>

        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex items-center justify-between mt-5 pt-3 border-t border-gray-100 no-print">
          <span className="text-[10px] text-gray-400 font-mono">
            SEC-ID: {ticket.ticketNumber.slice(0, 8)}•••
          </span>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={downloadTicket}
              disabled={isDownloading}
              className="p-2 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all disabled:opacity-50"
              title="Download Pass"
            >
              <Download className={`h-4 w-4 ${isDownloading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={shareTicket}
              className="p-2 text-gray-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all"
              title="Share Ticket"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={emailTicket}
              className="p-2 text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-all"
              title="Email Ticket"
            >
              <Mail className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TicketCard;
