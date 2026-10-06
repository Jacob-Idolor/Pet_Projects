import { expect, test } from "@playwright/test";

test("newsletter submits directly to Buttondown without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false });
  const page = await context.newPage();
  let submitted = "";
  await context.route("https://buttondown.com/**", async route => {
    expect(route.request().url()).toBe("https://buttondown.com/api/emails/embed-subscribe/stockwatch");
    expect(route.request().method()).toBe("POST");
    submitted = route.request().postData() || "";
    await route.fulfill({ contentType: "text/html", body: "<h1>Intercepted test submission</h1>" });
  });
  await page.goto("/research-kit.html");
  await page.getByLabel("Email address").fill("newsletter-test@example.com");
  await page.getByRole("button", { name: "Subscribe to NBIS Close" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Intercepted test submission" })).toBeVisible();
  const fields = new URLSearchParams(submitted);
  expect(fields.get("email")).toBe("newsletter-test@example.com");
  expect(fields.get("embed")).toBe("1");
  expect([...fields.keys()].sort()).toEqual(["email", "embed"]);
  await context.close();
});
