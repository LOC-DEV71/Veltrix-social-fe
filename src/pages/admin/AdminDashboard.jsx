import React, { useState, useEffect } from 'react';
import { 
  Users, Server, Activity, Database, Download, Wifi, Cpu, 
  ShieldCheck, Zap, Terminal, ExternalLink, RefreshCw, AlertCircle
} from 'lucide-react';
import { useSelector } from 'react-redux';
import axiosClient from '../../services/axiosClient';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { io } from 'socket.io-client';
import { SpatialProvider, useSpatial } from '../../context/SpatialContext';
import SpatialController from '../../components/spatial/SpatialController';
import { defaultLayouts } from '../../utils/spatialLayout';

const ResponsiveGridLayout = WidthProvider(Responsive);

function AdminDashboardContent() {
  const [stats, setStats] = useState({
    usersCount: 0,
    premiumCount: 0,
    framesCount: 0,
    totalCoins: 0,
    webSocketConnections: 0,
    webRtcSessions: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [liveEvents, setLiveEvents] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [latency, setLatency] = useState(38);
  const [signalingRate, setSignalingRate] = useState(42);

  const { isSpatialOn, setIsSpatialOn, layouts, updateLayout } = useSpatial();

  const [trafficData, setTrafficData] = useState([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/api/admin/stats');
      if (res.data.success) {
        // Backend returns flat object, not nested in .kpis
        const data = res.data.data;
        setStats({
          usersCount: data.usersCount || 0,
          premiumCount: data.premiumCount || 0,
          framesCount: data.framesCount || 0,
          totalCoins: data.totalCoins || 0,
          webSocketConnections: data.webSocketConnections || 0,
          webRtcSessions: data.webRtcSessions || 0,
        });
        setTrafficData(data.trafficData || []);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInitialLogs = async () => {
    try {
      const res = await axiosClient.get('/api/admin/logs');
      if (res.data.success) {
        setLiveEvents(res.data.data.map(log => ({
          level: log.level,
          message: log.message,
          timestamp: log.createdAt,
        })));
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchInitialLogs();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io('ws://localhost:5000', {
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('Admin socket connected');
      // JOIN admin room so backend broadcasts system_event to us
      socket.emit('join_admin_room');
    });

    socket.on('system_event', (event) => {
      // Add to live events log
      setLiveEvents(prev => [{
        level: event.level,
        message: event.message,
        timestamp: new Date().toISOString(),
      }, ...prev].slice(0, 50));
      setLastUpdated(new Date());

      // Update realtime metrics from event payload
      if (event.metrics) {
        setStats(prev => ({
          ...prev,
          webSocketConnections: event.metrics.webSocketConnections ?? prev.webSocketConnections,
          webRtcSessions: event.metrics.webRtcSessions ?? prev.webRtcSessions,
        }));
        // Update online users count from metrics
        if (event.metrics.onlineUsersCount !== undefined) {
          setOnlineUsers(prev => {
            // Create a synthetic Set with the right size
            const s = new Set();
            for (let i = 0; i < event.metrics.onlineUsersCount; i++) s.add(i);
            return s;
          });
        }
      }

      // Update traffic chart on new message
      if (event.message && event.message.includes('New message sent')) {
        setTrafficData(prevData => {
          if (!prevData || prevData.length === 0) return prevData;
          const newData = [...prevData];
          const now = new Date();
          const bucketStr = `${now.getUTCHours().toString().padStart(2, '0')}:00`;
          const lastBucket = newData[newData.length - 1];
          
          if (lastBucket && lastBucket.time === bucketStr) {
            newData[newData.length - 1] = { ...lastBucket, traffic: lastBucket.traffic + 1 };
          } else {
            newData.push({ time: bucketStr, traffic: 1 });
            if (newData.length > 24) newData.shift();
          }
          return newData;
        });
      }
    });

    // Listen to direct user online/offline events for instant update
    socket.on('user_status_change', ({ userId, isOnline }) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        if (isOnline) newSet.add(userId);
        else newSet.delete(userId);
        return newSet;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  };

  const timeSince = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    return `${Math.floor(seconds / 60)} minutes ago`;
  };

  const onLayoutChange = (layout, layoutsAll) => {
    if (isSpatialOn) {
      updateLayout(layoutsAll);
    }
  };

  return (
    <div className="w-full pb-10">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Overview</h1>
          <p className="text-[13px] text-slate-400 mt-1">System performance and platform activity</p>
          <p className="text-[11px] font-mono text-slate-500 mt-2">
            Production · Updated {timeSince(lastUpdated)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#131b2c] border border-[#1e293b] px-3 py-1.5 rounded-md text-[13px] mr-2">
            <span className="text-slate-400">Spatial Control:</span>
            <button 
              onClick={() => setIsSpatialOn(!isSpatialOn)}
              className={`font-bold transition-colors ${isSpatialOn ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {isSpatialOn ? 'ON' : 'OFF'}
            </button>
          </div>
          <button 
            onClick={fetchDashboardData}
            className="flex items-center gap-2 bg-[#131b2c] hover:bg-[#1e293b] border border-[#1e293b] hover:border-[#334155] text-slate-300 px-3 py-1.5 rounded-md text-[13px] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-md text-[13px] transition-colors shadow-sm">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      <SpatialController />

      <ResponsiveGridLayout
        className={`layout ${isSpatialOn ? 'spatial-active' : ''}`}
        layouts={layouts && Object.keys(layouts).length > 0 ? layouts : defaultLayouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 6, md: 4, sm: 2, xs: 1, xxs: 1 }}
        rowHeight={30}
        margin={[24, 24]}
        onLayoutChange={onLayoutChange}
        isDraggable={isSpatialOn}
        isResizable={isSpatialOn}
        useCSSTransforms={true}
        compactType="vertical"
        measureBeforeMount={false}
      >
        <div key="health-bar" className="bg-[#0f172a]/90 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-indigo-500/5 overflow-hidden">
          <h2 className="text-[14px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-cyan-300 w-full md:w-auto mb-2 md:mb-0 drop-shadow-[0_0_5px_rgba(99,102,241,0.3)]">System Health</h2>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <div className="flex items-center gap-2 text-[13px] text-slate-300 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse"></span>API <span className="text-slate-500 text-[11px] ml-1">Operational</span></div>
            <div className="flex items-center gap-2 text-[13px] text-slate-300 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" style={{ animationDelay: '0.2s' }}></span>WebSocket <span className="text-slate-500 text-[11px] ml-1">Operational</span></div>
            <div className="flex items-center gap-2 text-[13px] text-slate-300 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" style={{ animationDelay: '0.4s' }}></span>Database <span className="text-slate-500 text-[11px] ml-1">Operational</span></div>
            <div className="flex items-center gap-2 text-[13px] text-slate-300 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" style={{ animationDelay: '0.6s' }}></span>WebRTC <span className="text-slate-500 text-[11px] ml-1">Operational</span></div>
            <div className="flex items-center gap-2 text-[13px] text-slate-300 font-medium"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" style={{ animationDelay: '0.8s' }}></span>Redis <span className="text-slate-500 text-[11px] ml-1">Operational</span></div>
          </div>
        </div>

        <div key="kpi-users" className="bg-gradient-to-b from-[#131b2c] to-[#0f172a] rounded-xl border border-indigo-500/20 p-5 hover:border-indigo-400/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all duration-300 group relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-bl-full -mr-4 -mt-4 blur-xl"></div>
          <div className="text-[12px] text-indigo-200/70 flex items-center justify-between relative z-10">Total Users <Users className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-all drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" /></div>
          <div className="text-[26px] md:text-[32px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200 relative z-10">{loading ? '...' : stats.usersCount.toLocaleString()}</div>
          <div className="text-[11px] flex items-center gap-1.5 text-slate-400 relative z-10"><span className="text-emerald-400 font-medium drop-shadow-[0_0_2px_rgba(52,211,153,0.5)]">↑ 8.4%</span> this week</div>
        </div>

        <div key="kpi-premium" className="bg-gradient-to-b from-[#131b2c] to-[#0f172a] rounded-xl border border-purple-500/20 p-5 hover:border-purple-400/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all duration-300 group relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-bl-full -mr-4 -mt-4 blur-xl"></div>
          <div className="text-[12px] text-purple-200/70 flex items-center justify-between relative z-10">Active Premium <ShieldCheck className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-all drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]" /></div>
          <div className="text-[26px] md:text-[32px] font-bold text-white relative z-10">{loading ? '...' : stats.premiumCount.toLocaleString()}</div>
          <div className="text-[11px] flex items-center gap-1.5 text-slate-400 relative z-10"><span className="text-emerald-400 font-medium">↑ 12.1%</span> this week</div>
        </div>

        <div key="kpi-frames" className="bg-gradient-to-b from-[#131b2c] to-[#0f172a] rounded-xl border border-cyan-500/20 p-5 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all duration-300 group relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-bl-full -mr-4 -mt-4 blur-xl"></div>
          <div className="text-[12px] text-cyan-200/70 flex items-center justify-between relative z-10">Active Frames <Server className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-all drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]" /></div>
          <div className="text-[26px] md:text-[32px] font-bold text-white relative z-10">{loading ? '...' : stats.framesCount.toLocaleString()}</div>
          <div className="text-[11px] flex items-center gap-1.5 text-slate-400 relative z-10"><span className="text-emerald-400 font-medium">↑ 4.2%</span> this week</div>
        </div>

        <div key="kpi-coins" className="bg-gradient-to-b from-[#131b2c] to-[#0f172a] rounded-xl border border-amber-500/20 p-5 hover:border-amber-400/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all duration-300 group relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-bl-full -mr-4 -mt-4 blur-xl"></div>
          <div className="text-[12px] text-amber-200/70 flex items-center justify-between relative z-10">Total Coins <Database className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-all drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]" /></div>
          <div className="text-[26px] md:text-[32px] font-bold text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)] relative z-10">{loading ? '...' : stats.totalCoins.toLocaleString()}</div>
          <div className="text-[11px] flex items-center gap-1.5 text-slate-400 relative z-10"><span className="text-emerald-400 font-medium">↑ 15.0%</span> this week</div>
        </div>

        <div key="kpi-online" className="bg-[#131b2c] rounded-xl border border-[#1e293b] p-5 shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="text-[12px] text-slate-400 flex items-center justify-between">Online Users <Activity className="w-3.5 h-3.5 text-slate-500" /></div>
          <div className="text-[26px] md:text-[32px] font-bold text-slate-100">{onlineUsers.size.toLocaleString()}</div>
          <div className="text-[11px] flex items-center gap-1.5 text-slate-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Realtime</div>
        </div>

        <div key="kpi-errors" className="bg-[#131b2c] rounded-xl border border-[#1e293b] p-5 shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="text-[12px] text-slate-400 flex items-center justify-between">System Errors <AlertCircle className="w-3.5 h-3.5 text-slate-600" /></div>
          <div className="text-[26px] md:text-[32px] font-bold text-slate-100">24</div>
          <div className="text-[11px] flex items-center gap-1.5 text-slate-400"><span className="text-rose-400 font-medium">↑ 3</span> past hour</div>
        </div>

        <div key="traffic-chart" className="bg-[#131b2c] rounded-xl border border-[#1e293b] p-6 shadow-sm flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[15px] font-semibold text-slate-200">Traffic & Activity</h3>
            <div className="flex bg-[#0a0f1c] rounded-md p-0.5 border border-[#1e293b]">
              <button className="px-3 py-1 text-[11px] font-medium rounded text-slate-300 bg-[#1e293b] shadow-sm">24h</button>
              <button className="px-3 py-1 text-[11px] font-medium rounded text-slate-500 hover:text-slate-300">7d</button>
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <CartesianGrid vertical={false} stroke="#1e293b" strokeDasharray="3 3" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} itemStyle={{ color: '#a5b4fc', fontWeight: 'bold' }} />
                <Area type="monotone" dataKey="traffic" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorTraffic)" activeDot={{ r: 6, fill: '#818cf8', stroke: '#0f172a', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div key="realtime-infra" className="bg-[#131b2c] rounded-xl border border-[#1e293b] p-6 shadow-sm flex flex-col justify-between overflow-hidden">
          <h3 className="text-[15px] font-semibold text-slate-200 mb-4">Realtime Infrastructure</h3>
          <div className="space-y-4 flex-1">
            <div>
              <div className="flex justify-between text-[13px] mb-2"><span className="text-slate-400 font-medium">WebSocket Connections</span><span className="text-indigo-300 font-bold">{stats.webSocketConnections?.toLocaleString()}</span></div>
              <div className="w-full bg-[#0a0f1c] rounded-full h-2 border border-[#1e293b] overflow-hidden"><div className="bg-gradient-to-r from-indigo-600 to-indigo-400 h-2 rounded-full" style={{ width: `${Math.max(2, Math.min(100, (stats.webSocketConnections / 200) * 100))}%` }}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-[13px] mb-2"><span className="text-slate-400 font-medium">WebRTC Sessions</span><span className="text-emerald-300 font-bold">{stats.webRtcSessions?.toLocaleString()}</span></div>
              <div className="w-full bg-[#0a0f1c] rounded-full h-2 border border-[#1e293b] overflow-hidden"><div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-2 rounded-full" style={{ width: `${Math.max(2, Math.min(100, (stats.webRtcSessions / 50) * 100))}%` }}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-[13px] mb-2"><span className="text-slate-400 font-medium">Signaling Rate</span><span className="text-cyan-300 font-bold">{signalingRate} req/s</span></div>
              <div className="w-full bg-[#0a0f1c] rounded-full h-2 border border-[#1e293b] overflow-hidden"><div className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-2 rounded-full" style={{ width: `${Math.min(100, signalingRate)}%` }}></div></div>
            </div>
          </div>
          <div className="pt-4 border-t border-[#1e293b] mt-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1e293b] flex items-center justify-center"><Zap className="w-4 h-4 text-amber-400" /></div>
              <div><div className="text-[11px] text-slate-500">Average Latency</div><div className="text-[14px] font-semibold text-slate-200">{latency} ms</div></div>
            </div>
          </div>
        </div>

        <div key="live-activity" className="bg-[#0f172a]/90 backdrop-blur-md rounded-xl border border-[#1e293b] p-6 shadow-sm overflow-hidden relative flex flex-col">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-bl-full blur-3xl pointer-events-none"></div>
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-[15px] font-semibold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400">Live Activity</h3>
            <button className="text-[12px] text-indigo-400 hover:text-indigo-300 transition-all flex items-center gap-1 font-medium">View all <ExternalLink className="w-3.5 h-3.5" /></button>
          </div>
          <div className="space-y-4 font-mono text-[12px] relative z-10 flex-1 overflow-y-auto pr-2 scrollbar-hide">
            {liveEvents.length === 0 ? (
              <div className="text-slate-500 italic py-4 text-center">Waiting for system events...</div>
            ) : (
              liveEvents.map((log, i) => (
                <div key={i} className="flex justify-between items-start gap-4 p-2 hover:bg-[#1e293b]/50 rounded transition-colors group">
                  <div className="flex gap-3">
                    <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: log.level === 'ERROR' ? '#f43f5e' : log.level === 'WARN' ? '#eab308' : log.level === 'SUCCESS' ? '#10b981' : '#60a5fa' }}></span>
                    <div className="text-slate-300">
                      <span className="font-semibold" style={{ color: log.level === 'ERROR' ? '#fb7185' : log.level === 'WARN' ? '#fde047' : log.level === 'SUCCESS' ? '#34d399' : '#93c5fd' }}>
                        {log.level === 'INFO' ? 'System' : log.level === 'WARN' ? 'Warning' : log.level}:
                      </span> {' '}<span className="text-slate-300/90">{log.message}</span>
                    </div>
                  </div>
                  <div className="text-slate-500 whitespace-nowrap flex-shrink-0">{formatTime(log.timestamp)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div key="database-overview" className="bg-[#131b2c] rounded-xl border border-[#1e293b] p-6 shadow-sm flex flex-col justify-between overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-[15px] font-semibold text-slate-200 flex items-center gap-2"><Database className="w-4 h-4 text-slate-400" /> Database</h3>
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md border border-emerald-400/20"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Healthy</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6 flex-1">
            <div className="p-4 bg-[#0a0f1c] rounded-lg border border-[#1e293b] flex flex-col justify-center"><div className="text-[11px] text-slate-500 mb-1">Active Connections</div><div className="text-[18px] font-semibold text-slate-200">184</div></div>
            <div className="p-4 bg-[#0a0f1c] rounded-lg border border-[#1e293b] flex flex-col justify-center"><div className="text-[11px] text-slate-500 mb-1">Queries/sec</div><div className="text-[18px] font-semibold text-slate-200">1,284</div></div>
            <div className="p-4 bg-[#0a0f1c] rounded-lg border border-[#1e293b] flex flex-col justify-center"><div className="text-[11px] text-slate-500 mb-1">Average Latency</div><div className="text-[18px] font-semibold text-slate-200">12ms</div></div>
            <div className="p-4 bg-[#0a0f1c] rounded-lg border border-[#1e293b] flex flex-col justify-center"><div className="text-[11px] text-slate-500 mb-1">Storage Used</div><div className="text-[18px] font-semibold text-slate-200">42%</div></div>
          </div>
          <button className="text-[12px] text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 font-medium mt-auto">Manage Database <ExternalLink className="w-3 h-3" /></button>
        </div>
      </ResponsiveGridLayout>

    </div>
  );
}

export default function AdminDashboard() {
  return (
    <SpatialProvider>
      <AdminDashboardContent />
    </SpatialProvider>
  );
}