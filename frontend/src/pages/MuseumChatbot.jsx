import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot, History, X, CheckCircle, Clock, CreditCard,
  ChevronRight, Ticket, ArrowLeft, Eye, EyeOff, Globe,
  Send, Sparkles, User, LogIn, LogOut, Check, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as api from '../services/api';
import { loadRazorpayScript } from '../utils/loadRazorpay';
import { useParams } from 'react-router-dom';
import { LANGUAGES, getTranslation } from '../utils/translations';
import TicketCard from '../components/TicketCard';

/* ──────────────────────────────────────────────
   JWT PARSER FOR REAL GOOGLE CREDENTIALS
────────────────────────────────────────────── */
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

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
  ASK_AI: 'ASK_AI',
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

  /* Language state (persisted) */
  const [lang, setLang] = useState(() => localStorage.getItem('chatbot_lang') || 'en');
  const t = getTranslation(lang);

  /* User Auth State (Continue with Google) */
  const [userAuth, setUserAuth] = useState(() => {
    try {
      const saved = localStorage.getItem('visitor_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showAuthGate, setShowAuthGate] = useState(() => {
    return !localStorage.getItem('visitor_user') && !sessionStorage.getItem('visitor_guest');
  });

  /* ── GOOGLE ACCOUNTS (Choose an Account Modal) — dynamic, from login history ── */
  const [googleAccounts, setGoogleAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem('saved_google_accounts');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return [];
  });
  const [showUseAnother, setShowUseAnother] = useState(false);
  const [customEmailValue, setCustomEmailValue] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
  const [booking, setBooking] = useState({ 
    adults: 1, 
    children: 0, 
    email: userAuth?.email || '', 
    phone: '' 
  });
  const [totalPrice, setTotalPrice] = useState(0);

  /* Payment state */
  const [orderData,      setOrderData]      = useState(null);
  const [bookingResult,  setBookingResult]  = useState(null);
  const [loading,        setLoading]        = useState(false);

  /* History */
  const [showHistory,     setShowHistory]   = useState(false);
  const [historyEmail,    setHistoryEmail]  = useState(() => userAuth?.email || '');
  const [userTickets,     setUserTickets]   = useState([]);
  const [loadingHistory,  setLoadingHistory]= useState(false);

  /* Ticket validation */
  const [validatingTicket, setValidatingTicket] = useState(null);
  const [validCode,         setValidCode]        = useState('');
  const [showCode,          setShowCode]         = useState(false);

  /* AI Guide state */
  const [aiLoading,         setAiLoading]        = useState(false);
  const [aiSuggestedAction, setAiSuggestedAction]= useState(null);

  const messagesEndRef = useRef(null);

  /* ── scroll ── */
  useEffect(() => {
    const timeout = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 60);
    return () => clearTimeout(timeout);
  }, [messages, step]);

  /* ── auto fetch tickets if logged in user opens history ── */
  useEffect(() => {
    if (showHistory && userAuth?.email && userTickets.length === 0) {
      setHistoryEmail(userAuth.email);
      fetchTicketsForEmail(userAuth.email);
    }
  }, [showHistory, userAuth]);

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
            return [...prev, { id: Date.now(), type: 'bot', text: `${t.welcomeTo} **${m.museumName}**! 🏛️\n${t.howCanIHelp}` }];
          }
          return prev;
        });
      }
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
      if (!silent) {
        setMessages(prev => {
          if (prev.length === 0) {
            return [...prev, { id: Date.now(), type: 'bot', text: t.welcomeMuseumTicket }];
          }
          return prev;
        });
      }
    } catch (e) {
      if (!silent) {
        toast.error('Failed to load museums');
        setMessages(prev =>
          prev.length === 0
            ? [...prev, { id: Date.now(), type: 'bot', text: t.welcomeMuseumTicket }]
            : prev
        );
      }
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

  /* ── Real Google Auth (Google Identity & OAuth) ── */
  const completeAuthWithProfile = useCallback((profile) => {
    localStorage.setItem('visitor_user', JSON.stringify(profile));
    setUserAuth(profile);
    setBooking(prev => ({ ...prev, email: profile.email }));
    setHistoryEmail(profile.email);
    setShowAuthGate(false);
    fetchTicketsForEmail(profile.email);
    toast.success(`Welcome ${profile.name || profile.email}! ✅`);

    // Save this account to the google accounts list (for "Choose an account" picker)
    setGoogleAccounts(prev => {
      const exists = prev.some(a => a.email.toLowerCase() === profile.email.toLowerCase());
      const updated = exists ? prev : [
        ...prev,
        {
          name: profile.name || profile.email.split('@')[0],
          email: profile.email,
          initial: (profile.name || profile.email)[0].toUpperCase(),
          bgColor: `bg-[#${Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0')}]`,
          avatar: profile.avatar,
        }
      ];
      localStorage.setItem('saved_google_accounts', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleGoogleCredentialResponse = useCallback((response) => {
    if (!response?.credential) return;
    const payload = parseJwt(response.credential);
    if (payload && payload.email) {
      completeAuthWithProfile({
        name: payload.name || payload.given_name || payload.email.split('@')[0],
        email: payload.email.trim().toLowerCase(),
        avatar: payload.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${payload.email}`,
        provider: 'google',
        verified: payload.email_verified || true,
        signedInAt: new Date().toISOString()
      });
    }
  }, [completeAuthWithProfile]);

  // Setup Google OAuth Client
  const [tokenClient, setTokenClient] = useState(null);

  useEffect(() => {
    const initGoogleOAuth = () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1047192348512-4v9n0m8l7k6j5h4g3f2e1d0c.apps.googleusercontent.com';

      if (window.google?.accounts?.oauth2) {
        try {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
            callback: async (tokenResponse) => {
              if (tokenResponse?.access_token) {
                try {
                  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                  });
                  const info = await res.json();
                  if (info?.email) {
                    completeAuthWithProfile({
                      name: info.name || info.given_name || info.email.split('@')[0],
                      email: info.email.trim().toLowerCase(),
                      avatar: info.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${info.email}`,
                      provider: 'google',
                      verified: info.email_verified || true,
                      signedInAt: new Date().toISOString()
                    });
                  }
                } catch {
                  toast.error('Could not fetch Google profile.');
                }
              }
            },
          });
          setTokenClient(client);
        } catch (err) {
          console.warn('Google OAuth init note:', err);
        }
      }

      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
          });
        } catch (e) {
          console.warn('GSI init error:', e);
        }
      }
    };

    const timer = setTimeout(initGoogleOAuth, 500);
    return () => clearTimeout(timer);
  }, [completeAuthWithProfile, handleGoogleCredentialResponse]);

  const handleGoogleSignIn = () => {
    // If a custom cloud client ID is provided in .env, attempt OAuth
    const customClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (customClientId && tokenClient) {
      try {
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch {
        // fallback
      }
    }

    const emailEl = document.querySelector('input[name="customEmailInput"]');
    if (emailEl && emailEl.value.trim()) {
      handleCustomGoogleEmail(emailEl.value.trim());
    } else if (emailEl) {
      emailEl.focus();
      emailEl.classList.add('ring-2', 'ring-indigo-400');
      toast('Please enter your Google / Gmail address below', { icon: '📧' });
    }
  };

  const handleCustomGoogleEmail = (customEmail) => {
    const cleanEmail = (customEmail || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      toast.error('Please enter a valid email address (e.g. yourname@gmail.com)');
      return;
    }
    completeAuthWithProfile({
      name: cleanEmail.split('@')[0],
      email: cleanEmail,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${cleanEmail}`,
      provider: cleanEmail.includes('gmail') ? 'google' : 'email',
      verified: true,
      signedInAt: new Date().toISOString()
    });
  };

  const handleContinueAsGuest = () => {
    sessionStorage.setItem('visitor_guest', 'true');
    setShowAuthGate(false);
  };

  const handleSignOut = () => {
    localStorage.removeItem('visitor_user');
    sessionStorage.removeItem('visitor_guest');
    setUserAuth(null);
    setBooking(prev => ({ ...prev, email: '' }));
    setUserTickets([]);
    setHistoryEmail('');
    setShowAuthGate(true);
    toast.success('Signed out');
  };

  /* ── Language Switcher Handler ── */
  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem('chatbot_lang', newLang);
    const newT = getTranslation(newLang);
    const target = selectedMuseum || museums[0];
    const greeting = target 
      ? `${newT.welcomeTo} **${target.museumName}**! 🏛️\n${newT.howCanIHelp}`
      : newT.welcomeMuseumTicket;
    addBot(greeting);
    toast.success(`Language: ${LANGUAGES.find(l => l.code === newLang)?.native || newLang}`);
  };

  /* ── AI Guide Handler ── */
  const handleAskAi = async () => {
    const question = textInput.trim();
    if (!question) return;
    setTextInput('');
    addUser(question);
    setAiLoading(true);
    setAiSuggestedAction(null);
    try {
      const target = selectedMuseum || museums[0];
      const context = target
        ? `Museum: ${target.museumName}. Location: ${target.location || ''}. ` +
          `Adult price: ₹${target.adultPrice || target.adultTicketPrice || 0}. ` +
          `Child price: ₹${target.childPrice || target.childTicketPrice || 0}. ` +
          `Timings: ${target.openingTime || '09:00'} - ${target.closingTime || '17:00'}.`
        : 'A museum ticketing platform.';

      const lowerQ = question.toLowerCase();
      let answer = '';

      if (lowerQ.includes('price') || lowerQ.includes('ticket') || lowerQ.includes('cost') || lowerQ.includes('fee')) {
        answer = target
          ? `🎫 Ticket prices at **${target.museumName}**:\n\n👨 Adult: ₹${target.adultPrice || target.adultTicketPrice || 0}\n👦 Child: ₹${target.childPrice || target.childTicketPrice || 0}\n\nWould you like to book a ticket?`
          : t.noMuseumAvailable;
        setAiSuggestedAction({ type: 'BOOK', label: t.menuBookTicket });
      } else if (lowerQ.includes('time') || lowerQ.includes('hour') || lowerQ.includes('open') || lowerQ.includes('close')) {
        answer = target
          ? `🕐 **${target.museumName}** is open:\n\n✅ ${target.openingTime || '09:00'} – ${target.closingTime || '17:00'} daily`
          : t.noMuseumAvailable;
      } else if (lowerQ.includes('park') || lowerQ.includes('parking')) {
        const hasParking = target?.amenities?.includes('PARKING');
        answer = target
          ? (hasParking ? `🚗 Yes! **${target.museumName}** has parking available.` : `🚗 Parking information not available. Please contact the museum directly.`)
          : t.noMuseumAvailable;
      } else if (lowerQ.includes('wheel') || lowerQ.includes('disable') || lowerQ.includes('access')) {
        const hasWheel = target?.amenities?.includes('WHEELCHAIR');
        answer = target
          ? (hasWheel ? `♿ Yes! **${target.museumName}** is wheelchair accessible.` : `♿ Wheelchair accessibility information not confirmed. Please contact the museum.`)
          : t.noMuseumAvailable;
      } else if (lowerQ.includes('show') || lowerQ.includes('event') || lowerQ.includes('exhibit')) {
        if (shows.length > 0) {
          answer = `🎭 Current shows:\n\n` + shows.slice(0, 3).map(s => `• **${s.showName || s.name}** - ₹${s.price}`).join('\n');
          setAiSuggestedAction({ type: 'SHOWS', label: t.menuSpecialShows });
        } else {
          answer = target
            ? `🏛️ **${target.museumName}** has a rich collection of exhibits. Visit us to explore our galleries!`
            : t.noMuseumAvailable;
        }
      } else if (lowerQ.includes('book') || lowerQ.includes('reserv') || lowerQ.includes('buy')) {
        answer = `🎫 I can help you book tickets! Click **Book Ticket** to get started.`;
        setAiSuggestedAction({ type: 'BOOK', label: t.menuBookTicket });
      } else {
        answer = target
          ? `🏛️ Welcome to **${target.museumName}**!\n\n${context}\n\nI can help with ticket prices, timings, shows, parking, and booking. What would you like to know?`
          : `🏛️ Welcome to Museum Ticket Booking! I can help with ticket prices, museum timings, special shows, and bookings. What would you like to know?`;
      }

      addBot(answer);
    } catch {
      addBot('Sorry, I could not process your question. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  /* ── MAIN MENU OPTIONS ── */
  const mainMenuOptions = [
    { label: t.menuViewPrices,      step: STEP.VIEW_PRICES },
    { label: t.menuTimings,         step: STEP.VIEW_TIMINGS },
    { label: t.menuContact,         step: STEP.VIEW_CONTACT },
    { label: t.menuSpecialShows,    step: STEP.VIEW_SHOWS },
    { label: t.menuBookTicket,      step: STEP.BOOK_SELECT_TICKETS },
  ];

  /* ── MAIN MENU HANDLER ── */
  const handleMainMenu = (option) => {
    addUser(option.label);
    setStep(option.step);

    if (option.step === STEP.VIEW_PRICES) {
      const target = selectedMuseum || museums[0];
      if (!target) return;
      addBot(
        `**${target.museumName} - ${t.menuViewPrices}**\n\n` +
        `👨 ${t.adults}: ${fmtPrice(target.adultPrice || target.adultTicketPrice)}\n` +
        `👦 ${t.children}: ${fmtPrice(target.childPrice || target.childTicketPrice)}`
      );
    }

    if (option.step === STEP.VIEW_TIMINGS) {
      const target = selectedMuseum || museums[0];
      if (!target) return;
      let timingsText = `**${target.museumName} - ${t.menuTimings}**\n\n`;
      if (target.businessHours && target.businessHours.length > 0) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        target.businessHours.forEach(bh => {
          const dayName = typeof bh.dayOfWeek === 'number' ? days[bh.dayOfWeek] : bh.dayOfWeek;
          if (bh.isClosed) {
            timingsText += `❌ ${dayName}: Closed\n`;
          } else {
            const formatTime = (timeStr) => {
              if (!timeStr) return '';
              const [hours, minutes] = timeStr.split(':');
              const d = new Date();
              d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
              return d.toLocaleTimeString('en-US', {hour: '2-digit', minute:'2-digit'});
            };
            timingsText += `✅ ${dayName}: ${formatTime(bh.openTime)} - ${formatTime(bh.closeTime)}\n`;
          }
        });
      } else {
        timingsText += `✅ ${t.today}: ${target.openingTime || '09:00'} - ${target.closingTime || '17:00'}\n`;
      }
      addBot(timingsText);
    }

    if (option.step === STEP.VIEW_CONTACT) {
      const target = selectedMuseum || museums[0];
      if (!target) return;
      const addressText = target.address ? target.address : [target.landmark, target.city, target.state, target.pincode].filter(Boolean).join(', ');
      
      addBot(
        `**${target.museumName} - ${t.menuContact}**\n\n` +
        `📧 ${t.contactEmail}: ${target.publicEmail || 'Not provided'}\n` +
        `📞 ${t.contactPhone}: ${target.publicPhone || 'Not provided'}\n` +
        `📍 ${t.museumLabel}: ${addressText || target.location || 'Not provided'}`
      );
    }

    if (option.step === STEP.VIEW_SHOWS) {
      if (shows.length === 0) {
        addBot('No special shows are currently scheduled.');
      } else {
        const list = shows.map(s =>
          `🎭 **${s.showName || s.name}**\n   📅 ${fmtDate(s.showTime)} at ${fmtTime(s.showTime)}\n   💰 ${fmtPrice(s.price)} per ticket\n   🎟️ ${s.availableSeats} seats left`
        ).join('\n\n');
        addBot(`**${t.menuSpecialShows}**\n\n${list}`);
      }
    }

    if (option.step === STEP.BOOK_SELECT_TICKETS) {
      if (!selectedMuseum && museums.length === 0) {
        addBot(t.noMuseumAvailable);
        setStep(STEP.MAIN_MENU);
        return;
      }
      const target = selectedMuseum || museums[0];
      if (!target.bookingStatus) {
        addBot(t.closedWarning);
        setStep(STEP.MAIN_MENU);
        return;
      }
      if (target.seatLimit !== undefined && target.seatLimit <= 0) {
        addBot(t.noSeatsWarning);
        setStep(STEP.MAIN_MENU);
        return;
      }
      if (!selectedMuseum) setSelectedMuseum(target);
      addBot(`${t.selectTicketsPrompt} **${target.museumName}**:`);
    }
  };

  const handleSelectMuseum = (m) => {
    setSelectedMuseum(m);
    addBot(`${t.selectTicketsPrompt} **${m.museumName}**:`);
  };

  /* ── BOOKING FLOW STEPS ── */
  const handleTicketCount = () => {
    if (!selectedMuseum) {
      toast.error('Please select a museum first');
      return;
    }
    const adult = Number(selectedMuseum.adultPrice || selectedMuseum.adultTicketPrice || 0);
    const child = Number(selectedMuseum.childPrice || selectedMuseum.childTicketPrice || 0);
    const total = booking.adults * adult + booking.children * child;

    addUser(`${booking.adults} ${t.adults}, ${booking.children} ${t.children}`);
    setTotalPrice(total);

    // If user already logged in with Google, auto-fill email and go directly to Phone step
    if (userAuth?.email) {
      setBooking(p => ({ ...p, email: userAuth.email }));
      addBot(
        `**${t.bookingDetailsTitle}**\n\n` +
        `👨 ${booking.adults} ${t.adults} × ${fmtPrice(adult)} = ${fmtPrice(booking.adults * adult)}\n` +
        `👦 ${booking.children} ${t.children} × ${fmtPrice(child)} = ${fmtPrice(booking.children * child)}\n` +
        `─────────────────\n` +
        `💰 **${t.totalPayable}: ${fmtPrice(total)}**\n` +
        `📧 ${t.contactEmail}: **${userAuth.email}** (Google Account)\n\n` +
        `${t.enterPhonePrompt}`
      );
      setStep(STEP.BOOK_PHONE);
    } else {
      addBot(
        `**${t.bookingDetailsTitle}**\n\n` +
        `👨 ${booking.adults} ${t.adults} × ${fmtPrice(adult)} = ${fmtPrice(booking.adults * adult)}\n` +
        `👦 ${booking.children} ${t.children} × ${fmtPrice(child)} = ${fmtPrice(booking.children * child)}\n` +
        `─────────────────\n` +
        `💰 **${t.totalPayable}: ${fmtPrice(total)}**\n\n` +
        `${t.enterEmailPrompt}`
      );
      setStep(STEP.BOOK_EMAIL);
    }
  };

  const handleEmailSubmit = () => {
    const email = textInput.trim();
    if (!email || !email.includes('@')) { toast.error('Enter a valid email'); return; }
    setBooking(p => ({ ...p, email }));
    setTextInput('');
    addUser(email);
    addBot(`${t.enterPhonePrompt}`);
    setStep(STEP.BOOK_PHONE);
  };

  const handlePhoneSubmit = () => {
    const phone = textInput.trim();
    if (!phone || phone.length < 6) { toast.error('Enter a valid phone number'); return; }
    setBooking(p => ({ ...p, phone }));
    setTextInput('');
    addUser(phone);

    addBot(
      `**${t.bookingDetailsTitle}**\n\n` +
      `🏛️ ${t.museumLabel}: ${selectedMuseum.museumName}\n` +
      `👤 ${booking.adults} ${t.adults} + ${booking.children} ${t.children}\n` +
      `📧 ${t.contactEmail}: ${booking.email}\n` +
      `📞 ${t.contactPhone}: ${phone}\n` +
      `💰 ${t.totalPayable}: ${fmtPrice(totalPrice)}\n\n` +
      `${t.pleaseConfirmDetails}`
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
      addBot(`🎫 ${t.ticketNumberLabel}: **#${ticket.ticketNumber}**\n\nRedirecting to secure payment…`);

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
            toast.success(t.paymentSuccessTitle);
            addBot(
              `✅ **${t.paymentSuccessTitle}**\n\n` +
              `🎫 ${t.ticketNumberLabel}: **#${bookingResult.ticketNumber}**\n` +
              `🏛️ ${t.museumLabel}: ${selectedMuseum.museumName}\n` +
              `📧 ${t.confirmationSentTo} ${booking.email}\n\n` +
              `**${t.entryInstructionsTitle}**\n` +
              `${t.entryStep1}\n` +
              `${t.entryStep2}\n` +
              `${t.entryStep3}\n` +
              `${t.entryStep4}`
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
  const fetchTicketsForEmail = async (emailToFetch) => {
    if (!emailToFetch || !emailToFetch.includes('@')) return;
    setLoadingHistory(true);
    try {
      const res = await api.ticketAPI.getUserTickets(emailToFetch.trim());
      setUserTickets(res.data || res || []);
    } catch {
      toast.error('Failed to fetch tickets');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFetchHistory = async () => {
    if (!historyEmail.trim() || !historyEmail.includes('@')) {
      toast.error('Enter a valid email'); return;
    }
    fetchTicketsForEmail(historyEmail.trim());
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
    setBooking({ 
      adults: 1, 
      children: 0, 
      email: userAuth?.email || '', 
      phone: '' 
    });
    setOrderData(null);
    setBookingResult(null);
    setAiSuggestedAction(null);
    addBot(t.howCanIHelp);
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

  /* ── BOTTOM ACTION AREA ── */
  const renderActions = () => {
    if (showHistory) return null;

    switch (step) {
      case STEP.MAIN_MENU:
      case STEP.ASK_AI:
        return (
          <div className="p-3.5 space-y-2.5 bg-gray-50/90">
            {/* Logged in User Pill indicator */}
            {userAuth && (
              <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-1.5 text-xs text-indigo-900">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs text-[10px] font-black text-indigo-600">
                    G
                  </div>
                  <span className="truncate font-medium text-[11px]">
                    {userAuth.email}
                  </span>
                </div>
                <button 
                  onClick={() => setShowHistory(true)} 
                  className="text-indigo-600 hover:text-indigo-800 font-bold text-[11px] flex-shrink-0 ml-2">
                  My Tickets →
                </button>
              </div>
            )}

            {/* AI Action button if recommended */}
            {aiSuggestedAction && (
              <div className="animate-fadeIn">
                <button
                  onClick={() => {
                    if (aiSuggestedAction.type === 'BOOK') {
                      handleMainMenu({ label: t.menuBookTicket, step: STEP.BOOK_SELECT_TICKETS });
                    } else if (aiSuggestedAction.type === 'SHOWS') {
                      handleMainMenu({ label: t.menuSpecialShows, step: STEP.VIEW_SHOWS });
                    }
                  }}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2 px-3.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
                  {aiSuggestedAction.label}
                </button>
              </div>
            )}

            {/* Main Menu tiles - Clean, compact, no ugly text truncation */}
            <div className="grid grid-cols-2 gap-2">
              {mainMenuOptions.map(opt => (
                <button key={opt.step}
                  onClick={() => handleMainMenu(opt)}
                  className="flex items-center justify-between bg-white hover:bg-indigo-50/80 border border-gray-200 hover:border-indigo-400 text-gray-800 px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs group text-left">
                  <span className="leading-snug break-words">{opt.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-indigo-500 flex-shrink-0 ml-1" />
                </button>
              ))}
            </div>

            {/* Conversational Text & AI Input - High contrast, clearly visible */}
            <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
              <input
                type="text"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAskAi()}
                placeholder={t.typeYourQuestion}
                className="flex-1 px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all shadow-xs"
              />
              <button
                onClick={() => handleAskAi()}
                disabled={aiLoading || !textInput.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white p-2.5 rounded-xl transition-all shadow-sm flex-shrink-0 flex items-center justify-center">
                <Send className="h-4 w-4" />
              </button>
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
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5">
              <ArrowLeft className="h-4 w-4" /> {t.backToMenu}
            </button>
            <button onClick={() => handleMainMenu({ label: t.menuBookTicket, step: STEP.BOOK_SELECT_TICKETS })}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md">
              {t.menuBookTicket}
            </button>
          </div>
        );

      case STEP.BOOK_SELECT_TICKETS:
        return (
          <div className="p-4 space-y-3">
            {/* Direct Number Input Ticket Counter */}
            <div className="bg-gray-50 rounded-2xl p-3.5 grid grid-cols-2 gap-3 border border-gray-200 shadow-xs">
              {/* Adults Direct Number Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-gray-800">
                    👨 {t.adults}
                  </span>
                  <span className="text-[11px] font-semibold text-indigo-600">
                    {selectedMuseum && fmtPrice(selectedMuseum.adultPrice || selectedMuseum.adultTicketPrice)}
                  </span>
                </div>
                
                {/* Direct Number Input */}
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={booking.adults === 0 ? '' : booking.adults}
                  onChange={e => {
                    const val = parseInt(e.target.value, 10);
                    setBooking(p => ({ ...p, adults: isNaN(val) ? 0 : Math.max(0, val) }));
                  }}
                  placeholder="0"
                  className="w-full text-center text-xl font-black bg-white border-2 border-indigo-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                />

                {/* Quick Selection Chips */}
                <div className="flex justify-between gap-1 pt-1">
                  {[1, 2, 3, 4].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setBooking(p => ({ ...p, adults: num }))}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                        booking.adults === num 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Children Direct Number Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-gray-800">
                    👦 {t.children}
                  </span>
                  <span className="text-[11px] font-semibold text-indigo-600">
                    {selectedMuseum && fmtPrice(selectedMuseum.childPrice || selectedMuseum.childTicketPrice)}
                  </span>
                </div>

                {/* Direct Number Input */}
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={booking.children === 0 ? '' : booking.children}
                  onChange={e => {
                    const val = parseInt(e.target.value, 10);
                    setBooking(p => ({ ...p, children: isNaN(val) ? 0 : Math.max(0, val) }));
                  }}
                  placeholder="0"
                  className="w-full text-center text-xl font-black bg-white border-2 border-indigo-200 rounded-xl py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                />

                {/* Quick Selection Chips */}
                <div className="flex justify-between gap-1 pt-1">
                  {[0, 1, 2, 3].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setBooking(p => ({ ...p, children: num }))}
                      className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                        booking.children === num 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {totalPrice > 0 && (
              <div className="text-center text-sm font-black text-indigo-700 bg-indigo-50 rounded-xl py-2 border border-indigo-100 flex items-center justify-center gap-1.5">
                <span>💰 {t.totalPayable}:</span>
                <span className="text-base text-indigo-800">{fmtPrice(totalPrice)}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setStep(STEP.MAIN_MENU)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-xs font-bold transition-all">
                ← {t.back}
              </button>
              <button onClick={handleTicketCount}
                disabled={!selectedMuseum || booking.adults + booking.children === 0}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md">
                {t.continueBtn}
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
              placeholder={t.emailPlaceholder}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs" />
            <button onClick={handleEmailSubmit}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md">
              {t.continueBtn}
            </button>
          </div>
        );

      case STEP.BOOK_PHONE:
        return (
          <div className="p-4 space-y-2">
            <input type="tel" value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handlePhoneSubmit()}
              placeholder={t.phonePlaceholder}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-xs" />
            <button onClick={handlePhoneSubmit}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md">
              {t.continueBtn}
            </button>
          </div>
        );

      /* ── SHOW BOOKING DETAILS IN CHOSEN LANGUAGE ── */
      case STEP.BOOK_CONFIRM:
        const adultUnit = Number(selectedMuseum?.adultPrice || selectedMuseum?.adultTicketPrice || 0);
        const childUnit = Number(selectedMuseum?.childPrice || selectedMuseum?.childTicketPrice || 0);
        const currentLangObj = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

        return (
          <div className="p-4 space-y-3">
            {/* Rich Booking Details Summary Card */}
            <div className="bg-gradient-to-br from-indigo-50/90 to-purple-50/90 border border-indigo-200 rounded-2xl p-4 shadow-sm text-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <span className="font-extrabold text-indigo-950 text-xs sm:text-sm flex items-center gap-1.5">
                  <Ticket className="h-4 w-4 text-indigo-600" />
                  {t.bookingDetailsTitle}
                </span>
                <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span>{currentLangObj.flag}</span>
                  <span>{currentLangObj.native}</span>
                </span>
              </div>

              {/* Museum Info */}
              <div className="flex justify-between items-center py-1 border-b border-indigo-50">
                <span className="text-gray-500 font-medium">🏛️ {t.museumLabel}</span>
                <span className="font-bold text-gray-900 text-right max-w-[200px] truncate">{selectedMuseum?.museumName}</span>
              </div>

              {/* Visitors breakdown */}
              <div className="flex justify-between items-center py-1 border-b border-indigo-50">
                <span className="text-gray-500 font-medium">👥 {t.visitorsLabel}</span>
                <span className="font-bold text-indigo-800">
                  {booking.adults > 0 && `${booking.adults} ${t.adults}`}
                  {booking.adults > 0 && booking.children > 0 && ' + '}
                  {booking.children > 0 && `${booking.children} ${t.children}`}
                </span>
              </div>

              {/* Price Details */}
              <div className="bg-white/80 rounded-xl p-2.5 border border-indigo-100 space-y-1">
                {booking.adults > 0 && (
                  <div className="flex justify-between text-[11px] text-gray-600">
                    <span>{booking.adults} × {t.adultPriceLabel} ({fmtPrice(adultUnit)})</span>
                    <span className="font-semibold">{fmtPrice(booking.adults * adultUnit)}</span>
                  </div>
                )}
                {booking.children > 0 && (
                  <div className="flex justify-between text-[11px] text-gray-600">
                    <span>{booking.children} × {t.childPriceLabel} ({fmtPrice(childUnit)})</span>
                    <span className="font-semibold">{fmtPrice(booking.children * childUnit)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1.5 border-t border-indigo-100 font-black text-sm text-indigo-900">
                  <span>💰 {t.totalPayable}</span>
                  <span className="text-base text-indigo-700">{fmtPrice(totalPrice)}</span>
                </div>
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-gray-600">
                <div className="truncate">
                  <span className="text-gray-400 block text-[10px]">📧 {t.contactEmail}</span>
                  <span className="font-semibold truncate block">{booking.email}</span>
                </div>
                <div className="truncate">
                  <span className="text-gray-400 block text-[10px]">📞 {t.contactPhone}</span>
                  <span className="font-semibold truncate block">{booking.phone}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={() => setStep(STEP.BOOK_SELECT_TICKETS)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-xs font-bold transition-all">
                ← {t.back}
              </button>
              <button onClick={handleConfirmBooking} disabled={loading}
                className="flex-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5">
                {loading ? t.creatingBooking : t.confirmAndPay}
              </button>
            </div>
          </div>
        );

      case STEP.PAYMENT:
        return (
          <div className="p-4 space-y-3">
            {orderData && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-xs space-y-1.5">
                <p className="font-bold text-indigo-900 text-sm">{t.paymentSummary}</p>
                <div className="flex justify-between text-gray-600">
                  <span>{t.museumLabel}</span>
                  <span className="font-semibold">{orderData.museumName}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t.ticketNumberLabel}</span>
                  <span className="font-mono font-semibold">#{orderData.ticketNumber}</span>
                </div>
                <div className="flex justify-between text-gray-800 font-bold border-t border-indigo-200 pt-1.5">
                  <span>{t.totalPayable}</span>
                  <span className="text-indigo-700">{fmtPrice(orderData.amount / 100)}</span>
                </div>
              </div>
            )}
            <button onClick={handlePayNow}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2">
              <CreditCard className="h-4 w-4" /> {t.payNow}
            </button>
          </div>
        );

      case STEP.SUCCESS:
        return (
          <div className="p-4 grid grid-cols-2 gap-2">
            <button onClick={() => { setShowHistory(true); setHistoryEmail(booking.email); }}
              className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 py-3 rounded-xl text-xs font-bold transition-all">
              {t.viewTicketBtn}
            </button>
            <button onClick={resetToMenu}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md">
              {t.mainMenuBtn}
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
        <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
          <Ticket className="h-4 w-4 text-indigo-600" />
          {t.myTicketsTitle}
        </h3>
        <button onClick={() => { setShowHistory(false); setValidatingTicket(null); setValidCode(''); }}
          className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Validating a ticket */}
      {validatingTicket && (
        <div className="flex-1 overflow-y-auto p-5">
          <button onClick={() => { setValidatingTicket(null); setValidCode(''); }}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="h-4 w-4" /> {t.back}
          </button>
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
            <p className="text-xs text-indigo-600 font-bold mb-1">{validatingTicket.museumName}</p>
            <p className="font-mono text-xs font-extrabold text-indigo-900">#{validatingTicket.ticketNumber}</p>
            <p className="text-xs text-gray-500 mt-1">
              {validatingTicket.adults} {t.adults}, {validatingTicket.children} {t.children}
            </p>
          </div>
          <p className="text-xs font-bold text-gray-700 mb-2">{t.enterMuseumCodePrompt}</p>
          <div className="relative mb-4">
            <input type={showCode ? 'text' : 'password'} maxLength={4}
              value={validCode}
              onChange={e => setValidCode(e.target.value.replace(/\D/g, ''))}
              placeholder="0000"
              className="w-full text-center text-2xl font-mono font-bold tracking-[0.5em] px-4 py-3 border-2 border-indigo-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button onClick={() => setShowCode(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <button onClick={handleValidateTicket} disabled={validCode.length !== 4 || loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md">
            {loading ? t.verifyingTicket : t.validateTicketBtn}
          </button>
          <p className="text-[11px] text-gray-400 text-center mt-2">{t.staffCodeHint}</p>
        </div>
      )}

      {/* Email input */}
      {!validatingTicket && userTickets.length === 0 && (
        <div className="flex-1 flex flex-col p-5">
          <p className="text-xs text-gray-600 mb-3">{t.enterEmailToView}</p>
          <input type="email" value={historyEmail}
            onChange={e => setHistoryEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleFetchHistory()}
            placeholder={t.enterEmailPlaceholder}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-xs mb-3" />
          <button onClick={handleFetchHistory} disabled={loadingHistory}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold text-xs transition-all shadow-md">
            {loadingHistory ? 'Loading…' : t.viewTicketsBtn}
          </button>
        </div>
      )}

      {/* Ticket list */}
      {!validatingTicket && userTickets.length > 0 && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between mb-1 px-1">
            <p className="text-xs text-gray-500 font-medium">{userTickets.length} {t.ticketCountFor} <span className="font-bold text-gray-800">{historyEmail}</span></p>
            <button onClick={() => { setUserTickets([]); setHistoryEmail(''); }}
              className="text-xs text-indigo-600 font-bold hover:underline">{t.changeEmailBtn}</button>
          </div>
          {userTickets.map(ticket => (
            <div key={ticket.id} className="space-y-2">
              <TicketCard ticket={ticket} />
              {ticket.status === 'ACTIVE' && (
                <button
                  onClick={() => { setValidatingTicket(ticket); setValidCode(''); }}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  🔐 Enter Staff Code (Validate Entry)
                </button>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 py-4 flex items-center justify-center px-4 relative">
      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Phone-style chatbot frame */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col relative"
          style={{ height: 'calc(100vh - 100px)', maxHeight: '780px' }}>

          {/* ── Header with Language Switcher & User Account ── */}
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 px-4 py-3.5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="bg-white/20 p-2 rounded-full flex-shrink-0">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3L2 9h20L12 3zM4 9v8h16V9M8 17v-5h3v5M13 17v-5h3v5" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-white font-bold text-xs sm:text-sm leading-tight">
                  {museum?.museumName || 'Museum Assistant'}
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse flex-shrink-0" />
                  <span className="text-white/80 text-[11px]">{t.onlineStatus}</span>
                </div>
              </div>
            </div>

            {/* Right Controls: Language Selector, History, User profile */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Language Switcher Dropdown */}
              <div className="relative">
                <select
                  value={lang}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-white/20 hover:bg-white/30 text-white text-[11px] font-bold py-1.5 pl-2 pr-6 rounded-full border border-white/30 outline-none cursor-pointer backdrop-blur-sm transition-all appearance-none"
                  title="Change Language">
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code} className="text-gray-900 bg-white">
                      {l.flag} {l.native}
                    </option>
                  ))}
                </select>
                <Globe className="h-3 w-3 text-white/70 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* User Account / Continue with Google */}
              {userAuth ? (
                <div className="relative">
                  {/* Email pill — click to toggle logout dropdown */}
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors max-w-[160px]">
                    <div className="w-5 h-5 rounded-full bg-indigo-400 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-xs">
                      {(userAuth.name || userAuth.email)[0].toUpperCase()}
                    </div>
                    <span className="truncate">{userAuth.email}</span>
                    <ChevronRight className={`h-3 w-3 shrink-0 transition-transform ${showProfileMenu ? 'rotate-90' : ''}`} />
                  </button>

                  {/* Logout dropdown */}
                  {showProfileMenu && (
                    <>
                      {/* Invisible overlay to close dropdown */}
                      <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                      <div className="absolute right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-200 py-2 px-1 z-50 min-w-[180px]">
                        {/* User info */}
                        <div className="px-3 py-2 border-b border-gray-100">
                          <p className="text-xs font-semibold text-gray-800">{userAuth.name || 'User'}</p>
                          <p className="text-[10px] text-gray-500 truncate">{userAuth.email}</p>
                        </div>
                        {/* Logout button */}
                        <button
                          onClick={() => { setShowProfileMenu(false); handleSignOut(); }}
                          className="w-full flex items-center gap-2 px-3 py-2.5 mt-1 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <LogOut className="h-3.5 w-3.5" />
                          <span className="font-semibold">Logout</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthGate(true)}
                  className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition-colors">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24"><path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  <span>Continue with Google</span>
                </button>
              )}

              {/* View Tickets History — only show when logged in */}
              {userAuth && (
                <button
                  onClick={() => { setShowHistory(true); }}
                  className="bg-white/20 hover:bg-white/30 transition-colors p-2 rounded-full text-white"
                  title={t.viewMyTickets}>
                  <History className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* ── Content ── */}
          <div className="flex-1 overflow-hidden relative">

            {/* CHAT AREA */}
            <div className={`absolute inset-0 flex flex-col transition-transform duration-300 ${showHistory ? '-translate-x-full' : 'translate-x-0'}`}>
              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6">
                    <div className="bg-indigo-100 p-4 rounded-full mb-3">
                      <Bot className="h-10 w-10 text-indigo-600" />
                    </div>
                    <p className="text-gray-500 text-xs">{t.loadingMuseum}</p>
                  </div>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      msg.type === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-xs'
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    }`}>
                      {renderMessageText(msg.text)}
                    </div>
                  </div>
                ))}

                {/* AI Thinking Animation */}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl rounded-bl-none px-4 py-2.5 flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600 animate-spin" />
                      <span className="text-xs text-indigo-700 font-medium">{t.aiThinking}</span>
                    </div>
                  </div>
                )}

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

            {/* ── GOOGLE AUTH GATE MODAL ("Choose an account" like Google OAuth Dialog) ── */}
            {showAuthGate && (
              <div className="absolute inset-0 z-40 bg-gradient-to-br from-slate-900/90 via-indigo-950/90 to-purple-950/90 backdrop-blur-md flex flex-col justify-center items-center p-4 sm:p-6 animate-fadeIn">
                
                {/* Google Dialog Box Container */}
                <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 text-left animate-slide-in">
                  
                  {/* Google Header */}
                  <div className="px-6 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Google G Logo */}
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      <span className="text-xs font-semibold text-gray-700">Sign in with Google</span>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-indigo-600" />
                    </div>
                  </div>

                  {/* Body: Choose an account */}
                  <div className="p-5 sm:p-6">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                      Choose an account
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 mb-4">
                      to continue to <span className="font-bold text-indigo-600">{museum?.museumName || 'Museum Ticket'}</span>
                    </p>

                    {/* Google Accounts List */}
                    <div className="space-y-0.5 divide-y divide-gray-100">
                      {googleAccounts.map((acc, idx) => (
                        <button
                          key={acc.email || idx}
                          onClick={() => {
                            completeAuthWithProfile({
                              name: acc.name,
                              email: acc.email.toLowerCase().trim(),
                              avatar: acc.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${acc.email}`,
                              provider: 'google',
                              verified: true,
                              signedInAt: new Date().toISOString()
                            });
                          }}
                          className="w-full flex items-center gap-3.5 py-3 px-2 rounded-xl hover:bg-gray-50 transition-all text-left group"
                        >
                          {/* Avatar Circle */}
                          {acc.avatar && acc.avatar.includes('bottts') ? (
                            <img src={acc.avatar} alt={acc.name} className="w-9 h-9 rounded-full bg-slate-900 object-cover flex-shrink-0" />
                          ) : (
                            <div className={`w-9 h-9 rounded-full ${acc.bgColor || 'bg-indigo-600'} text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform`}>
                              {acc.initial || acc.name.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                              {acc.name}
                            </p>
                            <p className="text-[11px] text-gray-500 truncate">
                              {acc.email}
                            </p>
                          </div>
                        </button>
                      ))}

                      {/* Use Another Account Button */}
                      {!showUseAnother ? (
                        <button
                          onClick={() => setShowUseAnother(true)}
                          className="w-full flex items-center gap-3.5 py-3 px-2 rounded-xl hover:bg-gray-50 transition-all text-left text-gray-700 hover:text-indigo-600 font-medium text-xs group"
                        >
                          <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                            <User className="h-4 w-4" />
                          </div>
                          <span>Use another account</span>
                        </button>
                      ) : (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (customEmailValue.trim()) {
                              handleCustomGoogleEmail(customEmailValue.trim());
                            }
                          }}
                          className="pt-3 space-y-2"
                        >
                          <input
                            type="email"
                            required
                            autoFocus
                            value={customEmailValue}
                            onChange={(e) => setCustomEmailValue(e.target.value)}
                            placeholder="Enter your Gmail / email"
                            className="w-full px-3.5 py-2.5 bg-white border-2 border-indigo-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setShowUseAnother(false)}
                              className="flex-1 py-2 text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-xl"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                            >
                              Next →
                            </button>
                          </div>
                        </form>
                      )}
                    </div>

                    {/* Disclaimer */}
                    <div className="mt-5 pt-3 border-t border-gray-100 text-[10px] text-gray-400 text-center leading-relaxed">
                      Before using this app, you can review Museum Ticket's <span className="text-indigo-600 font-medium">Privacy Policy</span> and <span className="text-indigo-600 font-medium">Terms of Service</span>.
                    </div>

                    <button
                      type="button"
                      onClick={handleContinueAsGuest}
                      className="w-full text-center text-xs text-gray-400 hover:text-gray-600 font-semibold mt-2.5 transition-colors"
                    >
                      Continue as Guest →
                    </button>

                  </div>
                </div>

              </div>
            )}

          </div>
        </div>

        {/* Bottom hint */}
        <p className="text-center text-white/50 text-xs mt-3 flex items-center justify-center gap-1">
          <span>🌐 Switch language anytime from the top bar</span> · 
          <span>Tap <History className="inline h-3 w-3" /> for ticket history</span>
        </p>
      </div>
    </div>
  );
};

export default MuseumChatbot;
