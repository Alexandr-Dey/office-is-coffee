"use client";

export function BackgroundLayer() {
  return (
    <g id="background">
      {/* Sky/window area */}
      <rect x="0" y="0" width="800" height="150" fill="#87CEEB" opacity="0.3" />

      {/* Left red wall (0-250) */}
      <rect x="0" y="0" width="250" height="600" fill="#c0392b" />
      <rect x="240" y="0" width="10" height="600" fill="#a93226" />

      {/* Center + right light wall (250-800) */}
      <rect x="250" y="0" width="550" height="600" fill="#f5f0e8" />
      <rect x="250" y="0" width="12" height="600" fill="#e8e0d0" />

      {/* Window left (20-200, 20-140) */}
      <rect x="20" y="20" width="180" height="120" fill="#b8d4e3" rx="3" />
      <rect x="20" y="20" width="180" height="120" fill="none" stroke="#8b6f47" strokeWidth="4" rx="3" />
      <line x1="110" y1="20" x2="110" y2="140" stroke="#8b6f47" strokeWidth="3" />
      <line x1="20" y1="80" x2="200" y2="80" stroke="#8b6f47" strokeWidth="3" />

      {/* Window right (620-780, 20-140) */}
      <rect x="620" y="20" width="160" height="120" fill="#b8d4e3" rx="3" />
      <rect x="620" y="20" width="160" height="120" fill="none" stroke="#8b6f47" strokeWidth="4" rx="3" />
      <line x1="700" y1="20" x2="700" y2="140" stroke="#8b6f47" strokeWidth="3" />
      <line x1="620" y1="80" x2="780" y2="80" stroke="#8b6f47" strokeWidth="3" />

      {/* Logo on red wall */}
      <g transform="translate(125, 170)">
        {/* Heart */}
        <path d="M0,-12 C-5,-20 -18,-18 -18,-8 C-18,2 0,16 0,16 C0,16 18,2 18,-8 C18,-18 5,-20 0,-12Z"
          fill="#fff" opacity="0.9" />
        {/* Coffee bean dots */}
        <circle cx="-4" cy="0" r="2" fill="#5C2E0E" />
        <circle cx="4" cy="0" r="2" fill="#5C2E0E" />
        {/* Text */}
        <text x="0" y="30" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold" fontFamily="sans-serif">LOVE IS</text>
        <text x="0" y="46" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="bold" fontFamily="sans-serif">COFFEE</text>
      </g>

      {/* Menu boards on center wall */}
      {[{ x: 290, title: "COFFEE" }, { x: 420, title: "AUTHOR" }, { x: 550, title: "SEASON" }].map((b, i) => (
        <g key={i}>
          <rect x={b.x} y="160" width="110" height="80" fill="#1a1a1a" rx="2" />
          <rect x={b.x} y="160" width="110" height="80" fill="none" stroke="#333" strokeWidth="2" rx="2" />
          <text x={b.x + 55} y="180" textAnchor="middle" fill="#3ecf82" fontSize="8" fontWeight="bold">{b.title}</text>
          {[0, 1, 2, 3].map(li => (
            <g key={li}>
              <rect x={b.x + 10} y={190 + li * 14} width={50 + (li % 2) * 10} height="4" fill="#555" rx="1" />
              <rect x={b.x + 70} y={190 + li * 14} width="20" height="4" fill="#777" rx="1" />
            </g>
          ))}
        </g>
      ))}

      {/* Decorative quote on right wall */}
      <text x="700" y="200" textAnchor="middle" fill="#d4c9b8" fontSize="7" fontStyle="italic" opacity="0.6">
        {"\"Best cappuccino in town\""}
      </text>

      {/* Floor */}
      <rect x="0" y="550" width="800" height="50" fill="#8b6f47" />
      <rect x="0" y="550" width="800" height="6" fill="#a0825a" />
    </g>
  );
}
