"use client";

export function FurnitureLayer() {
  // Counter: x=100..700 (600px wide), y=340..475 (135px tall)
  // Zone 1 (Coffee): 100-300 | Zone 2 (Cash): 300-500 | Zone 3 (Pickup): 500-700
  return (
    <g id="furniture">
      {/* Counter top surface */}
      <rect x="100" y="340" width="600" height="12" fill="url(#counterTop)" rx="3" />
      <rect x="100" y="340" width="600" height="2" fill="#3ecf82" opacity="0.25" rx="1" />

      {/* Counter front face */}
      <rect x="100" y="352" width="600" height="120" fill="url(#counterFront)" />

      {/* Zone panels */}
      <rect x="110" y="360" width="180" height="100" fill="#145a32" rx="3" opacity="0.35" />
      <rect x="310" y="360" width="180" height="100" fill="#145a32" rx="3" opacity="0.35" />
      <rect x="510" y="360" width="180" height="100" fill="#145a32" rx="3" opacity="0.35" />

      {/* Zone divider lines */}
      <line x1="300" y1="355" x2="300" y2="470" stroke="#145a32" strokeWidth="2" opacity="0.4" />
      <line x1="500" y1="355" x2="500" y2="470" stroke="#145a32" strokeWidth="2" opacity="0.4" />

      {/* Bottom trim */}
      <rect x="100" y="468" width="600" height="6" fill="#5C2E0E" rx="1" />

      {/* Counter shadow */}
      <rect x="105" y="474" width="590" height="4" fill="rgba(0,0,0,0.06)" rx="2" />
    </g>
  );
}
