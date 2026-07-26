import React from 'react';

interface LiquidProgressProps {
  percentage: number; // 0 to 100
  color?: string; // CSS color string, defaults to Sky Blue
  height?: string; // CSS height class, e.g. "h-40"
  label?: string;
  sublabel?: string;
  onClick?: () => void;
}

export const LiquidProgress: React.FC<LiquidProgressProps> = ({
  percentage,
  color = 'bg-dairy-sky/20',
  height = 'h-32',
  label,
  sublabel,
  onClick
}) => {
  const cappedPercent = Math.min(Math.max(percentage, 0), 100);

  return (
    <div 
      onClick={onClick}
      className={`relative w-full ${height} rounded-3xl overflow-hidden glass-card flex flex-col justify-between p-5 ${
        onClick ? 'cursor-pointer hover:border-dairy-sky/60 active:scale-[0.98] transition-all' : ''
      }`}
    >
      {/* Background Glass Reflection Gloss */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/30 pointer-events-none" />

      {/* Animated Liquid Reservoir */}
      <div 
        className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out"
        style={{ height: `${cappedPercent}%` }}
      >
        {/* Wave 1 - Primary Liquid */}
        <div className={`absolute bottom-0 left-0 right-0 h-[200%] w-[400%] ${color} rounded-[40%] opacity-40 liquid-wave`} style={{ left: '-50%' }} />

        {/* Wave 2 - Back Layer Ripple */}
        <div className={`absolute bottom-0 left-0 right-0 h-[200%] w-[400%] ${color} rounded-[38%] opacity-30 liquid-wave-fast`} style={{ left: '-75%' }} />
      </div>

      {/* Card Content (Always visible over the liquid) */}
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold text-dairy-text/60 tracking-wider uppercase">{label}</p>
          <p className="text-lg font-bold font-space text-dairy-text mt-1">{sublabel}</p>
        </div>
        <div className="bg-white/40 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-dairy-text/80 shadow-sm border border-white/50">
          {Math.round(cappedPercent)}%
        </div>
      </div>

      {/* Tiny bubble animation particles in background */}
      <div className="absolute inset-x-0 bottom-0 top-6 overflow-hidden pointer-events-none z-0">
        {cappedPercent > 10 && (
          <div className="absolute bottom-2 left-1/4 w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
        )}
        {cappedPercent > 30 && (
          <div className="absolute bottom-6 left-2/3 w-1 h-1 bg-white/40 rounded-full animate-pulse" />
        )}
        {cappedPercent > 60 && (
          <div className="absolute bottom-10 left-1/3 w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        )}
      </div>
    </div>
  );
};
export default LiquidProgress;
