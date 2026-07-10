// BALANCE brand mark — custom geometric letters, very wide tracking (~0.55em),
// crossbar-less "A" (inverted V) and a three-bar "E".
// Colour follows currentColor; size with a height class (h-*).

const A_PATH =
  "M0 174 L55 0 H75 L130 174 H98 L65 58 L32 174 Z";

export function Wordmark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1260 174"
      className={className}
      role="img"
      aria-label="BALANCE"
      fill="currentColor"
    >
      {/* B */}
      <path d="
        M0 0
        H46
        C84 0 106 18 106 46
        C106 66 95 80 77 88
        C99 96 113 114 113 138
        C113 160 95 174 58 174
        H0
        Z

        M26 22
        V74
        H44
        C63 74 79 64 79 47
        C79 30 64 22 44 22
        Z

        M26 96
        V151
        H54
        C77 151 87 140 87 123
        C87 106 76 96 54 96
        Z
      " />

      {/* A */}
      <g transform="translate(180)">
        <path d={A_PATH} />
      </g>

      {/* L */}
      <path
        transform="translate(390)"
        d="
          M0 0
          H28
          V148
          H102
          V174
          H0
          Z
        "
      />

      {/* A */}
      <g transform="translate(565)">
        <path d={A_PATH} />
      </g>

      {/* N */}
      <path
        transform="translate(760)"
        d="
          M0 174
          V0
          H28
          L118 132
          V0
          H146
          V174
          H118
          L28 42
          V174
          Z
        "
      />

      {/* C */}
      <path
        transform="translate(980)"
        d="
          M120 24
          C103 9 80 0 53 0
          C22 0 0 18 0 87
          C0 156 22 174 53 174
          C80 174 103 165 120 150
          L103 128
          C90 140 74 147 56 147
          C24 147 15 120 15 87
          C15 54 24 27 56 27
          C74 27 90 34 103 46
          Z
        "
      />

      {/* E */}
      <g transform="translate(1160)">
        <rect width="78" height="18" rx="2" />
        <rect y="78" width="78" height="18" rx="2" />
        <rect y="156" width="78" height="18" rx="2" />
      </g>
    </svg>
  );
}
