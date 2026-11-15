import React, { useState } from 'react';

interface PropertyPhotoProps {
  imageUrl: string;
  alt: string;
  portal: string;
  postcode: string;
  className?: string;
}

export const PropertyPhoto: React.FC<PropertyPhotoProps> = ({
  imageUrl,
  alt,
  portal,
  postcode,
  className = 'w-full h-full object-cover',
}) => {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 text-center text-slate-300">
        <span className="material-symbols-outlined text-[28px] text-slate-400 mb-1.5">
          home_work
        </span>
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-300 font-semibold">
          {portal} • {postcode}
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5 max-w-[220px] truncate">{alt}</div>
        <div className="mt-2 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-400">
          Live photo unavailable
        </div>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
