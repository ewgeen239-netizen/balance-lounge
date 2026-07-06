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
    items: c.items.map((i) => ({
      id: i.id,
      name: i.name,
      description: i.description,
      price: i.price,
      photo: i.photo,
      available: i.available,
      badges: i.badges,
    })),
  }));

  return (
    <div className="pt-10">
      <PageHeading titleKey="menu.title" />
      <MenuBrowser categories={dto} />
    </div>
  );
}
