import { getBar, getMenu } from "@/lib/data";
import { parseJSON, type HoursRow } from "@/lib/utils";
import { MenuRulesModal } from "@/components/menu/MenuRulesModal";
import { MenuBrowser, type CategoryDTO } from "@/components/menu/MenuBrowser";
import { ServiceFeeNotice } from "@/components/menu/ServiceFeeNotice";
import { PageHeading } from "@/components/PageHeading";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const [categories, bar] = await Promise.all([getMenu(), getBar()]);
  const dto: CategoryDTO[] = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    closed: c.closed,
    items: c.items.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      price: i.price,
      photo: i.photo,
      available: i.available,
      alwaysOpen: i.alwaysOpen,
      badges: i.badges,
      options: i.options,
    })),
  }));

  return (
    <div className="pt-10">
      {/* Fixed service-fee notice — pinned above everything, auto-translated. */}
      <ServiceFeeNotice />

      <PageHeading titleKey="menu.title" />
      <MenuBrowser categories={dto} />
      {/* Ordering rules + today's hours, every time the menu opens. */}
      <MenuRulesModal hours={parseJSON<HoursRow[]>(bar?.hours, [])} />
    </div>
  );
}
