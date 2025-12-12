import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { WeatherData, GroundingSource } from '../types';

interface DashboardProps {
  weather: WeatherData | null;
  loading: boolean;
  rawText: string;
  sources: GroundingSource[];
  onRefresh: () => void;
  unitSystem: 'metric' | 'imperial';
}

const ProbabilityRing: React.FC<{ score: number }> = ({ score }) => {
  const radius = 50;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = '#2dd4bf'; // teal
  if (score > 60) color = '#a855f7'; // purple
  if (score > 80) color = '#ef4444'; // red/intense

  return (
    <div className="relative flex items-center justify-center w-32 h-32 mx-auto">
      <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
        <circle
          stroke="#334155"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset: 0 }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          fill="transparent"
        />
        <circle
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-black font-heading text-white">{score}%</span>
        <span className="text-[10px] text-slate-400 font-bold uppercase">Probability</span>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ weather, loading, rawText, sources, onRefresh, unitSystem }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-6 animate-pulse">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-4 border-dashed border-teal-400/50 animate-[spin_10s_linear_infinite]"></div>
          <div className="absolute inset-0 flex items-center justify-center text-4xl">🔭</div>
        </div>
        <p className="text-teal-200 text-xl font-heading">Scanning the cosmos...</p>
      </div>
    );
  }

  // Fallback if structured data parsing failed but we have text
  if (!weather && rawText) {
    return (
      <div className="p-6 space-y-4 bg-slate-800/50 rounded-3xl border-2 border-slate-700 border-dashed">
         <h2 className="text-3xl text-teal-400">Space Weather Report</h2>
         <div className="prose prose-invert max-w-none whitespace-pre-wrap text-lg text-slate-300 leading-relaxed">
           {rawText}
         </div>
         <button 
          onClick={onRefresh}
          className="mt-6 w-full py-3 bg-teal-600 hover:bg-teal-500 rounded-2xl text-white font-bold text-lg shadow-[0_4px_0_0_#115e59] active:shadow-none active:translate-y-[4px] transition-all"
        >
          Try Scanning Again
        </button>
      </div>
    );
  }

  if (!weather) return null;

  // Check for significant flare to alert (M or X class)
  const isSignificantFlare = weather.solarFlare && weather.solarFlare.class !== 'None';
  const flareClass = weather.solarFlare?.class || '';
  const isXClass = flareClass.toUpperCase().startsWith('X');

  // Helpers for Unit Conversion
  const formatSpeed = (val: number) => {
    if (unitSystem === 'imperial') {
      // km/s to mph
      return `${(val * 2236.94).toLocaleString('en-US', { maximumFractionDigits: 0 })} mph`;
    }
    return `${val} km/s`;
  };

  const formatDensity = (val: number) => {
    // Density usually stays p/cm^3 even in US, but we can display as is.
    return `${val} p/cm³`;
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header / Location */}
      <div className="flex justify-between items-center bg-slate-800/40 p-4 rounded-3xl border-2 border-dashed border-slate-700">
        <div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Current Base</h2>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📍</span>
            <span className="text-xl font-bold text-white">{weather.locationName || 'Unknown Sector'}</span>
          </div>
        </div>
        <button onClick={onRefresh} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-2xl transition-colors text-slate-300 shadow-md">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Solar Flare Alert Banner */}
      {isSignificantFlare && (
        <div className={`rounded-[2rem] p-5 border-2 relative overflow-hidden ${isXClass ? 'bg-red-900/30 border-red-500' : 'bg-orange-900/30 border-orange-500'} animate-pulse`}>
          <div className="flex items-center gap-4 relative z-10">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2 ${isXClass ? 'bg-red-500 text-white border-white' : 'bg-orange-500 text-white border-white'}`}>
              💥
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-black uppercase ${isXClass ? 'text-red-400' : 'text-orange-400'}`}>
                Solar Flare Detected
              </h3>
              <p className="text-white font-bold text-xl">{weather.solarFlare?.class}</p>
              <p className="text-sm text-slate-300">{weather.solarFlare?.impact}</p>
            </div>
          </div>
          {/* Decorative burst background */}
          <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full blur-3xl opacity-40 ${isXClass ? 'bg-red-500' : 'bg-orange-500'}`}></div>
        </div>
      )}

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Probability Ring Card */}
        <div className="bg-slate-800/40 p-5 rounded-[2rem] border-2 border-slate-700 col-span-2 flex items-center justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
           <div className="z-10">
             <h3 className="text-slate-400 font-bold uppercase text-xs mb-1">Aurora Probability</h3>
             <p className="text-white text-sm max-w-[120px] leading-tight opacity-80">Chance of visibility at your location.</p>
             <div className="mt-4 inline-block bg-teal-500/20 text-teal-300 px-3 py-1 rounded-lg text-xs font-bold border border-teal-500/30">
               {weather.tonightsWindow ? `Window: ${weather.tonightsWindow}` : 'Monitor Live'}
             </div>
           </div>
           <div className="z-10">
             <ProbabilityRing score={weather.probabilityScore || 0} />
           </div>
        </div>

        {/* KP Index */}
        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 p-5 rounded-[2rem] border-2 border-indigo-500/30 flex flex-col items-center justify-center">
          <span className="text-xs font-bold text-indigo-300 uppercase">Kp Index</span>
          <span className="text-5xl font-black font-heading text-white drop-shadow-md my-2">{weather.kpIndex}</span>
          <span className="text-[10px] text-slate-400">{weather.visibilityChance} Activity</span>
        </div>

        {/* Solar Data Grid */}
        <div className="grid grid-rows-3 gap-2 col-span-1">
          {/* Speed */}
          <div className="bg-slate-800/40 px-4 py-2 rounded-2xl border border-slate-700 flex flex-col justify-center">
             <span className="text-[10px] font-bold text-slate-500 uppercase">Wind Speed</span>
             <span className="text-lg font-black text-blue-300">
               {weather.solarWindSpeed !== undefined ? formatSpeed(weather.solarWindSpeed) : '-'}
             </span>
          </div>
          {/* Bz */}
          <div className="bg-slate-800/40 px-4 py-2 rounded-2xl border border-slate-700 flex flex-col justify-center">
             <span className="text-[10px] font-bold text-slate-500 uppercase">IMF (Bz)</span>
             <span className={`text-lg font-black ${weather.bz < 0 ? 'text-green-400' : 'text-slate-200'}`}>
               {weather.bz !== undefined ? `${weather.bz} nT` : '-'}
             </span>
          </div>
          {/* Density */}
          <div className="bg-slate-800/40 px-4 py-2 rounded-2xl border border-slate-700 flex flex-col justify-center">
             <span className="text-[10px] font-bold text-slate-500 uppercase">Density</span>
             <span className="text-lg font-black text-purple-300">
               {weather.solarWindDensity !== undefined ? formatDensity(weather.solarWindDensity) : '-'}
             </span>
          </div>
        </div>
      </div>

      {/* Nearest Detection Card */}
      {weather.nearestDetection && (
        <div className="bg-slate-900/60 p-5 rounded-[2rem] border-2 border-dashed border-slate-600 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-teal-500/5 group-hover:bg-teal-500/10 transition-colors"></div>
          {/* Radar Animation */}
          <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
             <span className="absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-20 animate-ping"></span>
             <div className="relative inline-flex rounded-full h-8 w-8 bg-slate-800 border-2 border-teal-500 items-center justify-center text-lg shadow-[0_0_15px_rgba(20,184,166,0.5)]">
               📡
             </div>
          </div>
          <div className="z-10">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nearest Signal Detected</h3>
            <p className="text-xl font-black font-heading text-white">{weather.nearestDetection.location}</p>
            <p className="text-sm text-teal-300 font-bold">{weather.nearestDetection.status}</p>
          </div>
        </div>
      )}

      {/* Chart Section */}
      <div className="bg-slate-800/40 p-5 rounded-[2rem] border-2 border-slate-700 shadow-lg">
        <h3 className="text-lg font-bold text-slate-300 mb-4 flex items-center gap-2">
          <span>📈</span> 6-Hour Forecast
        </h3>
        <div className="h-48 w-full bg-slate-900/30 rounded-2xl p-2 border border-slate-700/50">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weather.forecast}>
              <defs>
                <linearGradient id="colorKp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="5 5" stroke="#334155" vertical={false} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} fontFamily="Fredoka" dy={10} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 9]} fontFamily="Fredoka" dx={-10} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: '2px solid #334155', color: '#e2e8f0', fontFamily: 'Fredoka' }}
                itemStyle={{ color: '#2dd4bf' }}
              />
              <Area type="bump" dataKey="kp" stroke="#2dd4bf" fillOpacity={1} fill="url(#colorKp)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Text */}
      <div className="bg-slate-800/40 p-6 rounded-[2rem] border-2 border-slate-700 relative">
        <div className="absolute -top-3 -left-3 bg-indigo-500 text-white p-2 rounded-xl transform -rotate-12 shadow-lg border-2 border-indigo-300">
          📝
        </div>
        <h3 className="text-indigo-300 font-bold mb-3 text-lg ml-4">The Captain's Log</h3>
        <p className="text-slate-200 text-lg leading-relaxed">
          {rawText}
        </p>
      </div>
      
      {/* Sources Footer */}
      {sources.length > 0 && (
        <div className="pt-4 border-t-2 border-dashed border-slate-800/50">
           <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Intercepted Signals (Sources):</p>
           <div className="flex flex-wrap gap-2">
             {sources.map((s, i) => (
               <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="text-xs font-bold bg-slate-800 text-slate-400 hover:bg-teal-900 hover:text-teal-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors truncate max-w-[150px]">
                 🔗 {s.title || 'Data Stream'}
               </a>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;