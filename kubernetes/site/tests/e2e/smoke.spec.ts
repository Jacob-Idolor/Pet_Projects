import { test, expect } from "@playwright/test";

const keyRoutes = [
  { path: "/", title: /Lab Hub|K8s Practice/i },
  { path: "/learn.html", title: /Learn/i },
  { path: "/docker.html", title: /Docker/i },
  { path: "/practice.html", title: /Practice|kubectl/i },
  { path: "/progress.html", title: /Progress|Tracker/i },
  { path: "/certificate.html", title: /Certificate/i },
  { path: "/modules/c1-containers.html", title: /container/i },
  { path: "/modules/k4-deployments.html", title: /Deployment/i },
  { path: "/practice-crash.html", title: /Crash|Practice/i },
  { path: "/404.html", title: /404|not found/i },
];

test.describe("smoke — key pages load", () => {
  for (const route of keyRoutes) {
    test(`${route.path} returns 200`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("body")).toBeVisible();
    });
  }
});

test("lesson page has visual, steps, terminal, and quiz", async ({ page }) => {
  await page.goto("/modules/c1-containers.html");
  await expect(page.locator("[data-lesson-visual], .lesson-visual-wrap")).toBeVisible();
  await expect(page.locator(".lesson-step").first()).toBeVisible();
  await expect(page.locator(".terminal, [class*='terminal']").first()).toBeVisible();
  await expect(page.locator("[data-quiz]")).toBeVisible();
});

test("quiz accepts correct answer on containers lesson", async ({ page }) => {
  await page.goto("/modules/c1-containers.html");
  const quiz = page.locator("[data-quiz]");
  await quiz.locator('input[type="radio"]').nth(1).check();
  await quiz.locator("[data-check]").click();
  await expect(quiz.locator(".quiz-score.pass")).toBeVisible({ timeout: 5000 });
});

test("docker simulator responds to docker ps", async ({ page }) => {
  await page.goto("/modules/c4-docker-cli.html");
  const input = page.locator("[data-form] input");
  await input.fill("docker ps");
  await input.press("Enter");
  await expect(page.locator("[data-output]")).toContainText(/web|CONTAINER/i, {
    timeout: 8000,
  });
});

test("learn page shows curriculum journey", async ({ page }) => {
  await page.goto("/learn.html");
  await expect(page.locator("[data-curriculum-map], .curriculum-map")).toBeVisible();
  await expect(page.locator(".lesson-item, .journey-dot").first()).toBeVisible();
});
