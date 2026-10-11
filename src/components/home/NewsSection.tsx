"use client";
import { useLang } from "@/components/LangProvider";
import { useReservation } from "@/components/booking/ReservationModal";
import type { SharedContent } from "@/lib/mobile-contract";

export function NewsSection({ content }: { content: SharedContent }) {
  const { lang, tr, t } = useLang();
  const { open } = useReservation();
  const events = content.events.filter(e => e.active && new Date(e.date).getTime() > Date.now() - 86400000);
  const offers = content.promotions.filter(p => p.active);
  const discounts = content.discounts.filter(d => d.active);
  if (!events.length && !offers.length && !discounts.length) return null;
  return <section className="container-x py-12 sm:py-20">
    <h2 className="wordmark accent-underline text-2xl text-neutral-50">{tr({pl:"W rytmie BALANCE",ru:"В ритме BALANCE",en:"Inside BALANCE",de:"Bei BALANCE"})}</h2>
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {events.map(e => <article className="glass overflow-hidden rounded-3xl" key={e.id}>
        <img src={e.image || "/gallery/g30.JPG"} alt="" className="h-52 w-full object-cover"/>
        <div className="space-y-4 p-6"><p className="text-xs text-ember">{new Intl.DateTimeFormat(lang === 'ua' ? 'uk' : lang,{dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Warsaw"}).format(new Date(e.date))}</p><h3 className="text-xl font-medium">{tr(e.title)}</h3><p className="text-sm leading-relaxed text-neutral-300">{tr(e.detail)}</p><button className="btn-primary" onClick={open}>{t("cta.reserve")}</button></div>
      </article>)}
      {offers.map(p => <article className="glass overflow-hidden rounded-3xl" key={p.id}>
        <img src={p.image || "/head.jpg"} alt="" className="h-52 w-full object-cover"/>
        <div className="space-y-4 p-6"><h3 className="text-xl font-medium">{tr(p.title)}</h3><p className="text-sm leading-relaxed text-neutral-300">{tr(p.detail)}</p><button className="btn-ghost" onClick={open}>{t("cta.reserve")}</button></div>
      </article>)}
      {discounts.map(d => <article className="glass flex flex-col justify-center gap-4 rounded-3xl border border-ember/20 p-7" key={d.id}><p className="text-4xl font-medium text-ember">{d.percent}%</p><h3 className="text-xl font-medium">{tr(d.name)}</h3><p className="text-sm text-neutral-300">{d.birthdayOnly ? tr({pl:"Oferta w dniu urodzin. Zapytaj obsługę o warunki.",ru:"Предложение в день рождения. Условия уточните у команды.",en:"Birthday offer. Ask our team for the terms.",de:"Geburtstagsangebot. Bedingungen beim Team erfragen."}) : tr({pl:"Zapytaj obsługę o warunki.",ru:"Условия уточните у команды.",en:"Ask our team for the terms.",de:"Bedingungen beim Team erfragen."})}</p></article>)}
    </div>
  </section>;
}
