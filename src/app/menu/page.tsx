import { getMenu } from "@/lib/data";
import { MenuBrowser, type CategoryDTO } from "@/components/menu/MenuBrowser";
import { PageHeading } from "@/components/PageHeading";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const categories = await getMenu();
  const dto: CategoryDTO[] = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    scheduled: c.scheduled,
    items: c.items.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      price: i.price,
      photo: i.photo,
      available: i.available,
      badges: i.badges,
      options: i.options,
    })),
  }));

  return (
    <div className="pt-10">
      {/* Fixed service-fee notice — pinned above everything on the menu page. */}
      <div className="container-x mb-8">
        <div className="flex items-start gap-3 rounded-2xl border border-ember/25 bg-gradient-to-r from-ember/10 to-transparent px-4 py-3.5 sm:px-5">
          <svg className="mt-0.5 shrink-0 text-ember" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" />
          </svg>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ember">
              Informacja · Opłata serwisowa
            </div>
            <p className="mt-0.5 text-sm text-neutral-300">
              Do rachunków dla grup od 6 osób doliczamy opłatę serwisową w wysokości 5%.
            </p>
          </div>
        </div>
      </div>

      <PageHeading titleKey="menu.title" />
      <MenuBrowser categories={dto} />
    </div>
  );
}
