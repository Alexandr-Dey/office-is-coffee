"use client";

export function BackgroundLayer() {
  return (
    <g id="background">
      {/* Red wall — left third */}
      <rect x="0" y="0" width="300" height="600" fill="#c0392b" />
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
        { x: 340, title: "☕ CLASSIC", items: ["Cappuccino  850", "Latte  900", "Americano  750", "Espresso  450"] },
        { x: 490, title: "✨ AUTHOR", items: ["Raf Classic  1250", "Raf Honey  1250", "Mocha  1250", "Flat White  1050"] },
        { x: 640, title: "🍵 MORE", items: ["Matcha  1100", "Cacao  900", "Fresh  800", "Smoothie  1000"] },
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
