"use client";

export function BackgroundLayer() {
  return (
    <g id="background">
      {/* Red wall — left third */}
      <rect x="0" y="0" width="300" height="600" fill="#c0392b" />

      {/* === WINDOW (left side, floor to ceiling) === */}
      <g id="window-left">
        {/* Window frame */}
        <rect x="12" y="20" width="55" height="450" fill="#8b6f47" rx="3" />
        {/* Glass — sky background (will be replaced by weather) */}
        <rect x="16" y="24" width="47" height="442" fill="#87CEEB" rx="2" />
        {/* Sky gradient overlay */}
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5BA3D9" />
            <stop offset="60%" stopColor="#87CEEB" />
            <stop offset="100%" stopColor="#B8D4E3" />
          </linearGradient>
        </defs>
        <rect x="16" y="24" width="47" height="442" fill="url(#skyGrad)" rx="2" />

        {/* Clouds */}
        <ellipse cx="30" cy="80" rx="12" ry="5" fill="#fff" opacity="0.7">
          <animate attributeName="cx" values="30;50;30" dur="20s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="45" cy="75" rx="8" ry="4" fill="#fff" opacity="0.5">
          <animate attributeName="cx" values="45;25;45" dur="25s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="35" cy="160" rx="10" ry="4" fill="#fff" opacity="0.6">
          <animate attributeName="cx" values="35;55;35" dur="18s" repeatCount="indefinite" />
        </ellipse>

        {/* Sun */}
        <circle cx="50" cy="50" r="8" fill="#FFD93D" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.7;0.9" dur="4s" repeatCount="indefinite" />
        </circle>
        {/* Sun rays */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <line
            key={angle}
            x1={50 + 10 * Math.cos(angle * Math.PI / 180)}
            y1={50 + 10 * Math.sin(angle * Math.PI / 180)}
            x2={50 + 14 * Math.cos(angle * Math.PI / 180)}
            y2={50 + 14 * Math.sin(angle * Math.PI / 180)}
            stroke="#FFD93D"
            strokeWidth="1"
            opacity="0.5"
          >
            <animate attributeName="opacity" values="0.5;0.2;0.5" dur="3s" repeatCount="indefinite" begin={`${angle / 360}s`} />
          </line>
        ))}

        {/* Distant buildings silhouette */}
        <rect x="16" y="340" width="12" height="126" fill="#6B7280" opacity="0.3" />
        <rect x="30" y="360" width="10" height="106" fill="#6B7280" opacity="0.25" />
        <rect x="42" y="330" width="14" height="136" fill="#6B7280" opacity="0.2" />
        <rect x="56" y="370" width="7" height="96" fill="#6B7280" opacity="0.15" />

        {/* Tree silhouette */}
        <ellipse cx="25" cy="410" rx="10" ry="15" fill="#2d5a1e" opacity="0.3" />
        <rect x="23" y="420" width="4" height="46" fill="#5C2E0E" opacity="0.2" />

        {/* Window divider (cross) */}
        <line x1="39.5" y1="24" x2="39.5" y2="466" stroke="#8b6f47" strokeWidth="3" />
        <line x1="16" y1="245" x2="63" y2="245" stroke="#8b6f47" strokeWidth="3" />

        {/* Window sill */}
        <rect x="8" y="466" width="63" height="6" fill="#8b6f47" rx="1" />
        <rect x="10" y="470" width="59" height="3" fill="#6b5530" rx="1" />

        {/* Glass reflection */}
        <rect x="18" y="26" width="6" height="80" fill="#fff" opacity="0.08" rx="1" />
        <rect x="18" y="250" width="6" height="60" fill="#fff" opacity="0.06" rx="1" />
      </g>
      {/* Subtle brick texture */}
      {Array.from({ length: 12 }).map((_, row) =>
        Array.from({ length: 4 }).map((_, col) => (
          <rect
            key={`brick-${row}-${col}`}
            x={col * 72 + (row % 2) * 36 + 2}
            y={row * 42 + 8}
            width="68"
            height="38"
            fill="none"
            stroke="#a93226"
            strokeWidth="1"
            opacity="0.2"
            rx="1"
          />
        ))
      )}
      <rect x="290" y="0" width="10" height="600" fill="#a93226" />

      {/* Light wall — right two thirds */}
      <rect x="300" y="0" width="500" height="600" fill="#f5f0e8" />

      {/* === LOGO on red wall (large, centered) === */}
      <g transform="translate(150, 140)">
        {/* Heart — large */}
        <path
          d="M0,-26 C-10,-40 -34,-38 -34,-20 C-34,0 0,32 0,32 C0,32 34,0 34,-20 C34,-38 10,-40 0,-26Z"
          fill="#fff"
          opacity="0.92"
        />
        {/* Coffee bean inside heart */}
        <ellipse cx="-4" cy="0" rx="5" ry="8" fill="#5C2E0E" opacity="0.65" />
        <ellipse cx="4" cy="0" rx="5" ry="8" fill="#5C2E0E" opacity="0.65" />
        <line x1="0" y1="-7" x2="0" y2="7" stroke="#3a1a08" strokeWidth="1.2" opacity="0.4" />
        {/* Brand text — large */}
        <text x="0" y="52" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="bold" fontFamily="serif" letterSpacing="3">
          LOVE IS
        </text>
        <text x="0" y="78" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="bold" fontFamily="serif" letterSpacing="3">
          COFFEE
        </text>
        <line x1="-55" y1="88" x2="55" y2="88" stroke="#fff" strokeWidth="1" opacity="0.3" />
      </g>

      {/* === MENU BOARDS on light wall === */}
      {[
        { x: 340, title: "☕ КОФЕ", items: ["Капучино     850", "Латте        900", "Американо    750", "Эспрессо     450"] },
        { x: 490, title: "✨ АВТОРСКИЙ", items: ["Раф классика 1250", "Раф мёд      1250", "Мокко        1250", "Флэт уайт   1050"] },
        { x: 640, title: "🍵 ЕЩЁ", items: ["Матча        1100", "Какао         900", "Фреш          800", "Смузи        1000"] },
      ].map((board, i) => (
        <g key={i}>
          <rect x={board.x} y="50" width="120" height="105" fill="#1a1a1a" rx="3" />
          <rect x={board.x + 2} y="52" width="116" height="101" fill="#0f2818" rx="2" />
          <rect x={board.x} y="50" width="120" height="105" fill="none" stroke="#555" strokeWidth="1.5" rx="3" />
          <text x={board.x + 60} y="74" textAnchor="middle" fill="#3ecf82" fontSize="9" fontWeight="bold">
            {board.title}
          </text>
          <line x1={board.x + 12} y1="80" x2={board.x + 108} y2="80" stroke="#3ecf82" strokeWidth="0.5" opacity="0.4" />
          {board.items.map((item, j) => (
            <text key={j} x={board.x + 12} y={93 + j * 14} fill="#ddd" fontSize="7" fontFamily="monospace">
              {item}
            </text>
          ))}
        </g>
      ))}

      {/* === SHELF behind counter === */}
      <rect x="320" y="200" width="460" height="6" fill="#8b6f47" rx="1" />
      <rect x="320" y="206" width="460" height="2" fill="#6b5530" />
      {[360, 540, 720].map((bx) => (
        <path key={bx} d={`M${bx},206 L${bx},220 L${bx - 8},206`} fill="#6b5530" />
      ))}
      {/* Syrup bottles on shelf */}
      {[340, 364, 388, 412].map((sx, i) => {
        const colors = ["#d42b4f", "#f59e0b", "#3ecf82", "#8b4513"];
        return (
          <g key={sx}>
            <rect x={sx} y="182" width="16" height="18" fill={colors[i]} rx="2" opacity="0.8" />
            <rect x={sx + 4} y="174" width="8" height="10" fill={colors[i]} rx="1" opacity="0.6" />
            <rect x={sx + 5} y="172" width="6" height="4" fill="#666" rx="1" />
          </g>
        );
      })}
      {/* Coffee bags */}
      <rect x="450" y="180" width="28" height="20" fill="#5C2E0E" rx="2" />
      <text x="464" y="194" textAnchor="middle" fill="#d4a574" fontSize="6" fontWeight="bold">LiC</text>
      <rect x="486" y="182" width="26" height="18" fill="#3a1a08" rx="2" />
      <text x="499" y="194" textAnchor="middle" fill="#e8b88a" fontSize="6">100%</text>
      {/* Glass jars */}
      <rect x="530" y="176" width="20" height="24" fill="#b8d4e3" opacity="0.35" rx="2" />
      <rect x="530" y="186" width="20" height="14" fill="#5C2E0E" opacity="0.5" rx="1" />
      <rect x="528" y="174" width="24" height="4" fill="#8b6f47" rx="1" />
      {/* Mugs */}
      {[570, 594, 618].map((mx) => (
        <g key={mx}>
          <rect x={mx} y="186" width="16" height="14" fill="#fff" rx="2" />
          <rect x={mx + 16} y="189" width="4" height="7" fill="none" stroke="#ccc" strokeWidth="1" rx="1" />
          <circle cx={mx + 8} cy="193" r="2.5" fill="#d42b4f" />
        </g>
      ))}
      {/* Pour-over */}
      <g transform="translate(660, 174)">
        <rect x="0" y="14" width="24" height="12" fill="#333" rx="1" />
        <polygon points="3,14 12,0 21,14" fill="#c0c0c0" stroke="#999" strokeWidth="0.5" />
      </g>

      {/* === FLOOR === */}
      {/* Floor line — sharp divider */}
      <rect x="0" y="476" width="800" height="4" fill="#5a3921" />
      {/* Floor */}
      <rect x="0" y="480" width="800" height="120" fill="#8b6f47" />
      {/* Wood plank lines */}
      {[0, 110, 250, 400, 530, 680].map((fx) => (
        <line key={fx} x1={fx} y1="480" x2={fx} y2="600" stroke="#7a6040" strokeWidth="1" opacity="0.25" />
      ))}
      {/* Highlight strip */}
      <rect x="150" y="482" width="500" height="2" fill="#a0825a" opacity="0.25" />
    </g>
  );
}
