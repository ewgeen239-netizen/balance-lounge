// BALANCE brand mark — custom geometric letters, crossbar-less "A" and a
// three-bar "E". Colour follows currentColor; size with a height class (h-*).

export function Wordmark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="-6 -6 475 64"
      className={className}
      role="img"
      aria-label="BALANCE"
      fill="currentColor"
    >
      {/* B */}
      <path d="M0 0H17.5C28 0 34.5 5.2 34.5 13.3C34.5 18.2 32 22 27.8 24C33.1 25.8 36.5 30.4 36.5 36.5C36.5 45.9 29.1 52 17.5 52H0V0ZM8 7V21H16.1C22.7 21 26.3 18.4 26.3 14C26.3 9.5 22.7 7 16.1 7H8ZM8 28V45H17.2C24.5 45 28.4 41.9 28.4 36.4C28.4 31 24.5 28 17.2 28H8Z" />
      {/* A */}
      <path d="M66 52L84.8 0H92.5L111.5 52H102.5L88.7 12.4L75 52H66Z" />
      {/* L */}
      <path d="M141 0H149V44.5H171V52H141V0Z" />
      {/* A */}
      <path d="M201 52L219.8 0H227.5L246.5 52H237.5L223.7 12.4L210 52H201Z" />
      {/* N */}
      <path d="M276 52V0H284L315 39V0H323V52H315L284 13V52H276Z" />
      {/* C */}
      <path transform="translate(41 0)" d="M358 9.7C352.8 4.7 346.2 2 338.7 2C323.7 2 312 13.2 312 26C312 39.1 323.7 50 338.7 50C346.1 50 352.8 47.3 358 42.3L352.8 36.5C349 40.1 344.2 42 339 42C328.3 42 320.3 35.2 320.3 26C320.3 16.9 328.3 10 339 10C344.2 10 349 11.9 352.8 15.5L358 9.7Z" />
      {/* E — three bars */}
      <g transform="translate(429 0)">
        <rect x="0" y="0" width="34" height="7" />
        <rect x="0" y="22.5" width="34" height="7" />
        <rect x="0" y="45" width="34" height="7" />
      </g>
    </svg>
  );
}
