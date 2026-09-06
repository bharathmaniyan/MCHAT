import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, BarChart3, Ticket, Zap, Settings, QrCode, Download,
  Plus, Trash2, Users, Calendar, Eye, EyeOff,
  Shield, ToggleLeft, ToggleRight, RefreshCw, CheckCircle,
  XCircle, DollarSign, MapPin, RefreshCcw, Copy, Check,
  User, Image as ImageIcon, MessageSquare, Sparkles, Home, Globe,
  TrendingUp, Activity, Search, ChevronRight, Clock, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import * as api from '../services/api';
import { LANGUAGES, getTranslation } from '../utils/translations';

import ProfileEditor from '../components/owner/ProfileEditor';
import MediaManager from '../components/owner/MediaManager';
import ReviewManager from '../components/owner/ReviewManager';
import AnalyticsDashboard from '../components/owner/AnalyticsDashboard';
import AiCopilotTab from '../components/owner/AiCopilotTab';
import { useOwnerRealtime } from '../hooks/useOwnerRealtime';
import { QRCodeCanvas } from 'qrcode.react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const museumId   = localStorage.getItem('museumId');
  const museumName = localStorage.getItem('museumName');
  
  const { liveStats, liveTickets, connectionStatus } = useOwnerRealtime(museumId);

  /* Language state */
  const [lang, setLang] = useState(() => localStorage.getItem('admin_lang') || 'en');
  const t = getTranslation(lang);

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem('admin_lang', newLang);
    toast.success(`Language: ${LANGUAGES.find(l => l.code === newLang)?.native || newLang}`);
  };

  const [activeTab, setActiveTab]   = useState('overview');
  const [loading,   setLoading]     = useState(true);
  const [stats,     setStats]       = useState(null);
  const [analyticsRange, setAnalyticsRange] = useState('30d');
  const [tickets,   setTickets]     = useState([]);
  const [shows,     setShows]       = useState([]);
  const [museum,    setMuseum]      = useState(null);
  const [reviews,   setReviews]     = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [newShow,  setNewShow]  = useState({ name:'', showTime:'', price:'', seatLimit:'', description:'' });

  const [settingsForm,   setSettingsForm]   = useState({ adultPrice:'', childPrice:'', seatLimit:'', openingTime:'09:00', closingTime:'17:00' });
  const [savingSettings, setSavingSettings] = useState(false);
  const [bookingToggling,setBookingToggling]= useState(false);

  const [showPin,         setShowPin]         = useState(false);
  const [pinCopied,       setPinCopied]       = useState(false);
  const [regeneratingPin, setRegeneratingPin] = useState(false);

  const [searchTerm,      setSearchTerm]      = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedTicket,  setSelectedTicket]  = useState(null);
  const [verifyCode,      setVerifyCode]      = useState('');
  const [showVerifyPin,   setShowVerifyPin]   = useState(false);

  useEffect(() => {
    if (!museumId) { navigate('/admin-login'); return; }
    fetchAll();
    const id = setInterval(() => fetchAll(true), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (museumId) {
      api.ownerAPI.getAnalytics(analyticsRange).then(r => setStats(r.data || r)).catch(() => {});
    }
  }, [analyticsRange]);

  const fetchAll = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [sR, tR, shR, mR] = await Promise.all([
        api.ownerAPI.getAnalytics(analyticsRange),
        api.ticketAPI.getMuseumTickets(museumId),
        api.showAPI.getMuseumShows(museumId),
        api.ownerAPI.getProfile(),
      ]);
      const s  = sR?.data  ?? sR;
      const t  = tR?.data  ?? tR  ?? [];
      const sh = shR?.data ?? shR ?? [];
      const m  = mR?.data  ?? mR;
      setStats(s);
      setTickets(Array.isArray(t)  ? t  : []);
      setShows(Array.isArray(sh) ? sh : []);
      setMuseum(m);
      
      const revRes = await api.publicAPI.getMuseumReviews(m.slug || m.id, 0, 50);
      setReviews(revRes?.content || revRes?.data?.content || []);
      
      if (!silent) {
        setSettingsForm({
          adultPrice:  m?.adultPrice  ?? m?.adultTicketPrice ?? '',
          childPrice:  m?.childPrice  ?? m?.childTicketPrice ?? '',
          seatLimit:   m?.seatLimit   ?? '',
          openingTime: m?.openingTime ?? '09:00',
          closingTime: m?.closingTime ?? '17:00',
        });
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        toast.error('Museum not found. Please login again.');
        localStorage.clear(); navigate('/admin-login'); return;
      }
      if (!silent) toast.error('Failed to load data');
    } finally { setLoading(false); }
  };

  const handleLogout = () => { localStorage.clear(); toast.success('Logged out'); navigate('/'); };

  const handleToggleBooking = async () => {
    if (!museum) return;
    setBookingToggling(true);
    try {
      await api.museumAPI.updateBookingStatus(museumId, !museum.bookingStatus);
      toast.success(`Booking ${!museum.bookingStatus ? 'OPENED ✅' : 'CLOSED 🔴'}`);
      fetchAll(true);
    } catch { toast.error('Failed'); }
    finally { setBookingToggling(false); }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await api.museumAPI.update(museumId, {
        adultPrice:  parseFloat(settingsForm.adultPrice)  || 0,
        childPrice:  parseFloat(settingsForm.childPrice)  || 0,
        seatLimit:   parseInt(settingsForm.seatLimit)     || 100,
        openingTime: settingsForm.openingTime,
        closingTime: settingsForm.closingTime,
      });
      toast.success('Settings saved! Chatbot updated instantly ✅');
      fetchAll(true);
    } catch { toast.error('Failed to save settings'); }
    finally { setSavingSettings(false); }
  };

  const handleRegeneratePin = async () => {
    if (!window.confirm('Generate a NEW 4-digit staff code?\n\nThe old code will stop working immediately.\nMake sure to update all your staff.')) return;
    setRegeneratingPin(true);
    try {
      await api.museumAPI.regeneratePin(museumId);
      toast.success('New staff PIN generated! Share it with your staff ✅');
      setShowPin(true);
      fetchAll(true);
    } catch { toast.error('Failed to regenerate PIN'); }
    finally { setRegeneratingPin(false); }
  };

  const handleCopyPin = () => {
    if (!museum?.staffPin) return;
    navigator.clipboard.writeText(museum.staffPin).then(() => {
      setPinCopied(true); setTimeout(() => setPinCopied(false), 2000);
    });
  };

  const handleCreateShow = async (e) => {
    e.preventDefault();
    try {
      await api.showAPI.create(museumId, {
        showName: newShow.name, showTime: newShow.showTime,
        price: parseFloat(newShow.price), seatLimit: parseInt(newShow.seatLimit),
        description: newShow.description,
      });
      toast.success('Show created 🎭 — visible in chatbot now');
      setNewShow({ name:'', showTime:'', price:'', seatLimit:'', description:'' });
      setShowForm(false); fetchAll(true);
    } catch { toast.error('Failed to create show'); }
  };

  const handleDeleteShow = async (id) => {
    if (!window.confirm('Delete this show?')) return;
    try { await api.showAPI.delete(id); toast.success('Show deleted'); fetchAll(true); }
    catch { toast.error('Failed'); }
  };

  const handlePhoneSearch = async (phone) => {
    setSearchTerm(phone);
    if (!phone.trim()) { fetchAll(true); return; }
    try {
      const res = await api.ticketAPI.getMuseumTicketsByPhone(museumId, phone);
      setTickets(res?.data ?? res ?? []);
    } catch { toast.error('Search failed'); }
  };

  const openVerifyModal = (ticket) => {
    setSelectedTicket(ticket); setVerifyCode(''); setShowVerifyPin(false); setShowVerifyModal(true);
  };

  const handleVerifyTicket = async () => {
    if (!selectedTicket || verifyCode.length !== 4) return;
    try {
      await api.ticketAPI.verify({ ticketId: selectedTicket.id, verificationCode: verifyCode, museumId });
      toast.success('Ticket verified! Entry granted ✅');
      setShowVerifyModal(false); setSelectedTicket(null); setVerifyCode('');
      fetchAll(true);
    } catch { toast.error('Invalid code. Check and retry.'); }
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById('museum-qr-code');
    if (!canvas) {
      toast.error('QR code not ready yet');
      return;
    }
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${museum?.museumName || museumName || 'museum'}-qr.png`;
    a.click();
  };

  /* ── UI HELPERS ── */
  const TabBtn = ({ id, label, icon: Icon }) => (
    <button onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2.5 py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap rounded-t-xl ${
        activeTab === id 
          ? 'border-indigo-600 text-indigo-600 bg-indigo-50/80 shadow-xs' 
          : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50/80'
      }`}>
      <Icon className={`h-4 w-4 ${activeTab === id ? 'text-indigo-600' : 'text-gray-400'}`} />
      {label}
    </button>
  );

  const StatusBadge = ({ status }) => {
    const m = {
      ACTIVE:    'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20',
      USED:      'bg-slate-100 text-slate-600 border-slate-200',
      PENDING:   'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/20',
      CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/20',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${m[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
        {status}
      </span>
    );
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-white font-bold text-base">Loading museum dashboard…</p>
          <p className="text-slate-400 text-xs mt-1">Connecting to live realtime server</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900/10 text-slate-900">

      {/* ══════ MODERN HEADER ══════ */}
      <header className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white sticky top-0 z-30 shadow-2xl border-b border-indigo-900/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex justify-between items-center gap-4">

          {/* Left: museum brand and badge */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2.5 rounded-2xl shadow-md flex-shrink-0">
              <QrCode className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-black leading-tight truncate tracking-tight text-white">
                  {museum?.museumName || museumName || 'Museum Dashboard'}
                </h1>
                <span className={`hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  museum?.bookingStatus 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}>
                  {museum?.bookingStatus ? '● Live Open' : '● Closed'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />
                <span className="text-indigo-200/80 text-xs truncate">
                  {museum?.location || museum?.city || 'Location not specified'}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Controls & Language */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Language Switcher Dropdown */}
            <div className="relative">
              <select
                value={lang}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-white/10 hover:bg-white/15 text-white text-xs font-bold py-2 pl-3 pr-8 rounded-xl border border-white/20 outline-none cursor-pointer backdrop-blur-md transition-all appearance-none shadow-sm">
                {LANGUAGES.map(l => (
                  <option key={l.code} value={l.code} className="text-gray-900 bg-white">
                    {l.flag} {l.native}
                  </option>
                ))}
              </select>
              <Globe className="h-3.5 w-3.5 text-white/70 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button onClick={() => fetchAll(true)} title="Refresh Dashboard"
              className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl border border-white/15 transition-all shadow-sm">
              <RefreshCw className="h-4 w-4" />
            </button>

            {/* Quick Booking Toggle */}
            <button onClick={handleToggleBooking} disabled={bookingToggling}
              className={`hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all shadow-md ${
                museum?.bookingStatus 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/30' 
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/30'
              }`}>
              {museum?.bookingStatus ? <><ToggleRight className="h-4 w-4" /> OPEN</> : <><ToggleLeft className="h-4 w-4" /> CLOSED</>}
            </button>

            <button onClick={() => navigate('/')}
              className="hidden sm:flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl text-xs font-bold border border-white/15 transition-all text-white">
              <Home className="h-4 w-4" /> <span>{t.home || 'Home'}</span>
            </button>

            <button onClick={handleLogout}
              className="flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 px-3 py-2 rounded-xl text-xs font-bold transition-all">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">{t.logout || 'Logout'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ══════ MODERN NAVIGATION TABS ══════ */}
      <div className="bg-white/95 border-b border-gray-200/80 sticky top-[64px] z-20 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex overflow-x-auto gap-1 py-1 no-scrollbar">
          <TabBtn id="overview" label={t.overview || "Overview"}  icon={BarChart3} />
          <TabBtn id="ai-copilot" label={t.aiCopilot || "AI Copilot"} icon={Sparkles} />
          <TabBtn id="tickets"  label={t.tickets || "Tickets"}   icon={Ticket}    />
          <TabBtn id="shows"    label={t.shows || "Shows"}     icon={Zap}       />
          <TabBtn id="profile"  label={t.profile || "Profile"}   icon={User}      />
          <TabBtn id="media"    label={t.media || "Media"}     icon={ImageIcon} />
          <TabBtn id="reviews"  label={t.reviews || "Reviews"}   icon={MessageSquare} />
          <TabBtn id="qr"       label={t.qrCode || "QR Code"}   icon={QrCode}    />
          <TabBtn id="settings" label={t.settings || "Settings"}  icon={Settings}  />
        </div>
      </div>

      {/* ══════ MAIN CONTENT ══════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* ─── TAB 1: OVERVIEW ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Realtime Hero Cards & Graphs */}
            <AnalyticsDashboard 
              analyticsData={stats} 
              liveStats={liveStats} 
              loading={loading}
              range={analyticsRange}
              setRange={setAnalyticsRange}
              connectionStatus={connectionStatus}
            />

            {/* Live Feed Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4.5 bg-gradient-to-r from-slate-50 to-indigo-50/50 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm"></span>
                    Live Ticket Feed
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Real-time visitor reservations as they happen</p>
                </div>
                <button onClick={() => setActiveTab('tickets')} className="text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100/50 hover:border-indigo-200 transition-all flex items-center gap-1">
                  View All Tickets <ChevronRight className="h-3 w-3" />
                </button>
              </div>
              
              {liveTickets.length === 0 && tickets.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-3 text-indigo-400">
                    <Ticket className="h-8 w-8" />
                  </div>
                  <p className="text-gray-900 font-extrabold text-sm">No tickets booked yet</p>
                  <p className="text-gray-400 text-xs mt-1">When visitors book via the chatbot or QR code, their tickets will appear here live.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50/75 border-b border-gray-100 text-[11px] font-black text-gray-400 uppercase tracking-wider">
                        <th className="px-6 py-3.5 text-left">Ticket #</th>
                        <th className="px-6 py-3.5 text-left">Visitor Email</th>
                        <th className="px-6 py-3.5 text-left">Amount</th>
                        <th className="px-6 py-3.5 text-left">Status</th>
                        <th className="px-6 py-3.5 text-left">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs">
                      {Array.from(new Map([...liveTickets, ...tickets.slice(0, 5)].map(item => [item.id, item])).values())
                        .slice(0, 10)
                        .map(t => (
                        <tr key={t.id} className={`hover:bg-indigo-50/40 transition-colors ${liveTickets.find(lt => lt.id === t.id) ? 'bg-indigo-50/20' : ''}`}>
                          <td className="px-6 py-4 font-mono font-extrabold text-indigo-600">#{t.ticketNumber}</td>
                          <td className="px-6 py-4 font-medium text-gray-700 max-w-[200px] truncate">{t.userEmail}</td>
                          <td className="px-6 py-4 font-black text-gray-900 text-sm">₹{t.totalPrice}</td>
                          <td className="px-6 py-4"><StatusBadge status={t.status} /></td>
                          <td className="px-6 py-4 text-gray-400 font-medium">
                            {t.createdAt ? format(new Date(t.createdAt),'HH:mm · dd MMM') : 'Just now'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 2: AI COPILOT ─── */}
        {activeTab === 'ai-copilot' && (
          <div className="animate-fadeIn">
            <AiCopilotTab 
              museum={museum} 
              stats={stats} 
              liveStats={liveStats}
              tickets={tickets} 
              reviews={reviews} 
              onSettingsUpdated={() => fetchAll(true)} 
            />
          </div>
        )}

        {/* ─── TAB 3: TICKETS ─── */}
        {activeTab === 'tickets' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900">Ticket Management & Gate Verification</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Search visitor passes, check booking status, and grant entrance</p>
              </div>
            </div>

            {/* Search Bar & Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm p-5 border border-gray-100 flex items-center gap-3">
                <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <input 
                  type="tel" 
                  placeholder="Search customer by mobile number…" 
                  value={searchTerm}
                  onChange={e => handlePhoneSearch(e.target.value)}
                  className="w-full text-sm outline-none font-medium text-gray-800 placeholder-gray-400" 
                />
                {searchTerm && (
                  <button onClick={() => handlePhoneSearch('')} className="text-xs text-gray-400 hover:text-gray-600 font-bold">
                    Clear
                  </button>
                )}
              </div>
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-5 text-white shadow-md flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Tickets Displayed</p>
                  <p className="text-3xl font-black mt-1">{tickets.length}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-2xl">
                  <Ticket className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>

            {/* Tickets Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              {tickets.length === 0 ? (
                <div className="text-center py-16">
                  <Ticket className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-extrabold text-gray-800">No tickets found</p>
                  <p className="text-xs text-gray-400 mt-1">{searchTerm ? 'Try another phone number' : 'No reservations booked yet.'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        <th className="px-5 py-4">Ticket #</th>
                        <th className="px-5 py-4">Email</th>
                        <th className="px-5 py-4">Phone</th>
                        <th className="px-5 py-4">Visitors</th>
                        <th className="px-5 py-4">Total Paid</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Date</th>
                        <th className="px-5 py-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-xs">
                      {tickets.map(t => (
                        <tr key={t.id} className="hover:bg-indigo-50/40 transition-colors">
                          <td className="px-5 py-4 font-mono font-extrabold text-indigo-600 whitespace-nowrap">#{t.ticketNumber}</td>
                          <td className="px-5 py-4 font-medium text-gray-700 max-w-[160px] truncate">{t.userEmail}</td>
                          <td className="px-5 py-4 text-gray-600 font-mono whitespace-nowrap">{t.phone || '—'}</td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[11px] font-bold">{t.adults} Adults</span>{' '}
                            <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full text-[11px] font-bold">{t.children} Children</span>
                          </td>
                          <td className="px-5 py-4 font-black text-gray-900 text-sm whitespace-nowrap">₹{t.totalPrice}</td>
                          <td className="px-5 py-4 whitespace-nowrap"><StatusBadge status={t.status} /></td>
                          <td className="px-5 py-4 text-gray-400 whitespace-nowrap">{format(new Date(t.createdAt),'dd MMM yyyy')}</td>
                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            <button onClick={() => openVerifyModal(t)}
                              disabled={t.status === 'USED' || t.status === 'CANCELLED'}
                              className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3.5 py-1.5 rounded-xl transition-all shadow-xs ${
                                t.status === 'USED' || t.status === 'CANCELLED'
                                  ? 'text-gray-300 bg-gray-100 cursor-not-allowed'
                                  : 'text-white bg-indigo-600 hover:bg-indigo-700'
                              }`}>
                              <Eye className="h-3.5 w-3.5" /> Gate Verify
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 4: SHOWS ─── */}
        {activeTab === 'shows' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900">Special Shows & Planetarium</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Schedule ticketed exhibitions, 3D film shows, and sessions</p>
              </div>
              <button onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all shadow-md">
                <Plus className="h-4 w-4" /> {showForm ? 'Close' : 'Add Show'}
              </button>
            </div>

            {showForm && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-extrabold text-gray-900 text-base mb-4">Create New Exhibition Show</h3>
                <form onSubmit={handleCreateShow} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Show Title (e.g. 3D Dinosaur World) *" required value={newShow.name}
                      onChange={e => setNewShow({...newShow, name: e.target.value})}
                      className="px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 outline-none text-xs sm:text-sm" />
                    <input type="datetime-local" required value={newShow.showTime}
                      onChange={e => setNewShow({...newShow, showTime: e.target.value})}
                      className="px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 outline-none text-xs sm:text-sm" />
                    <input type="number" placeholder="Ticket Price (₹) *" required value={newShow.price}
                      onChange={e => setNewShow({...newShow, price: e.target.value})}
                      className="px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 outline-none text-xs sm:text-sm" />
                    <input type="number" placeholder="Max Seat Limit *" required value={newShow.seatLimit}
                      onChange={e => setNewShow({...newShow, seatLimit: e.target.value})}
                      className="px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 outline-none text-xs sm:text-sm" />
                  </div>
                  <textarea placeholder="Show description or visitor guidelines (optional)" rows={2} value={newShow.description}
                    onChange={e => setNewShow({...newShow, description: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-indigo-500 outline-none text-xs sm:text-sm resize-none" />
                  <div className="flex gap-3">
                    <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs sm:text-sm shadow-sm">
                      Create & Publish Show
                    </button>
                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-xs sm:text-sm">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {shows.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100">
                <Zap className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-extrabold text-gray-800">No shows scheduled</p>
                <p className="text-xs text-gray-400 mt-1">Add a show and it will appear directly in the visitor AI chatbot.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {shows.map(show => (
                  <div key={show.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
                    <div className="p-5">
                      <h3 className="font-extrabold text-gray-900 text-base mb-3">{show.showName || show.name}</h3>
                      <div className="space-y-2 text-xs sm:text-sm text-gray-600 mb-4">
                        <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-indigo-500 flex-shrink-0" />{format(new Date(show.showTime),'dd MMM yyyy, HH:mm')}</p>
                        <p className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-emerald-500 flex-shrink-0" /><span className="font-black text-emerald-700 text-base">₹{show.price}</span><span className="text-gray-400 text-xs">/ ticket</span></p>
                        <p className="flex items-center gap-2"><Users className="h-4 w-4 text-blue-500 flex-shrink-0" />{show.availableSeats ?? show.seatLimit} / {show.seatLimit} seats left</p>
                      </div>
                      {show.description && <p className="text-xs text-gray-400 mb-4 line-clamp-2">{show.description}</p>}
                      <button onClick={() => handleDeleteShow(show.id)} className="w-full flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 py-2.5 rounded-xl text-xs font-bold transition-colors">
                        <Trash2 className="h-3.5 w-3.5" /> Delete Show
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 5: PROFILE ─── */}
        {activeTab === 'profile' && (
          <div className="max-w-4xl mx-auto animate-fadeIn">
            <ProfileEditor profile={museum} onUpdate={() => fetchAll(true)} />
          </div>
        )}

        {/* ─── TAB 6: MEDIA ─── */}
        {activeTab === 'media' && (
          <div className="max-w-5xl mx-auto animate-fadeIn">
            <MediaManager images={museum?.images || museum?.galleryImages || []} onUpdate={() => fetchAll(true)} />
          </div>
        )}

        {/* ─── TAB 7: REVIEWS ─── */}
        {activeTab === 'reviews' && (
          <div className="max-w-4xl mx-auto animate-fadeIn">
            <ReviewManager reviews={reviews} onUpdate={() => fetchAll(true)} />
          </div>
        )}

        {/* ─── TAB 8: QR CODE ─── */}
        {activeTab === 'qr' && (
          <div className="max-w-xl mx-auto animate-fadeIn">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-gray-900">Museum Entrance QR Code</h2>
              <p className="text-xs text-gray-500 mt-1">Visitors scan this QR code at your entrance gate to instantly open the booking chatbot.</p>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
              <div className="flex justify-center bg-gradient-to-br from-indigo-50/80 via-purple-50/80 to-slate-50 p-8 rounded-3xl border border-indigo-100/50">
                <div className="p-4 bg-white rounded-2xl shadow-xl border-4 border-white">
                  <QRCodeCanvas 
                    id="museum-qr-code"
                    value={`http://localhost:5173/museum/${museumId}`} 
                    size={220}
                    level="H"
                    includeMargin={true}
                  />
                </div>
              </div>
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4">
                <p className="text-xs font-bold text-indigo-900 mb-1 flex items-center gap-1.5">
                  <span>📱</span> Direct Chatbot Link:
                </p>
                <code className="text-xs text-indigo-700 bg-white px-3 py-2 rounded-xl border border-indigo-100 block font-mono break-all font-semibold">
                  http://localhost:5173/museum/{museumId}
                </code>
              </div>
              <button onClick={downloadQRCode}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 rounded-2xl font-black text-sm transition-all shadow-md">
                <Download className="h-5 w-5" /> Download Printable QR Poster
              </button>
            </div>
          </div>
        )}

        {/* ─── TAB 9: SETTINGS ─── */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-gray-900">Museum Controls & Gate Staff Security</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage ticket pricing, capacity, and the 4-digit staff entrance PIN</p>
            </div>

            {/* STAFF ENTRY PIN CARD */}
            <div className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-800/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-indigo-500/30 border border-indigo-400/30 p-2.5 rounded-2xl">
                  <ShieldCheck className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg">Gate Staff 4-Digit Validation Code</h3>
                  <p className="text-indigo-200/80 text-xs">Used by gate attendants to validate tickets to USED</p>
                </div>
              </div>
              <p className="text-indigo-200/70 text-xs sm:text-sm mb-6 leading-relaxed">
                When visitors arrive at the museum gate, staff provide this 4-digit code. The visitor enters it to mark their pass verified.
              </p>

              {/* PIN Box */}
              <div className="bg-black/30 border border-white/10 rounded-2xl p-5 mb-5 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 sm:gap-4">
                    {(showPin ? (museum?.staffPin || '1234') : '••••').split('').map((ch, i) => (
                      <div key={i} className="w-12 h-14 sm:w-16 sm:h-16 bg-white/10 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-black border border-white/20 font-mono shadow-inner">
                        {ch}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2 ml-3">
                    <button onClick={() => setShowPin(p => !p)} title={showPin ? 'Hide PIN' : 'Show PIN'}
                      className="bg-white/15 hover:bg-white/25 p-3 rounded-xl transition-all border border-white/10">
                      {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5 text-white" />}
                    </button>
                    <button onClick={handleCopyPin} title="Copy code"
                      className="bg-white/15 hover:bg-white/25 p-3 rounded-xl transition-all border border-white/10">
                      {pinCopied ? <Check className="h-5 w-5 text-emerald-400" /> : <Copy className="h-5 w-5 text-white" />}
                    </button>
                  </div>
                </div>
              </div>

              <button onClick={handleRegeneratePin} disabled={regeneratingPin}
                className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white py-3.5 rounded-2xl font-bold text-xs sm:text-sm border border-white/20 transition-all">
                <RefreshCcw className={`h-4 w-4 ${regeneratingPin ? 'animate-spin' : ''}`} />
                {regeneratingPin ? 'Generating…' : 'Regenerate New Staff PIN'}
              </button>
            </div>

            {/* PRICES & CAPACITY FORM */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <h3 className="font-extrabold text-gray-900 text-base mb-5 flex items-center gap-2">
                <Settings className="h-5 w-5 text-indigo-600" /> Ticket Pricing & Daily Seat Limits
              </h3>
              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Adult Ticket Price (₹)</label>
                    <input type="number" min="0" value={settingsForm.adultPrice}
                      onChange={e => setSettingsForm(p => ({...p, adultPrice: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none text-xl font-black text-indigo-700" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Child Ticket Price (₹)</label>
                    <input type="number" min="0" value={settingsForm.childPrice}
                      onChange={e => setSettingsForm(p => ({...p, childPrice: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none text-xl font-black text-purple-700" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Daily Max Visitors Limit</label>
                    <input type="number" min="1" value={settingsForm.seatLimit}
                      onChange={e => setSettingsForm(p => ({...p, seatLimit: e.target.value}))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none text-xl font-black text-gray-800" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Open Time</label>
                      <input type="time" value={settingsForm.openingTime}
                        onChange={e => setSettingsForm(p => ({...p, openingTime: e.target.value}))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-indigo-500 outline-none text-xs font-bold" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Close Time</label>
                      <input type="time" value={settingsForm.closingTime}
                        onChange={e => setSettingsForm(p => ({...p, closingTime: e.target.value}))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:border-indigo-500 outline-none text-xs font-bold" />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={savingSettings}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white py-3.5 rounded-2xl font-black text-xs sm:text-sm transition-all shadow-md">
                  {savingSettings ? 'Saving Changes…' : 'Save Pricing & Time Settings'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ══════ VERIFY MODAL ══════ */}
      {showVerifyModal && selectedTicket && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
              <h2 className="text-lg font-black">Gate Ticket Verification</h2>
              <p className="text-indigo-200 text-xs mt-0.5">Enter 4-digit staff PIN to grant entrance</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <p className="font-black text-gray-900 font-mono text-sm">#{selectedTicket.ticketNumber}</p>
                <p className="text-xs text-gray-600 mt-0.5 truncate">{selectedTicket.userEmail}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold">{selectedTicket.adults}A</span>
                  <span className="bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full text-[11px] font-bold">{selectedTicket.children}C</span>
                  <span className="ml-auto font-black text-gray-900 text-sm">₹{selectedTicket.totalPrice}</span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1.5">Staff Code PIN</label>
                <input 
                  type="password" 
                  maxLength={4}
                  value={verifyCode}
                  onChange={e => setVerifyCode(e.target.value.replace(/\D/g,''))}
                  className="w-full py-3.5 border-2 border-indigo-200 rounded-2xl text-center text-3xl font-black tracking-[0.5em] focus:border-indigo-600 outline-none font-mono"
                  placeholder="0000" autoFocus
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={handleVerifyTicket} disabled={verifyCode.length !== 4}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white py-3 rounded-2xl font-black text-xs transition-all shadow-sm">
                  Grant Entry
                </button>
                <button onClick={() => { setShowVerifyModal(false); setSelectedTicket(null); setVerifyCode(''); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-2xl font-bold text-xs transition-all">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
