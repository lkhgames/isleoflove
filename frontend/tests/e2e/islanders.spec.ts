import { test, expect } from "@playwright/test";

test("shows the page title", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Isle of Love" })).toBeVisible();
});

test("renders islanders returned by the API", async ({ page }) => {
  await page.route("**/islanders", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { id: "1", name: "Priya", bio: "Loves late-night bonfire chats" },
        { id: "2", name: "Jordan", bio: "Here for the right reasons" },
      ]),
    }),
  );

  await page.goto("/");

  const list = page.getByRole("list", { name: "islanders" });
  await expect(list.getByText("Priya", { exact: false })).toBeVisible();
  await expect(list.getByText("Jordan", { exact: false })).toBeVisible();
});

test("shows an error state when the API is unreachable", async ({ page }) => {
  await page.route("**/islanders", (route) => route.abort());

  await page.goto("/");

  await expect(page.getByRole("alert")).toBeVisible();
});
