import React, { useState, useRef } from 'react';
import { analyzeSkyPhoto } from '../services/geminiService';
import { WeatherData, PhotoAnalysis } from '../types';

interface PhotoGuideProps {
  weather: WeatherData | null;
}

const PhotoGuide: React.FC<PhotoGuideProps> = ({ weather }) => {
  const [device, setDevice] = useState('Smartphone');
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setAnalysis(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).replace(/^data:image\/[a-z]+;base64,/, "");
      
      try {
        const result = await analyzeSkyPhoto(base64String, device);
        setAnalysis(result);
      } catch (err) {
        console.error("Analysis failed", err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="pb-24 space-y-6">
      <div className="bg-gradient-to-br from-purple-900/60 to-slate-900 p-6 rounded-[2rem] border-2 border-purple-500/30 shadow-[0_8px_0_0_rgba(88,28,135,0.2)]">
        <div className="flex items-center gap-3 mb-2">
           <span className="text-4xl">📸</span>
           <h2 className="text-3xl font-bold text-white">Photo Lab</h2>
        </div>
        <p className="text-purple-200 text-lg">
          Upload a photo of the sky. I'll analyze clouds, light pollution, and give you the perfect settings.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="block text-lg font-bold text-purple-300 ml-2">My Device</label>
           <select
            value={device}
            onChange={(e) => setDevice(e.target.value)}
            className="w-full appearance-none bg-slate-800/50 border-2 border-dashed border-slate-600 rounded-2xl px-6 py-4 text-white focus:border-purple-400 focus:ring-0 focus:bg-slate-800 transition-all text-lg font-heading"
          >
            <option value="Smartphone">Smartphone 📱</option>
            <option value="DSLR/Mirrorless">DSLR / Mirrorless 📷</option>
            <option value="Action Camera">Action Camera 📹</option>
          </select>
        </div>

        <div className="bg-slate-800/30 border-2 border-dashed border-slate-600 rounded-[2rem] p-8 text-center hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />
          <div className="text-6xl mb-4">☁️</div>
          <p className="text-xl font-bold text-slate-300">Tap to Upload Sky Photo</p>
          <p className="text-sm text-slate-500 mt-2">I'll check for stars and darkness</p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center p-8 bg-slate-800/50 rounded-[2rem]">
             <span className="animate-spin text-4xl mb-4">⚙️</span>
             <span className="font-heading text-xl text-purple-300">Analyzing Pixels...</span>
          </div>
        )}
      </div>

      {analysis && (
        <div className="bg-slate-800/60 rounded-[2rem] p-6 border-2 border-slate-600 animate-[fade-in_0.5s_ease-out] relative mt-8 space-y-6">
           <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-teal-500 text-slate-900 px-6 py-2 rounded-full font-bold shadow-lg border-2 border-white transform -rotate-2 whitespace-nowrap">
             ANALYSIS COMPLETE
           </div>

           {/* Environment Assessment */}
           <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
                <p className="text-xs font-bold text-slate-500 uppercase">Cloud Cover</p>
                <p className="text-lg font-bold text-white">{analysis.cloudCover}</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
                <p className="text-xs font-bold text-slate-500 uppercase">Darkness</p>
                <p className="text-lg font-bold text-white">{analysis.darknessRating}</p>
              </div>
           </div>

           {/* Recommended Settings */}
           <div className="bg-purple-900/20 p-5 rounded-2xl border-2 border-purple-500/30 border-dashed">
             <h3 className="text-lg font-bold text-purple-300 mb-3">⚙️ Recommended Settings</h3>
             <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                <div>
                  <span className="text-xs text-purple-200/60 uppercase block">ISO</span>
                  <span className="font-mono text-white text-lg">{analysis.recommendedSettings.iso}</span>
                </div>
                <div>
                  <span className="text-xs text-purple-200/60 uppercase block">Shutter</span>
                  <span className="font-mono text-white text-lg">{analysis.recommendedSettings.shutterSpeed}</span>
                </div>
                <div>
                  <span className="text-xs text-purple-200/60 uppercase block">Aperture</span>
                  <span className="font-mono text-white text-lg">{analysis.recommendedSettings.aperture}</span>
                </div>
                <div>
                  <span className="text-xs text-purple-200/60 uppercase block">Focus</span>
                  <span className="font-mono text-white text-lg">{analysis.recommendedSettings.focus}</span>
                </div>
             </div>
           </div>

           {/* Checklist */}
           <div>
             <h3 className="text-lg font-bold text-slate-300 mb-3">✅ Mission Checklist</h3>
             <ul className="space-y-2">
               {analysis.checklist.map((item, idx) => (
                 <li key={idx} className="flex items-start gap-3 bg-slate-700/30 p-3 rounded-xl">
                   <span className="text-teal-400 mt-0.5">✔</span>
                   <span className="text-slate-200 text-sm leading-snug">{item}</span>
                 </li>
               ))}
             </ul>
           </div>

           {/* Feedback */}
           <div className="bg-teal-500/10 p-4 rounded-2xl border border-teal-500/30 text-teal-200 text-sm italic text-center">
             "{analysis.feedback}"
           </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGuide;
