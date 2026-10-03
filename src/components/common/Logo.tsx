import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = 'w-9 h-9', size }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="64 84 384 384"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="PAOKOO Logo"
    >
      <defs>
        <linearGradient id="pk-white" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dce6f1" />
        </linearGradient>
        <linearGradient id="pk-mint" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8bf4c3" />
          <stop offset="1" stopColor="#3dd598" />
        </linearGradient>
        <linearGradient id="pk-pig" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#66e8ae" />
          <stop offset="1" stopColor="#0fbf86" />
        </linearGradient>
        <linearGradient id="pk-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe680" />
          <stop offset="1" stopColor="#ffb52e" />
        </linearGradient>
        <filter id="pk-sh" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="7" stdDeviation="8" floodColor="#00140f" floodOpacity=".4" />
        </filter>
        <mask id="pk-cut" maskUnits="userSpaceOnUse" x="-50" y="-50" width="612" height="612">
          <rect x="-50" y="-50" width="612" height="612" fill="#fff" />
          <g fill="#000" stroke="#000" strokeWidth="24" strokeLinejoin="round" strokeLinecap="round">
            <ellipse cx="256" cy="362" rx="98" ry="72" />
            <ellipse cx="166" cy="368" rx="17" ry="21" />
            <path d="M192 322l8-40c1-6 8-8 12-4l32 24z" />
            <rect x="205" y="408" width="34" height="42" rx="13" />
            <rect x="273" y="408" width="34" height="42" rx="13" />
            <circle cx="256" cy="238" r="46" />
            <path d="M350 346c20-12 38 4 24 20-6 6-15 6-20 1" fill="none" strokeWidth="34" />
          </g>
        </mask>
      </defs>

      <g transform="translate(0 -14)">
        <g mask="url(#pk-cut)">
          {/* Person Left */}
          <g filter="url(#pk-sh)" fill="url(#pk-white)">
            <circle cx="164" cy="156" r="40" />
            <path d="M92 342V276C92 230 120 200 160 200C190 200 206 208 206 220C206 232 190 238 182 250C174 262 176 288 184 306L186 344Q186 352 178 352H100Q92 352 92 344Z" />
          </g>
          {/* Person Right (Mirrored) */}
          <g filter="url(#pk-sh)" fill="url(#pk-mint)" transform="translate(512 0) scale(-1 1)">
            <circle cx="164" cy="156" r="40" />
            <path d="M92 342V276C92 230 120 200 160 200C190 200 206 208 206 220C206 232 190 238 182 250C174 262 176 288 184 306L186 344Q186 352 178 352H100Q92 352 92 344Z" />
          </g>
        </g>

        {/* Piggy Bank */}
        <g filter="url(#pk-sh)" fill="url(#pk-pig)">
          <path d="M350 346c20-12 38 4 24 20-6 6-15 6-20 1" fill="none" stroke="#27d097" strokeWidth="10" strokeLinecap="round" />
          <rect x="205" y="408" width="34" height="42" rx="13" />
          <rect x="273" y="408" width="34" height="42" rx="13" />
          <ellipse cx="256" cy="362" rx="98" ry="72" />
          <ellipse cx="166" cy="368" rx="17" ry="21" />
          <path d="M192 322l8-40c1-6 8-8 12-4l32 24z" stroke="url(#pk-pig)" strokeWidth="6" strokeLinejoin="round" />
        </g>
        <circle cx="208" cy="346" r="7" fill="#07382d" />
        <circle cx="163" cy="364" r="3" fill="#0a6a52" />
        <circle cx="163" cy="376" r="3" fill="#0a6a52" />
        <rect x="226" y="296" width="60" height="11" rx="5.5" fill="#0a6a52" />

        {/* Coin */}
        <g filter="url(#pk-sh)">
          <circle cx="256" cy="238" r="46" fill="url(#pk-gold)" />
        </g>
        <circle cx="256" cy="238" r="34" fill="#ffc43d" stroke="#ffd96b" strokeWidth="3" />
        <g transform="translate(256 238) scale(.82) translate(-261 -244)" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M244 219h17a12 12 0 0 1 0 24h-17M244 243h21a13 13 0 0 1 0 26h-21M244 219v50" />
          <path d="M253 209v10M265 209v10M253 269v10M265 269v10" />
        </g>

        {/* Rays */}
        <g stroke="#ffd466" strokeWidth="10" strokeLinecap="round">
          <path d="M256 130v22" />
          <path d="M225 141l10 16" />
          <path d="M287 141l-10 16" />
        </g>
      </g>
    </svg>
  );
};
