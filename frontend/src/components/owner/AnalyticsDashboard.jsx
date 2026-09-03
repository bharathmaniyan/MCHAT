import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import { TrendingUp, Users, DollarSign, Calendar, Eye, Activity } from 'lucide-react';
import Skeleton from '../common/Skeleton';

const AnalyticsDashboard = ({ analyticsData, liveStats, loading, connectionStatus, range, setRange }) => {
  if (loading && !analyticsData) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // Combine initial API data with live updates
  const currentStats = {
    ...analyticsData,
    todayRevenue: liveStats?.todayRevenue ?? analyticsData?.todayRevenue ?? 0,
    todayTicketsCount: liveStats?.todayTicketsCount ?? analyticsData?.todayTicketsCount ?? 0,
    activeBookingsCount: liveStats?.activeBookingsCount ?? analyticsData?.activeBookingsCount ?? 0,
    totalVisitorsRange: analyticsData?.totalVisitorsRange ?? 0,
    profileViewsRange: analyticsData?.profileViewsRange ?? 0
  };

  const revenueData = analyticsData?.dailyRevenue || [];
  const ticketData = analyticsData?.dailyTickets || [];
  
  // Format data for Recharts
  const chartData = revenueData.map((item, index) => ({
    date: item.date, // Format date nicely if needed
    revenue: item.revenue,
    tickets: ticketData[index]?.tickets || 0
  }));

  const KpiCard = ({ title, value, icon: Icon, trend, prefix = '' }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-shadow">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <div className="flex items-end gap-2">
          <h4 className="text-3xl font-black text-gray-900 group-hover:text-indigo-600 transition-colors">
            {prefix}{value}
          </h4>
          {trend && (
            <span className={`text-xs font-medium mb-1 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
      <div className="bg-indigo-50 p-4 rounded-xl text-indigo-600">
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );

  const ranges = ['30d', '6m', '1y', '3y', '5y', 'all'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm sticky top-0 z-10 gap-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-indigo-600" />
          Analytics Dashboard
        </h2>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {/* Range Selector */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            {ranges.map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  range === r 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 border border-gray-200 whitespace-nowrap">
            <span className="mr-2">Live Connection:</span>
            {connectionStatus === 'CONNECTED' && <><span className="w-2 h-2 rounded-full bg-green-500 mr-1.5 animate-pulse"></span><span className="text-green-700 font-bold">Active</span></>}
            {connectionStatus === 'CONNECTING' && <><span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5"></span><span className="text-amber-700 font-bold">Connecting...</span></>}
            {connectionStatus === 'RECONNECTING' && <><span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span><span className="text-amber-700 font-bold">Reconnecting...</span></>}
            {connectionStatus === 'ERROR' && <><span className="w-2 h-2 rounded-full bg-red-500 mr-1.5"></span><span className="text-red-700 font-bold">Disconnected</span></>}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Today's Revenue" 
          value={currentStats.todayRevenue} 
          prefix="₹" 
          icon={DollarSign}
        />
        <KpiCard 
          title="Today's Tickets" 
          value={currentStats.todayTicketsCount} 
          icon={TicketIcon}
        />
        <KpiCard 
          title={`Total Visitors (${range.toUpperCase()})`} 
          value={currentStats.totalVisitorsRange || 0} 
          icon={Users}
        />
        <KpiCard 
          title={`Profile Views (All Time)`} 
          value={currentStats.profileViewsRange || 0} 
          icon={Eye}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-green-500" />
            Revenue Trend ({range.toUpperCase()})
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                  labelStyle={{ fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tickets Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
            <Users className="w-5 h-5 mr-2 text-indigo-500" />
            Visitor Trend ({range.toUpperCase()})
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`${value} Tickets`, 'Sold']}
                />
                <Bar dataKey="tickets" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// SVG Icon Helper since Ticket is already used but imported differently usually
const TicketIcon = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path>
    <path d="M13 5v2"></path>
    <path d="M13 17v2"></path>
    <path d="M13 11v2"></path>
  </svg>
);

export default AnalyticsDashboard;
