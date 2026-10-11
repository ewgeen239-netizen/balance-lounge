import test from "node:test";
import assert from "node:assert/strict";
import { contentSchema, emptyContent, hoursSchema, imageReference, menuGroup, mobileItemSchema, venueSchema, clock, toMinutes } from "../src/lib/mobile-contract";

test("maps the website groups without dropping menu items", () => {
  assert.equal(menuGroup("shisha"), "shisha"); assert.equal(menuGroup("cozy-season"), "cozy");
  assert.equal(menuGroup("signature-cocktails"), "bar"); assert.equal(menuGroup("whisky-bourbon"), "alcohol");
  assert.equal(menuGroup("kawa"), "tea"); assert.equal(menuGroup("napoje-zimne"), "cold"); assert.equal(menuGroup("desery-premium"), "desserts");
});
test("accepts decimal prices and rejects non-finite/negative prices", () => {
  const item = { id: "site-1", remoteID: 1, name: "Rose Balance", descriptionKey: "Rose", category: "bar", price: 42.5, image: "/menu/rose.jpg", badgeKey: "", available: true };
  assert.equal(mobileItemSchema.parse(item).price, 42.5);
  assert.equal(mobileItemSchema.safeParse({ ...item, price: -1 }).success, false);
  assert.equal(mobileItemSchema.safeParse({ ...item, price: Infinity }).success, false);
});
test("blocks executable, local-device and protocol-relative photo references", () => {
  for (const image of ["javascript:alert(1)", "file:///etc/passwd", "local:secret.jpg", "//other.test/secret", "http://insecure.test/photo.jpg"]) assert.equal(imageReference.safeParse(image).success, false);
  assert.equal(imageReference.safeParse("https://www.balancecocktails.pl/api/uploads/photo").success, true);
  assert.equal(imageReference.safeParse("/gallery/g30.JPG").success, true);
});
test("validates midnight closing and one entry for each weekday", () => {
  const hours = Array.from({ length: 7 }, (_, i) => ({ weekday: i+1, opens: 960, closes: 1500, enabled: true }));
  assert.equal(hoursSchema.safeParse(hours).success, true);
  assert.equal(hoursSchema.safeParse(hours.map(h => ({ ...h, weekday: 1 }))).success, false);
  assert.equal(hoursSchema.safeParse(hours.map(h => ({ ...h, closes: 900 }))).success, false);
  assert.equal(clock(1500), "01:00"); assert.equal(toMinutes("16:30"), 990);
});
test("rejects invalid event dates and excessive discounts", () => {
  assert.deepEqual(contentSchema.parse(emptyContent), emptyContent);
  const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  assert.equal(contentSchema.safeParse({ ...emptyContent, discounts: [{ id, name: "Birthday", percent: 101, birthdayOnly: true, active: true }] }).success, false);
  assert.equal(contentSchema.safeParse({ ...emptyContent, events: [{ id, title: "DJ Night", detail: "Music", date: "not a date", active: true }] }).success, false);
});
test("venue settings reject unsafe social URLs", () => {
  const venue = { name: "BALANCE", address: "Szczecin", phone: "+48729559179", email: "", instagram: "javascript:alert(1)", heroImage: "/head.jpg", heroTitle: "Welcome", heroSubtitle: "Lounge", hours: Array.from({ length: 7 },(_,i)=>({ weekday:i+1,opens:960,closes:1500,enabled:true })) };
  assert.equal(venueSchema.safeParse(venue).success, false);
  assert.equal(venueSchema.safeParse({ ...venue, instagram: "https://instagram.com/balance.lounge.bar/" }).success, true);
});
