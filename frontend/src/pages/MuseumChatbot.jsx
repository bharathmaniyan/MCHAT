import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot, History, X, CheckCircle, Clock, CreditCard,
  ChevronRight, Ticket, ArrowLeft, Eye, EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../services/api';
import { loadRazorpayScript } from '../utils/loadRazorpay';
import { useParams } from 'react-router-dom';

/* ──────────────────────────────────────────────
   STEP CONSTANTS  (button-driven flow)
────────────────────────────────────────────── */
const STEP = {
  MAIN_MENU: 'MAIN_MENU',
  VIEW_PRICES: 'VIEW_PRICES',
  VIEW_TIMINGS: 'VIEW_TIMINGS',
  VIEW_CONTACT: 'VIEW_CONTACT',
  VIEW_SHOWS: 'VIEW_SHOWS',
  BOOK_SELECT_TICKETS: 'BOOK_SELECT_TICKETS',
  BOOK_EMAIL: 'BOOK_EMAIL',
  BOOK_PHONE: 'BOOK_PHONE',
  BOOK_CONFIRM: 'BOOK_CONFIRM',
  PAYMENT: 'PAYMENT',
  SUCCESS: 'SUCCESS',
  HISTORY_EMAIL: 'HISTORY_EMAIL',
  HISTORY_LIST: 'HISTORY_LIST',
  TICKET_VALIDATE: 'TICKET_VALIDATE',
};

/* ──────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────── */
const fmtPrice = (v) => `₹${Number(v || 0).toFixed(0)}`;
const fmtDate  = (d) => new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
const fmtTime  = (d) => new Date(d).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });

/* ──────────────────────────────────────────────
   COMPONENT
────────────────────────────────────────────── */
const MuseumChatbot = () => {
  const { id: paramId } = useParams();

  /* Museum data */
  const [museum, setMuseum]   = useState(null);       // single museum (if opened via QR)
  const [museums, setMuseums] = useState([]);          // all museums
  const [selectedMuseum, setSelectedMuseum] = useState(null); // chosen for booking
  const [shows, setShows]     = useState([]);

  /* Chat messages */
  const [messages, setMessages] = useState([]);

  /* Current step / flow state */
  const [step, setStep]     = useState(STEP.MAIN_MENU);
  const [textInput, setTextInput] = useState('');

  /* Booking form state */
  const [booking, setBooking] = useState({ adults: 1, children: 0, email: '', phone: '' });
  const [totalPrice, setTotalPrice] = useState(0);

  /* Payment state */
  const [orderData,      setOrderData]      = useState(null);
  const [bookingResult,  setBookingResult]  = useState(null);
  const [loading,        setLoading]        = useState(false);

  /* History */
  const [showHistory,     setShowHistory]   = useState(false);
  const [historyEmail,    setHistoryEmail]  = useState('');
  const [userTickets,     setUserTickets]   = useState([]);
  const [loadingHistory,  setLoadingHistory]= useState(false);

  /* Ticket validation */
  const [validatingTicket, setValidatingTicket] = useState(null);
  const [validCode,         setValidCode]        = useState('');
  const [showCode,          setShowCode]         = useState(false);

  const messagesEndRef = useRef(null);

  /* ── scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── load museum(s) ── */
  useEffect(() => {
    if (paramId) {
      loadSingleMuseum(paramId);
    } else {
      loadAllMuseums();
    }
  }, [paramId]);

  /* recalc price when tickets or museum change */
  useEffect(() => {
    if (!selectedMuseum) { setTotalPrice(0); return; }
    const adult = Number(selectedMuseum.adultPrice || selectedMuseum.adultTicketPrice || 0);
    const child = Number(selectedMuseum.childPrice || selectedMuseum.childTicketPrice || 0);
    setTotalPrice(booking.adults * adult + booking.children * child);
  }, [booking.adults, booking.children, selectedMuseum]);

  /* poll for real-time updates every 15 s */
  useEffect(() => {
    const interval = setInterval(() => {
      if (paramId) loadSingleMuseum(paramId, true);
      else         loadAllMuseums(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [paramId]);

  const loadSingleMuseum = async (id, silent = false) => {
    try {
      const res = await api.publicAPI.getMuseumProfile(id);
      const m = res.data || res;
      setMuseum(m);
      setSelectedMuseum(m);
      if (!silent) {
        setMuseums([m]);
        setMessages(prev => {
          if (prev.length === 0 || prev[prev.length - 1].text.indexOf(m.museumName) === -1) {
            return [...prev, { id: Date.now(), type: 'bot', text: `Welcome to **${m.museumName}**! 🏛️ How can I help you today?` }];
          }
          return prev;
        });
      }
      // load shows for this museum
      loadShows(id, silent);
    } catch (e) {
      if (!silent) toast.error('Failed to load museum');
    }
  };

  const loadAllMuseums = async (silent = false) => {
    try {
      const res = await api.publicAPI.searchMuseums();
      const all = (res.data?.content || res.data || res).filter(m => m.bookingStatus === true);
      setMuseums(all);
      if (!silent && all.length > 0) {
        setMessages(prev => {
          if (prev.length === 0 || prev[prev.length - 1].text.indexOf('Museum Ticket Booking') === -1) {
            return [...prev, { id: Date.now(), type: 'bot', text: `Welcome to **Museum Ticket Booking**! 🏛️\nHow can I help you today?` }];
          }
          return prev;
        });
      }
    } catch (e) {
      if (!silent) toast.error('Failed to load museums');
    }
  };

  const loadShows = async (museumId, silent = false) => {
    try {
      const res = await api.showAPI.getActiveShows(museumId);
      setShows(res.data || res || []);
    } catch { /* ignore */ }
  };

  /* ── message helpers ── */
  const addBot  = (text) => setMessages(p => [...p, { id: Date.now() + Math.random(), type: 'bot',  text }]);
  const addUser = (text) => setMessages(p => [...p, { id: Date.now() + Math.random(), type: 'user', text }]);

  /* ── MAIN MENU OPTIONS ── */
  const mainMenuOptions = [
    { label: '💰 View Prices',      step: STEP.VIEW_PRICES },
    { label: '🕐 Museum Timings',   step: STEP.VIEW_TIMINGS },
    { label: '📞 Contact Info',     step: STEP.VIEW_CONTACT },
    ...(shows.length > 0 ? [{ label: '🎭 Special Shows', step: STEP.VIEW_SHOWS }] : []),
    { label: '🎫 Book Ticket',      step: STEP.BOOK_SELECT_TICKETS },
  ];

  const handleMainMenu = (option) => {
    addUser(option.label);
    setStep(option.step);

    if (option.step === STEP.VIEW_PRICES) {
      const target = selectedMuseum || museums[0];
      if (!target) { addBot('No museum information available right now.'); return; }
      addBot(
        `**Ticket Prices at ${target.museumName}**\n\n` +
        `👨 Adults: ${fmtPrice(target.adultPrice || target.adultTicketPrice)}\n` +
        `👦 Children: ${fmtPrice(target.childPrice || target.childTicketPrice)}`
      );
    }

    if (option.step === STEP.VIEW_TIMINGS) {
      const target = selectedMuseum || museums[0];
      if (!target) return;
      let timingsText = `**Museum Timings - ${target.museumName}**\n\n`;
      if (target.businessHours && target.businessHours.length > 0) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        target.businessHours.forEach(bh => {
          const dayName = typeof bh.dayOfWeek === 'number' ? days[bh.dayOfWeek] : bh.dayOfWeek;
          if (bh.isClosed) {
            timingsText += `❌ ${dayName}: Closed\n`;
          } else {
            const formatTime = (t) => {
              if (!t) return '';
              // Handle HH:mm or HH:mm:ss format
              const [hours, minutes] = t.split(':');
              const d = new Date();
              d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
              return d.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'});
            };
            timingsText += `✅ ${dayName}: ${formatTime(bh.openTime)} - ${formatTime(bh.closeTime)}\n`;
          }
        });
      } else {
        timingsText += "Timings not available. Please contact the museum directly.";
      }
      addBot(timingsText);
    }

    if (option.step === STEP.VIEW_CONTACT) {
      const target = selectedMuseum || museums[0];
      if (!target) return;
      // The `address` field is a complete geocoded address from Maps. No need to append city/state again.
      const addressText = target.address ? target.address : [target.landmark, target.city, target.state, target.pincode].filter(Boolean).join(', ');
      
      addBot(
        `**Contact Information**\n\n` +
        `📧 Email: ${target.publicEmail || 'Not provided'}\n` +
        `📞 Phone: ${target.publicPhone || 'Not provided'}\n` +
        `📍 Location: ${addressText || 'Not provided'}`
      );
    }

    if (option.step === STEP.VIEW_SHOWS) {
      if (shows.length === 0) {
        addBot('No special shows are currently scheduled.');
      } else {
        const list = shows.map(s =>
          `🎭 **${s.showName || s.name}**\n   📅 ${fmtDate(s.showTime)} at ${fmtTime(s.showTime)}\n   💰 ${fmtPrice(s.price)} per ticket\n   🎟️ ${s.availableSeats} seats left`
        ).join('\n\n');
        addBot(`**Upcoming Special Shows**\n\n${list}`);
      }
    }

    if (option.step === STEP.BOOK_SELECT_TICKETS) {
      if (!selectedMuseum && museums.length === 0) {
        addBot('Sorry, no museums are available for booking right now.');
        setStep(STEP.MAIN_MENU);
        return;
      }
      const target = selectedMuseum || museums[0];
      if (!target.bookingStatus) {
        addBot('⚠️ Booking is currently **CLOSED** for this museum. Please try again later.');
        setStep(STEP.MAIN_MENU);
        return;
      }
      if (target.seatLimit !== undefined && target.seatLimit <= 0) {
        addBot('⚠️ Sorry, **no seats available** today. Please try again tomorrow.');
        setStep(STEP.MAIN_MENU);
        return;
      }
      if (!selectedMuseum) setSelectedMuseum(target);
      addBot(`Select number of tickets for **${target.museumName}**:`);
    }
  };

  const handleSelectMuseum = (m) => {
    setSelectedMuseum(m);
    addUser(`📍 ${m.museumName}`);
    addBot(`Great! How many tickets for **${m.museumName}**?`);
  };

  /* ── BOOKING FLOW HANDLERS ── */
  const handleTicketCount = () => {
    if (booking.adults + booking.children === 0) {
      toast.error('Please select at least 1 ticket');
      return;
    }
    const adult = Number(selectedMuseum.adultPrice || selectedMuseum.adultTicketPrice || 0);
    const child = Number(selectedMuseum.childPrice || selectedMuseum.childTicketPrice || 0);
    const total = booking.adults * adult + booking.children * child;

    addUser(`${booking.adults} Adult(s), ${booking.children} Child(ren)`);
    addBot(
      `**Order Summary**\n\n` +
      `👨 ${booking.adults} Adults × ${fmtPrice(adult)} = ${fmtPrice(booking.adults * adult)}\n` +
      `👦 ${booking.children} Children × ${fmtPrice(child)} = ${fmtPrice(booking.children * child)}\n` +
      `─────────────────\n` +
      `💰 **Total: ${fmtPrice(total)}**\n\n` +
      `Please enter your **email address** to continue:`
    );
    setTotalPrice(total);
    setStep(STEP.BOOK_EMAIL);
  };

  const handleEmailSubmit = () => {
    const email = textInput.trim();
    if (!email || !email.includes('@')) { toast.error('Enter a valid email'); return; }
    setBooking(p => ({ ...p, email }));
    setTextInput('');
    addUser(email);
    addBot('Now enter your **phone number**:');
    setStep(STEP.BOOK_PHONE);
  };

  const handlePhoneSubmit = () => {
    const phone = textInput.trim();
    if (!phone || phone.length < 6) { toast.error('Enter a valid phone number'); return; }
    setBooking(p => ({ ...p, phone }));
    setTextInput('');
    addUser(phone);
    addBot(
      `**Confirm Booking**\n\n` +
      `🏛️ Museum: ${selectedMuseum.museumName}\n` +
      `👤 ${booking.adults} Adult(s) + ${booking.children} Child(ren)\n` +
      `📧 Email: ${booking.email}\n` +
      `📞 Phone: ${phone}\n` +
      `💰 Total: ${fmtPrice(totalPrice)}\n\n` +
      `Tap **Confirm & Pay** to proceed to payment.`
    );
    setStep(STEP.BOOK_CONFIRM);
  };

  const handleConfirmBooking = async () => {
    setLoading(true);
    try {
      const ticketRes = await api.ticketAPI.book({
        museumId: selectedMuseum.id,
        email: booking.email,
        phone: booking.phone,
        adults: booking.adults,
        children: booking.children,
      });
      const ticket = ticketRes.data || ticketRes;
      setBookingResult(ticket);
      addBot(`🎫 Ticket created! **#${ticket.ticketNumber}**\n\nRedirecting to payment...`);

      const orderRes = await api.paymentAPI.createOrder({ ticketId: ticket.id });
      const order = orderRes.data || orderRes;
      setOrderData({
        ...order,
        museumName: selectedMuseum.museumName,
        ticketNumber: ticket.ticketNumber,
      });
      setStep(STEP.PAYMENT);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    if (!orderData) return;
    try {
      await loadRazorpayScript();
      const options = {
        key: orderData.razorpayKey,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: orderData.museumName,
        description: `Ticket - ${orderData.ticketNumber}`,
        order_id: orderData.orderId,
        handler: async (response) => {
          try {
            await api.paymentAPI.verify({
              ticketId: bookingResult.id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId:   response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success('Payment successful! 🎉');
            addBot(
              `✅ **Payment Successful!**\n\n` +
              `🎫 Ticket: **#${bookingResult.ticketNumber}**\n` +
              `🏛️ Museum: ${selectedMuseum.museumName}\n` +
              `📧 Confirmation sent to ${booking.email}\n\n` +
              `**How to enter the museum:**\n` +
              `1. Open your ticket from History\n` +
              `2. Show it to the staff at entry\n` +
              `3. Staff will enter the 4-digit museum code\n` +
              `4. Ticket status changes to USED ✅`
            );
            setStep(STEP.SUCCESS);
            setOrderData(null);
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        prefill: { email: booking.email, contact: booking.phone },
        theme: { color: '#6366f1' },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      toast.error('Failed to open payment window');
    }
  };

  /* ── HISTORY ── */
  const handleFetchHistory = async () => {
    if (!historyEmail.trim() || !historyEmail.includes('@')) {
      toast.error('Enter a valid email'); return;
    }
    setLoadingHistory(true);
    try {
      const res = await api.ticketAPI.getUserTickets(historyEmail.trim());
      setUserTickets(res.data || res || []);
    } catch {
      toast.error('Failed to fetch tickets');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleValidateTicket = async () => {
    if (!validCode || validCode.length !== 4) { toast.error('Enter 4-digit code'); return; }
    setLoading(true);
    try {
      await api.ticketAPI.verify({
        ticketId: validatingTicket.id,
        verificationCode: validCode,
        museumId: validatingTicket.museumId,
      });
      toast.success('Ticket validated! ✅');
      setUserTickets(p => p.map(t =>
        t.id === validatingTicket.id ? { ...t, status: 'USED' } : t
      ));
      setValidatingTicket(null);
      setValidCode('');
    } catch {
      toast.error('Invalid code. Please check and retry.');
    } finally {
      setLoading(false);
    }
  };

  /* ── RESET ── */
  const resetToMenu = () => {
    setStep(STEP.MAIN_MENU);
    setBooking({ adults: 1, children: 0, email: '', phone: '' });
    setOrderData(null);
    setBookingResult(null);
    addBot('Is there anything else I can help you with?');
  };

  /* ──────────────────────────────────────────────
     RENDER HELPERS
  ────────────────────────────────────────────── */
  const renderMessageText = (text) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={i}>
          {parts.map((p, j) =>
            p.startsWith('**') && p.endsWith('**')
              ? <strong key={j}>{p.slice(2, -2)}</strong>
              : p
          )}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  /* ── BOTTOM ACTION AREA (step-driven) ── */
  const renderActions = () => {
    // Inside history panel – don't render actions
    if (showHistory) return null;

    switch (step) {
      case STEP.MAIN_MENU:
        return (
          <div className="p-4 space-y-2">
            {museums.length > 1 && !paramId && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-2 font-medium px-1">SELECT MUSEUM</p>
                <div className="flex gap-2 flex-wrap">
                  {museums.map(m => (
                    <button key={m.id}
                      onClick={() => setSelectedMuseum(m)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        selectedMuseum?.id === m.id
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                      }`}>
                      {m.museumName}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {mainMenuOptions.map(opt => (
                <button key={opt.step}
                  onClick={() => handleMainMenu(opt)}
                  className="flex items-center justify-between bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-400 text-gray-800 px-4 py-3 rounded-xl text-sm font-medium transition-all shadow-sm group">
                  <span>{opt.label}</span>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-500" />
                </button>
              ))}
            </div>
          </div>
        );

      case STEP.VIEW_PRICES:
      case STEP.VIEW_TIMINGS:
      case STEP.VIEW_CONTACT:
      case STEP.VIEW_SHOWS:
        return (
          <div className="p-4 flex gap-2">
            <button onClick={() => setStep(STEP.MAIN_MENU)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Menu
            </button>
            <button onClick={() => handleMainMenu({ label: '🎫 Book Ticket', step: STEP.BOOK_SELECT_TICKETS })}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-semibold transition-all">
              🎫 Book Ticket
            </button>
          </div>
        );

      case STEP.BOOK_SELECT_TICKETS:
        return (
          <div className="p-4 space-y-3">
            {/* Museum selector if multiple */}
            {museums.length > 1 && !paramId && (
              <div>
                <p className="text-xs text-gray-500 mb-1 font-medium">Museum</p>
                <div className="flex gap-2 flex-wrap">
                  {museums.filter(m => m.bookingStatus).map(m => (
                    <button key={m.id} onClick={() => handleSelectMuseum(m)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        selectedMuseum?.id === m.id
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                      }`}>
                      {m.museumName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ticket counter */}
            <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-2 gap-3">
              {/* Adults */}
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">
                  Adults {selectedMuseum && `(${fmtPrice(selectedMuseum.adultPrice || selectedMuseum.adultTicketPrice)})`}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setBooking(p => ({ ...p, adults: Math.max(0, p.adults - 1) }))}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 font-bold text-lg flex items-center justify-center">−</button>
                  <span className="w-6 text-center font-bold">{booking.adults}</span>
                  <button onClick={() => setBooking(p => ({ ...p, adults: p.adults + 1 }))}
                    className="w-8 h-8 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold text-lg flex items-center justify-center">+</button>
                </div>
              </div>
              {/* Children */}
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">
                  Children {selectedMuseum && `(${fmtPrice(selectedMuseum.childPrice || selectedMuseum.childTicketPrice)})`}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setBooking(p => ({ ...p, children: Math.max(0, p.children - 1) }))}
                    className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 font-bold text-lg flex items-center justify-center">−</button>
                  <span className="w-6 text-center font-bold">{booking.children}</span>
                  <button onClick={() => setBooking(p => ({ ...p, children: p.children + 1 }))}
                    className="w-8 h-8 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-bold text-lg flex items-center justify-center">+</button>
                </div>
              </div>
            </div>

            {totalPrice > 0 && (
              <div className="text-center text-sm font-bold text-indigo-700 bg-indigo-50 rounded-lg py-2">
                Total: {fmtPrice(totalPrice)}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setStep(STEP.MAIN_MENU)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-sm font-semibold transition-all">
                ← Back
              </button>
              <button onClick={handleTicketCount}
                disabled={!selectedMuseum || booking.adults + booking.children === 0}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white py-3 rounded-xl text-sm font-semibold transition-all">
                Continue →
              </button>
            </div>
          </div>
        );

      case STEP.BOOK_EMAIL:
        return (
          <div className="p-4 space-y-2">
            <input type="email" value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
              placeholder="your@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
            <button onClick={handleEmailSubmit}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-semibold transition-all">
              Continue →
            </button>
          </div>
        );

      case STEP.BOOK_PHONE:
        return (
          <div className="p-4 space-y-2">
            <input type="tel" value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePhoneSubmit()}
              placeholder="+91 98765 43210"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm" />
            <button onClick={handlePhoneSubmit}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-semibold transition-all">
              Continue →
            </button>
          </div>
        );

      case STEP.BOOK_CONFIRM:
        return (
          <div className="p-4 flex gap-2">
            <button onClick={resetToMenu}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-sm font-semibold transition-all">
              ← Cancel
            </button>
            <button onClick={handleConfirmBooking} disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 rounded-xl text-sm font-semibold transition-all">
              {loading ? 'Creating...' : '✅ Confirm & Pay'}
            </button>
          </div>
        );

      case STEP.PAYMENT:
        return (
          <div className="p-4 space-y-3">
            {orderData && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
                <p className="font-bold text-amber-800 mb-1">💳 Payment Summary</p>
                <div className="flex justify-between text-gray-700">
                  <span>{orderData.museumName}</span>
                  <span className="font-bold">₹{(orderData.amount / 100).toFixed(2)}</span>
                </div>
                <p className="text-xs text-amber-700 mt-1">{orderData.ticketNumber}</p>
              </div>
            )}
            <button onClick={handlePayNow}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2">
              <CreditCard className="h-5 w-5" /> Pay Now
            </button>
          </div>
        );

      case STEP.SUCCESS:
        return (
          <div className="p-4 grid grid-cols-2 gap-2">
            <button onClick={() => { setShowHistory(true); setHistoryEmail(booking.email); }}
              className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 py-3 rounded-xl text-sm font-semibold transition-all">
              View Ticket
            </button>
            <button onClick={resetToMenu}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-semibold transition-all">
              Main Menu
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  /* ──────────────────────────────────────────────
     HISTORY PANEL
  ────────────────────────────────────────────── */
  const renderHistoryPanel = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="font-bold text-gray-900 text-lg">My Tickets</h3>
        <button onClick={() => { setShowHistory(false); setValidatingTicket(null); setValidCode(''); }}
          className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Validating a ticket */}
      {validatingTicket && (
        <div className="flex-1 overflow-y-auto p-5">
          <button onClick={() => { setValidatingTicket(null); setValidCode(''); }}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
            <p className="font-bold text-indigo-900">#{validatingTicket.ticketNumber}</p>
            <p className="text-sm text-indigo-700 mt-1">{validatingTicket.userEmail}</p>
            <p className="text-xs text-indigo-600 mt-1">{validatingTicket.adults}A / {validatingTicket.children}C · {fmtPrice(validatingTicket.totalPrice)}</p>
          </div>
          <p className="text-sm text-gray-600 mb-2 font-medium">Enter 4-digit museum code (from staff):</p>
          <div className="relative mb-3">
            <input
              type={showCode ? 'text' : 'password'}
              maxLength={4}
              value={validCode}
              onChange={e => setValidCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-4 border-2 border-indigo-300 rounded-xl text-center text-3xl font-mono tracking-[0.5em] focus:border-indigo-600 focus:outline-none"
              placeholder="••••"
              autoFocus
            />
            <button onClick={() => setShowCode(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showCode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <button onClick={handleValidateTicket} disabled={validCode.length !== 4 || loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold transition-all">
            {loading ? 'Verifying...' : '✅ Validate Ticket'}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">Ask museum staff for the code at entry</p>
        </div>
      )}

      {/* Email input */}
      {!validatingTicket && userTickets.length === 0 && (
        <div className="flex-1 flex flex-col p-5">
          <p className="text-sm text-gray-600 mb-3">Enter your email to view your booked tickets:</p>
          <input type="email" value={historyEmail}
            onChange={e => setHistoryEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleFetchHistory()}
            placeholder="your@email.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm mb-3" />
          <button onClick={handleFetchHistory} disabled={loadingHistory}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold text-sm transition-all">
            {loadingHistory ? 'Loading...' : 'View Tickets'}
          </button>
        </div>
      )}

      {/* Ticket list */}
      {!validatingTicket && userTickets.length > 0 && (
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-500">{userTickets.length} ticket(s) for {historyEmail}</p>
            <button onClick={() => { setUserTickets([]); setHistoryEmail(''); }}
              className="text-xs text-indigo-600 hover:underline">Change Email</button>
          </div>
          {userTickets.map(ticket => (
            <div key={ticket.id}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  #{ticket.ticketNumber}
                </span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  ticket.status === 'ACTIVE'    ? 'bg-green-100 text-green-800' :
                  ticket.status === 'USED'      ? 'bg-gray-100 text-gray-600' :
                  ticket.status === 'PENDING'   ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'}`}>
                  {ticket.status}
                </span>
              </div>
              <p className="text-sm text-gray-700 font-medium">{ticket.museumName || 'Museum'}</p>
              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                <span>{ticket.adults}A / {ticket.children}C</span>
                <span className="font-semibold text-gray-700">{fmtPrice(ticket.totalPrice)}</span>
                <span>{fmtDate(ticket.createdAt)}</span>
              </div>
              {ticket.status === 'ACTIVE' && (
                <button onClick={() => { setValidatingTicket(ticket); setValidCode(''); }}
                  className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-xs font-semibold transition-all">
                  🔐 Enter Museum Code
                </button>
              )}
              {ticket.status === 'USED' && (
                <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                  <CheckCircle className="h-3 w-3" /> Used on {ticket.usedAt ? fmtDate(ticket.usedAt) : '—'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  /* ──────────────────────────────────────────────
     MAIN RENDER
  ────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 pt-16 pb-6 flex items-center justify-center px-4">
      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Phone-style chatbot frame */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          style={{ height: 'calc(100vh - 100px)', maxHeight: '780px' }}>

          {/* ── Header ── */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/25 p-2 rounded-full">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-base leading-tight">
                  {museum?.museumName || 'Museum Assistant'}
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white/80 text-xs">Online · Real-time updates</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => { setShowHistory(true); }}
              className="bg-white/20 hover:bg-white/30 transition-colors p-2 rounded-full"
              title="View my tickets">
              <History className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* ── Content ── */}
          <div className="flex-1 overflow-hidden relative">

            {/* CHAT AREA */}
            <div className={`absolute inset-0 flex flex-col transition-transform duration-300 ${showHistory ? '-translate-x-full' : 'translate-x-0'}`}>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6">
                    <div className="bg-indigo-100 p-4 rounded-full mb-3">
                      <Bot className="h-10 w-10 text-indigo-600" />
                    </div>
                    <p className="text-gray-500 text-sm">Loading museum info…</p>
                  </div>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.type === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    }`}>
                      {renderMessageText(msg.text)}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-3">
                      <div className="flex gap-1">
                        {[0,1,2].map(i => (
                          <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Action Area */}
              <div className="flex-shrink-0 bg-gray-50 border-t border-gray-100">
                {renderActions()}
              </div>
            </div>

            {/* HISTORY PANEL */}
            <div className={`absolute inset-0 bg-white flex flex-col transition-transform duration-300 ${showHistory ? 'translate-x-0' : 'translate-x-full'}`}>
              {renderHistoryPanel()}
            </div>

          </div>
        </div>

        {/* Bottom hint */}
        <p className="text-center text-white/40 text-xs mt-3">
          Tap <History className="inline h-3 w-3 mx-0.5" /> to view booking history
        </p>
      </div>
    </div>
  );
};

export default MuseumChatbot;
