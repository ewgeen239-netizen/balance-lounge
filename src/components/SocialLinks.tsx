// Social links with brand glyphs, styled to the site (monochrome, neon on hover).

type Props = {
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  telegram?: string;
  size?: "sm" | "md";
  className?: string;
};

const ICONS: Record<string, React.ReactNode> = {
  instagram: (
    <>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  facebook: (
    <path d="M14.5 8.5h2V5.7h-2.3c-2 0-3.2 1.2-3.2 3.3v1.7H9v2.7h2v6.9h2.8v-6.9h2.2l.4-2.7h-2.6V9.4c0-.6.3-.9 1.1-.9z" fill="currentColor" stroke="none" />
  ),
  whatsapp: (
    <>
      <path d="M4 20l1.1-3.9A7.6 7.6 0 1 1 8 19.1L4 20z" />
      <path d="M9 8.5c.2-.5.4-.5.7-.5h.5c.2 0 .4 0 .6.5l.7 1.6c.1.2.1.4 0 .6l-.5.7c-.1.2-.2.3 0 .6.3.5.9 1.3 1.7 1.8.8.5 1.1.5 1.4.4l.6-.7c.2-.2.4-.2.6-.1l1.5.8c.3.2.4.3.4.5s0 .9-.4 1.4c-.4.5-1.2.9-1.9.9-1.6 0-3.6-1-5-2.4-1.4-1.4-2.3-3.1-2.4-4.4 0-.7.3-1.4.7-1.9z" fill="currentColor" stroke="none" />
    </>
  ),
  telegram: (
    <path d="M21.5 4.3L2.9 11.5c-.9.4-.9 1.2 0 1.5l4.6 1.4 1.8 5.4c.2.5.4.6.9.3l2.6-1.9 4.5 3.3c.6.3 1 .1 1.2-.5l3-14c.2-.8-.3-1.2-1-.9z" fill="currentColor" stroke="none" />
  ),
};

const LABEL: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
};

export function SocialLinks({ instagram, facebook, whatsapp, telegram, size = "md", className = "" }: Props) {
  const entries = Object.entries({ instagram, facebook, whatsapp, telegram }).filter(
    ([, url]) => url && url.trim()
  ) as [string, string][];
  if (!entries.length) return null;

  const ic = size === "sm" ? 16 : 18;
  const pad = size === "sm" ? "px-3 py-1.5" : "px-3.5 py-2";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {entries.map(([key, url]) => (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noreferrer"
          aria-label={LABEL[key]}
          className={`group flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] ${pad} text-neutral-300 transition hover:border-neon hover:text-neon hover:shadow-glow`}
        >
          <svg width={ic} height={ic} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            {ICONS[key]}
          </svg>
          <span className="text-xs font-medium tracking-wide sm:text-sm">{LABEL[key]}</span>
        </a>
      ))}
    </div>
  );
}
