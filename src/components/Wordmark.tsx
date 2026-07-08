// BALANCE brand mark — custom geometric letters, very wide tracking (~0.55em),
// crossbar-less "A" (inverted V) and a three-bar "E".
// Colour follows currentColor; size with a height class (h-*).

const A_PATH = "M218 0 L242 0 L305 174 L268 174 L230 72 L192 174 L155 174 Z";

export function Wordmark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="-10 -10 1653 194"
      className={className}
      role="img"
      aria-label="BALANCE"
      fill="currentColor"
    >
      {/* B */}
      <path d="M0 0 H38 C70 0 90 17 90 43 C90 60 81 73 65 80 C85 87 98 103 98 125 C98 155 75 174 40 174 H0 V0 Z M24 23 V69 H37 C55 69 65 60 65 46 C65 32 55 23 37 23 H24 Z M24 94 V151 H40 C61 151 73 140 73 123 C73 105 61 94 40 94 H24 Z" />
      {/* A (crossbar-less) */}
      <path transform="translate(65)" d={A_PATH} />
      {/* L */}
      <path transform="translate(108)" d="M385 0 H412 V148 H493 V174 H385 V0 Z" />
      {/* A (crossbar-less) */}
      <path transform="translate(568)" d={A_PATH} />
      {/* N */}
      <path transform="translate(201)" d="M795 174 V0 H823 L920 128 V0 H947 V174 H920 L822 46 V174 H795 Z" />
      {/* C */}
      <path transform="translate(317)" d="M1110 31 C1090 12 1065 2 1034 2 C981 2 941 41 941 87 C941 134 981 173 1035 173 C1064 173 1091 163 1111 144 L1094 124 C1078 139 1058 147 1036 147 C998 147 970 121 970 87 C970 53 998 28 1036 28 C1058 28 1077 36 1094 51 L1110 31 Z" />
      {/* E — three bars */}
      <g transform="translate(1538 0)">
        <rect x="0" y="0" width="125" height="26" />
        <rect x="0" y="74" width="125" height="26" />
        <rect x="0" y="148" width="125" height="26" />
      </g>
    </svg>
  );
}
