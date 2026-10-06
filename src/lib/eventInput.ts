// Validates event fields coming from the admin panel. With `full` every
// required field must be present (create); otherwise only the given ones are
// checked (partial update, e.g. the on/off switch).

type Result = { data: Record<string, unknown> } | { error: string };

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);

export function parseEventInput(body: Record<string, unknown>, full: boolean): Result {
  const data: Record<string, unknown> = {};

  const title = text(body.title, 140);
  if (title !== undefined) {
    if (title.length < 2) return { error: "title_required" };
    data.title = title;
  } else if (full) return { error: "title_required" };

  const summary = text(body.summary, 300);
  if (summary !== undefined) data.summary = summary;
  const description = text(body.description, 5000);
  if (description !== undefined) data.description = description;
  const image = text(body.image, 2048);
  if (image !== undefined) data.image = image;
  if (typeof body.enabled === "boolean") data.enabled = body.enabled;

  for (const key of ["startsAt", "endsAt"] as const) {
    if (body[key] === undefined) {
      if (full) return { error: `${key}_required` };
      continue;
    }
    const d = new Date(String(body[key]));
    if (Number.isNaN(+d)) return { error: `${key}_invalid` };
    data[key] = d;
  }
  if (data.startsAt && data.endsAt && (data.endsAt as Date) <= (data.startsAt as Date)) {
    return { error: "end_before_start" };
  }
  return { data };
}
