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
  Mail
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const TicketCard = ({ ticket }) => {
  const isShowTicket = ticket.showName !== undefined;
  const [isDownloading, setIsDownloading] = React.useState(false);

  const downloadTicket = async () => {
    setIsDownloading(true);
    try {
      // Create a printable ticket HTML
      const ticketHTML = `
        <html>
          <head>
            <title>Ticket - ${ticket.ticketNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .ticket-info { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; }
              .qr-code { text-align: center; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${isShowTicket ? 'SHOW TICKET' : 'MUSEUM ENTRY TICKET'}</h1>
              <h2>${isShowTicket ? ticket.showName : ticket.museumName}</h2>
            </div>
            
            <div class="ticket-info">
              <p><strong>Ticket Number:</strong> ${ticket.ticketNumber}</p>
              <p><strong>Status:</strong> ${ticket.status}</p>
              ${!isShowTicket ? 
                `<p><strong>Adults:</strong> ${ticket.adults || 0}</p>
                 <p><strong>Children:</strong> ${ticket.children || 0}</p>` :
                `<p><strong>Quantity:</strong> ${ticket.quantity} tickets</p>`
              }
              <p><strong>Total Price:</strong> ₹${ticket.totalPrice}</p>
              <p><strong>Booked:</strong> ${format(new Date(ticket.createdAt), 'dd MMM yyyy, hh:mm a')}</p>
              ${ticket.usedAt ? `<p><strong>Used:</strong> ${format(new Date(ticket.usedAt), 'dd MMM yyyy, hh:mm a')}</p>` : ''}
            </div>
            
            <div class="qr-code">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify({
                ticketNumber: ticket.ticketNumber,
                type: isShowTicket ? 'SHOW' : 'ENTRY',
                status: ticket.status,
              }))}" alt="QR Code" />
              <p>Scan for verification</p>
            </div>
            
            <div class="footer">
              <p>Thank you for choosing our museum! Please show this ticket at the entrance.</p>
            </div>
          </body>
        </html>
      `;

      // Create a blob and download
      const blob = new Blob([ticketHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${ticket.ticketNumber}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Ticket downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download ticket');
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const shareTicket = async () => {
    const shareData = {
      title: `Museum Ticket - ${ticket.ticketNumber}`,
      text: `Check out my ${isShowTicket ? 'show' : 'museum entry'} ticket for ${isShowTicket ? ticket.showName : ticket.museumName}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Ticket shared successfully!');
      } catch (error) {
        if (error.name !== 'AbortError') {
          fallbackShare();
        }
      }
    } else {
      fallbackShare();
    }
  };

  const fallbackShare = () => {
    const shareUrl = `${window.location.origin}/ticket/${ticket.ticketNumber}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success('Share link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy share link');
    });
  };

  const emailTicket = () => {
    const subject = encodeURIComponent(`Your Museum Ticket - ${ticket.ticketNumber}`);
    const body = encodeURIComponent(`
Hello,

Here are your ticket details:

${isShowTicket ? 'Show' : 'Museum'}: ${isShowTicket ? ticket.showName : ticket.museumName}
Ticket Number: ${ticket.ticketNumber}
Status: ${ticket.status}
${!isShowTicket ? 
  `Adults: ${ticket.adults || 0}
Children: ${ticket.children || 0}` :
  `Quantity: ${ticket.quantity} tickets`
}
Total Price: ₹${ticket.totalPrice}
Booked: ${format(new Date(ticket.createdAt), 'dd MMM yyyy, hh:mm a')}

Please show this ticket at the entrance for verification.

Best regards,
Museum Ticket Booking System
    `);
    
    const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
    window.open(mailtoLink);
    
    toast.success('Email client opened with ticket details!');
  };

  return (
    <div className="ticket-card group" role="article" aria-labelledby={`ticket-${ticket.ticketNumber}`}>
      <div className="ticket-card-inner print-friendly">
        {/* Ticket Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Ticket className="h-5 w-5 text-primary-600" />
              <span className="text-sm font-semibold text-primary-600">
                {isShowTicket ? 'SHOW TICKET' : 'ENTRY TICKET'}
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              {isShowTicket ? ticket.showName : ticket.museumName}
            </h3>
          </div>
          <span className={`badge ${
            ticket.status === 'ACTIVE' ? 'badge-success' :
            ticket.status === 'USED' ? 'badge-info' :
            'badge-warning'
          }`}>
            {ticket.status}
          </span>
        </div>

        {/* Ticket Content */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Side - Details */}
          <div className="flex-1 space-y-4">
            {/* Ticket Number */}
            <div className="bg-gray-50 p-3 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Ticket Number</p>
              <p className="font-mono text-lg font-bold text-primary-600">
                {ticket.ticketNumber}
              </p>
            </div>

            {/* Visitor Details */}
            <div className="grid grid-cols-2 gap-3">
              {!isShowTicket && ticket.adults > 0 && (
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Adults</p>
                  <p className="text-xl font-bold text-gray-900">{ticket.adults}</p>
                </div>
              )}
              {!isShowTicket && ticket.children > 0 && (
                <div className="bg-gray-50 p-3 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Children</p>
                  <p className="text-xl font-bold text-gray-900">{ticket.children}</p>
                </div>
              )}
              {isShowTicket && (
                <div className="bg-gray-50 p-3 rounded-xl col-span-2">
                  <p className="text-xs text-gray-500 mb-1">Quantity</p>
                  <p className="text-xl font-bold text-gray-900">{ticket.quantity} tickets</p>
                </div>
              )}
            </div>

            {/* Total Price */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-4 rounded-xl">
              <p className="text-xs text-gray-600 mb-1">Total Price</p>
              <p className="text-2xl font-bold text-primary-600 flex items-center">
                <IndianRupee className="h-6 w-6" />
                {ticket.totalPrice}
              </p>
            </div>

            {/* Dates */}
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-2 text-primary-400" />
                Booked: {format(new Date(ticket.createdAt), 'dd MMM yyyy, hh:mm a')}
              </div>
              {ticket.usedAt && (
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-2 text-primary-400" />
                  Used: {format(new Date(ticket.usedAt), 'dd MMM yyyy, hh:mm a')}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - QR Code */}
          <div className="flex flex-col items-center justify-center">
            <div className="bg-white p-4 rounded-2xl shadow-lg border-2 border-primary-100">
              <QRCodeSVG
                value={JSON.stringify({
                  ticketNumber: ticket.ticketNumber,
                  type: isShowTicket ? 'SHOW' : 'ENTRY',
                  status: ticket.status,
                })}
                size={150}
                level="H"
                includeMargin={true}
                aria-label={`QR code for ticket ${ticket.ticketNumber}`}
              />
            </div>
            <p className="text-xs text-gray-500 mt-3" id={`qr-desc-${ticket.ticketNumber}`}>Scan for verification</p>
          </div>
        </div>

        {/* Action Buttons */}
        {ticket.status === 'ACTIVE' && (
          <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-100 no-print" role="group" aria-label="Ticket actions">
            <button
              onClick={downloadTicket}
              disabled={isDownloading}
              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              title="Download Ticket"
              aria-label={`Download ticket ${ticket.ticketNumber}`}
            >
              <Download className={`h-5 w-5 ${isDownloading ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
            <button
              onClick={shareTicket}
              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              title="Share Ticket"
              aria-label={`Share ticket ${ticket.ticketNumber}`}
            >
              <Share2 className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              onClick={emailTicket}
              className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              title="Email Ticket"
              aria-label={`Email ticket ${ticket.ticketNumber}`}
            >
              <Mail className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketCard;
