import React, { useRef, useEffect } from 'react';
import { WeatherData } from '../types';

interface SpaceWeatherMapProps {
  weather: WeatherData | null;
}

const SpaceWeatherMap: React.FC<SpaceWeatherMapProps> = ({ weather }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    // Data Extraction
    const kp = weather?.kpIndex || 0;
    const windSpeed = weather?.solarWindSpeed || 400;
    const isFlare = weather?.solarFlare?.class && weather.solarFlare.class !== 'None';
    
    // Aurora Color Logic
    let auroraColor = 'rgba(74, 222, 128, 0.6)'; // Green
    if (kp >= 5) auroraColor = 'rgba(192, 132, 252, 0.7)'; // Purple
    if (kp >= 7) auroraColor = 'rgba(248, 113, 113, 0.8)'; // Red

    // Particle System for Solar Wind
    const particles: { x: number; y: number; speed: number; size: number }[] = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        speed: (Math.random() * 2 + 1) * (windSpeed / 300),
        size: Math.random() * 2
      });
    }

    const render = () => {
      time += 0.01;
      
      // Resize handling
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }
      
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width * 0.75; // Earth on right
      const centerY = height / 2;
      const earthRadius = Math.min(width, height) * 0.25;

      // Clear Canvas
      ctx.fillStyle = '#0f172a'; // Slate 900
      ctx.fillRect(0, 0, width, height);

      // 1. Draw Stars
      for (let i = 0; i < 100; i++) {
        const x = (Math.sin(i * 132.1 + time * 0.05) * 0.5 + 0.5) * width;
        const y = (Math.cos(i * 453.2) * 0.5 + 0.5) * height;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`;
        ctx.fillRect(x, y, 1, 1);
      }

      // 2. Draw Solar Wind (Particles)
      ctx.fillStyle = isFlare ? '#fca5a5' : '#94a3b8';
      particles.forEach(p => {
        p.x += p.speed;
        if (p.x > width) p.x = 0;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw trail
        ctx.strokeStyle = `rgba(148, 163, 184, 0.2)`;
        ctx.beginPath();
        ctx.moveTo(p.x - p.speed * 5, p.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      });

      // 3. Draw The Sun (Left Side)
      const sunGradient = ctx.createRadialGradient(0, centerY, 0, 0, centerY, width * 0.5);
      if (isFlare) {
        sunGradient.addColorStop(0, '#fff'); // Flare core
        sunGradient.addColorStop(0.1, '#ef4444'); // Red
        sunGradient.addColorStop(0.4, 'rgba(239, 68, 68, 0)');
      } else {
        sunGradient.addColorStop(0, '#f59e0b'); // Amber
        sunGradient.addColorStop(0.2, 'rgba(245, 158, 11, 0.1)');
        sunGradient.addColorStop(0.4, 'rgba(245, 158, 11, 0)');
      }
      ctx.fillStyle = sunGradient;
      ctx.fillRect(0, 0, width, height);

      // 4. Draw Earth Atmosphere Glow
      const earthGlow = ctx.createRadialGradient(centerX, centerY, earthRadius * 0.8, centerX, centerY, earthRadius * 1.2);
      earthGlow.addColorStop(0, 'rgba(56, 189, 248, 0)');
      earthGlow.addColorStop(1, 'rgba(56, 189, 248, 0.3)');
      ctx.fillStyle = earthGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, earthRadius * 1.2, 0, Math.PI * 2);
      ctx.fill();

      // 5. Draw Earth (Sphere)
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, earthRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#1e293b';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.clip(); // Clip everything to Earth circle

      // Draw Grid Lines (Rotating)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      const rotation = time * 0.5;
      
      // Longitude lines
      for (let i = 0; i < 12; i++) {
        const offset = (i * Math.PI / 6) + rotation;
        const x = centerX + Math.sin(offset) * earthRadius;
        
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, Math.abs(Math.sin(offset) * earthRadius), earthRadius, 0, 0, Math.PI * 2);
        // Only draw the "front" visually to simulate 3D? Simplified: just draw ellipse
        ctx.stroke();
      }
      
      // Latitude lines
      for (let i = 1; i < 6; i++) {
        const y = centerY + (i - 3) * (earthRadius / 3.5);
        ctx.beginPath();
        // Curve lines slightly to simulate sphere
        ctx.moveTo(centerX - Math.sqrt(earthRadius**2 - (y-centerY)**2), y);
        ctx.lineTo(centerX + Math.sqrt(earthRadius**2 - (y-centerY)**2), y);
        ctx.stroke();
      }

      // 6. Draw Aurora Oval (Top)
      // We simulate this by drawing multiple elliptical gradients near the top pole
      const auroraY = centerY - earthRadius * 0.6;
      
      // The Aurora Ring
      ctx.save();
      ctx.translate(centerX, auroraY);
      ctx.rotate(0.2); // Tilt
      
      // Base Glow
      const auroraGradient = ctx.createRadialGradient(0, 0, earthRadius * 0.2, 0, 0, earthRadius * 0.6);
      auroraGradient.addColorStop(0, 'rgba(0,0,0,0)');
      auroraGradient.addColorStop(0.5, auroraColor);
      auroraGradient.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.fillStyle = auroraGradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, earthRadius * 0.6, earthRadius * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Active Pillars (random vertical spikes in the ring)
      if (kp > 2) {
          ctx.globalCompositeOperation = 'lighter';
          for(let j=0; j< kp * 3; j++) {
              const angle = (Date.now() / 1000) + (j * (Math.PI * 2 / (kp*3)));
              const px = Math.cos(angle) * earthRadius * 0.4;
              const py = Math.sin(angle) * earthRadius * 0.1;
              
              const h = 20 + Math.random() * 20;
              
              const pillarGrad = ctx.createLinearGradient(px, py, px, py - h);
              pillarGrad.addColorStop(0, auroraColor);
              pillarGrad.addColorStop(1, 'rgba(0,0,0,0)');
              
              ctx.fillStyle = pillarGrad;
              ctx.fillRect(px, py - h, 2, h);
          }
      }
      
      ctx.restore();
      ctx.restore(); // Restore clip

      // Shockwave if Flare
      if (isFlare) {
         const waveX = (time * 50) % (width + 200);
         if (waveX < width) {
             ctx.strokeStyle = `rgba(255, 255, 255, ${1 - waveX/width})`;
             ctx.lineWidth = 2;
             ctx.beginPath();
             ctx.moveTo(waveX, 0);
             ctx.quadraticCurveTo(waveX - 50, height/2, waveX, height);
             ctx.stroke();
         }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [weather]);

  return (
    <div className="w-full h-48 md:h-64 rounded-[2rem] overflow-hidden border-2 border-slate-700 shadow-[0_0_30px_rgba(56,189,248,0.1)] relative bg-slate-900">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Overlay Text */}
      <div className="absolute bottom-4 left-6 pointer-events-none">
          <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Live Simulation</p>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${weather ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <p className="text-xs text-slate-300 font-mono">
                SOLAR_WIND: {weather?.solarWindSpeed || '---'} km/s
            </p>
          </div>
      </div>
    </div>
  );
};

export default SpaceWeatherMap;