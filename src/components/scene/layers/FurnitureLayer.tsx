"use client";

export function FurnitureLayer() {
  return (
    <g id="furniture">
      {/* Main counter (150-650 x, 300-400 y) */}
      {/* Counter top highlight */}
      <rect x="150" y="300" width="500" height="8" fill="#2d9e5a" rx="2" />
      {/* Counter body */}
      <rect x="150" y="308" width="500" height="92" fill="#1a7a44" />
      {/* Counter shadow under top */}
      <rect x="150" y="308" width="500" height="4" fill="#145a32" />
      {/* Decorative text on counter front */}
      <text x="300" y="370" fill="rgba(255,255,255,0.12)" fontSize="10" fontFamily="sans-serif" fontStyle="italic">
        {"\u2615 love is coffee \u2615 love is coffee \u2615"}
      </text>
      {/* Wooden panel bottom */}
      <rect x="155" y="380" width="490" height="15" fill="#145a32" rx="2" opacity="0.3" />

      {/* Left table (by window) */}
      <rect x="60" y="480" width="60" height="4" fill="#8b6f47" rx="2" />
      <rect x="60" y="484" width="60" height="40" fill="none" stroke="#8b6f47" strokeWidth="3" />
      {/* Chairs */}
      <rect x="50" y="490" width="12" height="30" fill="#6b5b47" rx="2" />
      <rect x="118" y="490" width="12" height="30" fill="#6b5b47" rx="2" />

      {/* Right table (by window) */}
      <rect x="680" y="480" width="80" height="4" fill="#8b6f47" rx="2" />
      <rect x="680" y="484" width="80" height="40" fill="none" stroke="#8b6f47" strokeWidth="3" />
      {/* Bench/sofa by window */}
      <rect x="670" y="488" width="14" height="35" fill="#a0522d" rx="3" />
      <rect x="760" y="490" width="12" height="30" fill="#6b5b47" rx="2" />

      {/* Door (right side) */}
      <rect x="740" y="300" width="50" height="250" fill="#8b6f47" rx="3" />
      <rect x="742" y="302" width="46" height="246" fill="#a0825a" rx="2" />
      {/* Door handle */}
      <circle cx="755" cy="430" r="4" fill="#c0c0c0" />
      {/* Door glass */}
      <rect x="750" y="310" width="30" height="100" fill="#b8d4e3" opacity="0.5" rx="2" />
    </g>
  );
}
