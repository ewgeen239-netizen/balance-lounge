import type { Metadata } from "next";
import { Fragment } from "react";
import { PageHeading } from "@/components/PageHeading";
import { BindingNote, CookieSettingsButton } from "@/components/consent/PolicyBits";
import { POLICY, POLICY_EFFECTIVE_DATE, type PolicyBlock } from "@/content/privacyPolicy";

export const metadata: Metadata = {
  title: "Polityka prywatności — BALANCE",
  description: "Zasady przetwarzania danych osobowych (RODO) i plików cookie w BALANCE Cocktails & Shisha, Szczecin.",
};

/** Highlights [[placeholders]] so unfinished parts are easy to spot. */
function Text({ children }: { children: string }) {
  const parts = children.split(/(\[\[[^\]]+\]\])/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("[[") ? (
          <mark key={i} className="rounded bg-amber-400/15 px-1 text-amber-200">{part.slice(2, -2)}</mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}

function Block({ block }: { block: PolicyBlock }) {
  if ("p" in block) return <p className="leading-relaxed text-neutral-300"><Text>{block.p}</Text></p>;
  if ("ul" in block)
    return (
      <ul className="list-disc space-y-1.5 pl-5 leading-relaxed text-neutral-300 marker:text-ember">
        {block.ul.map((li, i) => <li key={i}><Text>{li}</Text></li>)}
      </ul>
    );

  const { head, rows } = block.table;
  return (
    <>
      {/* Desktop: a real table. */}
      <div className="hidden overflow-hidden rounded-2xl border border-white/10 md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink-800/60 text-xs uppercase tracking-wider text-neutral-400">
            <tr>{head.map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-white/5 align-top">
                {r.map((cell, j) => (
                  <td key={j} className={j === 0 ? "px-4 py-3 font-medium text-neutral-100" : "px-4 py-3 text-neutral-400"}>
                    <Text>{cell}</Text>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile: one card per row, so nothing scrolls sideways. */}
      <div className="space-y-3 md:hidden">
        {rows.map((r, i) => (
          <dl key={i} className="rounded-2xl border border-white/10 bg-ink-800/40 p-4 text-sm">
            <dt className="font-medium text-neutral-100"><Text>{r[0]}</Text></dt>
            {r.slice(1).map((cell, j) => (
              <dd key={j} className="mt-2">
                <span className="block text-[11px] uppercase tracking-wider text-neutral-500">{head[j + 1]}</span>
                <span className="text-neutral-400"><Text>{cell}</Text></span>
              </dd>
            ))}
          </dl>
        ))}
      </div>
    </>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="pt-10">
      <PageHeading titleKey="footer.privacy" compact />
      <div className="container-x max-w-4xl pb-10">
        <p className="text-sm text-neutral-500">
          Obowiązuje od: <Text>{POLICY_EFFECTIVE_DATE}</Text>
        </p>
        <BindingNote />

        <nav aria-label="Spis treści" className="mt-8 rounded-2xl border border-white/10 bg-ink-800/30 p-5">
          <ol className="grid gap-1.5 text-sm sm:grid-cols-2">
            {POLICY.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-neutral-300 hover:text-ember">{s.title}</a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-10 space-y-12">
          {POLICY.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-28">
              <h2 className="mb-4 text-xl font-medium text-neutral-50">{s.title}</h2>
              <div className="space-y-4">
                {s.blocks.map((b, i) => <Block key={i} block={b} />)}
                {s.id === "cookies" && <CookieSettingsButton />}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
