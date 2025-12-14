import React, { useState, useEffect } from 'react';
import { AppView, Coordinates, WeatherData, GroundingSource } from './types';
import { fetchSpaceWeather } from './services/geminiService';
import Dashboard from './components/Dashboard';
import PhotoGuide from './components/PhotoGuide';
import ChatGuardian from './components/ChatGuardian';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [rawText, setRawText] = useState<string>('');  
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');

  // Initial Location Fetch
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setLocation(coords);
          loadWeatherData(coords);
        },
        (error) => {
          setLocationError("Location access denied. Using default (Reykjavik).");
          const defaultCoords = { latitude: 64.1265, longitude: -21.8174 };
          setLocation(defaultCoords);
          loadWeatherData(defaultCoords);
        }
      );
    } else {
      setLocationError("Geolocation not supported.");
    }
  }, []);

  const loadWeatherData = async (coords: Coordinates) => {
    setLoading(true);
    try {
      const result = await fetchSpaceWeather(coords);
      setWeatherData(result.data);
      setRawText(result.rawText);
      setSources(result.sources);
    } catch (error) {
      console.error("Failed to load weather data", error);
      setRawText("Unable to fetch space weather data at this moment.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (location) loadWeatherData(location);
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return (
          <Dashboard 
            weather={weatherData} 
            loading={loading} 
            rawText={rawText} 
            sources={sources}
            onRefresh={handleRefresh}
            unitSystem={unitSystem}
          />
        );
      case AppView.PHOTO_GUIDE:
        return <PhotoGuide weather={weatherData} />;
      case AppView.CHAT:
        return <ChatGuardian />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative text-slate-100 selection:bg-pink-500/30">
      {/* Background Ambience */}
      <div className="stars"></div>
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-0 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-20 right-0 w-[300px] h-[300px] bg-teal-500/20 rounded-full blur-[80px]"></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto h-full flex flex-col min-h-screen">
        
        {/* Header */}
        <header className="px-6 py-4 flex items-center justify-between sticky top-4 mx-4 rounded-full bg-slate-900/60 backdrop-blur-md z-20 border-2 border-slate-700/50 shadow-[0_4px_0_0_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shadow-inner border-2 border-white/20">
              <span className="-mt-1">✨</span>
            </div>
            <h1 className="text-xl tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-teal-200 to-purple-200 drop-shadow-sm hidden sm:block">
              GlareMyAurora
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setUnitSystem(prev => prev === 'metric' ? 'imperial' : 'metric')}
              className="bg-slate-800 border border-slate-600 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors"
            >
              {unitSystem === 'metric' ? 'KM/S' : 'MPH'}
            </button>
            {locationError && (
               <span className="text-sm font-bold text-yellow-400 hidden sm:block bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/30">
                 !
               </span>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          {renderContent()}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-6 left-6 right-6 z-30">
          <div className="max-w-md mx-auto bg-slate-800/90 backdrop-blur-xl border-2 border-slate-600 rounded-full shadow-[0_8px_0_0_rgba(0,0,0,0.4)] p-2 flex justify-between items-center">
            
            <button
              onClick={() => setCurrentView(AppView.DASHBOARD)}
              className={`flex-1 flex flex-col items-center py-2 rounded-full transition-all duration-300 ${
                currentView === AppView.DASHBOARD 
                ? 'bg-teal-500 text-slate-900 shadow-lg transform -translate-y-1' 
                : 'text-slate-400 hover:text-teal-300'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              <span className="text-xs font-bold mt-0.5">Forecast</span>
            </button>
            
            <button
              onClick={() => setCurrentView(AppView.PHOTO_GUIDE)}
              className={`flex-1 flex flex-col items-center py-2 rounded-full transition-all duration-300 ${
                currentView === AppView.PHOTO_GUIDE 
                ? 'bg-purple-500 text-white shadow-lg transform -translate-y-1' 
                : 'text-slate-400 hover:text-purple-300'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs font-bold mt-0.5">Photo</span>
            </button>

            <button
              onClick={() => setCurrentView(AppView.CHAT)}
              className={`flex-1 flex flex-col items-center py-2 rounded-full transition-all duration-300 ${
                currentView === AppView.CHAT 
                ? 'bg-blue-500 text-white shadow-lg transform -translate-y-1' 
                : 'text-slate-400 hover:text-blue-300'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="text-xs font-bold mt-0.5">Guardian</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
};

export default App;
