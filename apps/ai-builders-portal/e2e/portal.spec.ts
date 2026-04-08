import { test, expect } from "@playwright/test";

// ─── Flow 1: Landing page discovery ─────────────────────────────────────────

test.describe("Landing page discovery", () => {
  test("renders hero headline, showcase items, phases, featured challenge, and CTA", async ({
    page,
  }) => {
    await page.goto("/ai-builders/");

    // Hero headline
    await expect(
      page.getByRole("heading", { name: "Build real things with AI" }),
    ).toBeVisible();

    // 3 showcase items (gallery cards with preview areas)
    const showcaseItems = page.locator(
      'text="▶ artifact preview" >> xpath=ancestor::div[contains(@class,"rounded-lg")]',
    );
    // Alternatively, verify the 3 specific showcase titles on the landing page
    await expect(page.getByText("Loan document classifier")).toBeVisible();
    await expect(page.getByText("Rate lock dashboard")).toBeVisible();
    await expect(page.getByText("Compliance checker")).toBeVisible();

    // "Four levels of development" section
    await expect(
      page.getByRole("heading", { name: "Four levels of development" }),
    ).toBeVisible();
    await expect(page.getByText("Curiosity")).toBeVisible();
    await expect(page.getByText("Clarity")).toBeVisible();
    await expect(page.getByText("Capability")).toBeVisible();
    await expect(page.getByText("Consistency")).toBeVisible();

    // Featured challenge card
    await expect(
      page.getByText("Walk the terrain: Your first deployment"),
    ).toBeVisible();

    // Click "Start your journey" CTA and verify navigation to /onboarding
    await page.getByRole("link", { name: "Start your journey" }).click();
    await expect(page).toHaveURL(/\/onboarding$/);
  });
});

// ─── Flow 2: Onboarding flow ─────────────────────────────────────────────────

test.describe("Onboarding flow", () => {
  test("completes all three steps and navigates to profile with localStorage set", async ({
    page,
  }) => {
    await page.goto("/ai-builders/onboarding");

    // Step 1: "What's your current role?"
    await expect(
      page.getByRole("heading", { name: "What's your current role?" }),
    ).toBeVisible();
    await expect(page.getByText("Step 1 of 3")).toBeVisible();

    // Type an answer in the textarea
    await page
      .getByPlaceholder("Type your answer...")
      .fill("Senior Product Manager");

    // Click "Continue"
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 2: "Have you built anything with code before?"
    await expect(
      page.getByRole("heading", {
        name: "Have you built anything with code before?",
      }),
    ).toBeVisible();
    await expect(page.getByText("Step 2 of 3")).toBeVisible();

    // Click an option button
    await page
      .getByRole("button", { name: "I've done a tutorial or two" })
      .click();

    // Click "Continue"
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 3: problem question
    await expect(page.getByText("Step 3 of 3")).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: "What's a problem you see in your work that you wish you could solve?",
      }),
    ).toBeVisible();

    // Type an answer
    await page
      .getByPlaceholder("Type your answer...")
      .fill("Automating document review for loan applications");

    // Click "Complete profile"
    await page.getByRole("button", { name: "Complete profile" }).click();

    // Verify navigation to /profile
    await expect(page).toHaveURL(/\/profile$/);

    // Verify localStorage has the onboarding key
    const stored = await page.evaluate(() =>
      localStorage.getItem("aibuilders_onboarding"),
    );
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed["0"]).toBe("Senior Product Manager");
    expect(parsed["1"]).toBe("I've done a tutorial or two");
    expect(parsed["2"]).toBe(
      "Automating document review for loan applications",
    );
  });
});

// ─── Flow 3: Challenge browsing and detail ───────────────────────────────────

test.describe("Challenge browsing and detail", () => {
  test("displays 6 challenges, filters by phase, and navigates to detail", async ({
    page,
  }) => {
    await page.goto("/ai-builders/challenges");

    // Verify page heading
    await expect(
      page.getByRole("heading", { name: "Challenges" }),
    ).toBeVisible();

    // Verify 6 challenge cards are visible (each card has a title in an h3)
    const challengeCards = page.locator(
      'div[role="button"] h3, div:not([role="button"]) > div > .p-4 h3',
    );
    // More reliable: count the known challenge titles
    const challengeTitles = [
      "Walk the terrain: Your first deployment",
      "Design a data privacy layer",
      "Discovery: Find and shape your own problem",
      "Map the authentication landscape",
      "Build an AI evaluation harness",
      "Customize a design system",
    ];
    for (const title of challengeTitles) {
      await expect(page.getByText(title)).toBeVisible();
    }

    // Click the "Curiosity" filter pill — only Phase 1 challenges should show
    await page.getByRole("button", { name: "Curiosity", exact: true }).click();

    // Phase 1 challenges (should be visible)
    await expect(
      page.getByText("Walk the terrain: Your first deployment"),
    ).toBeVisible();
    await expect(
      page.getByText("Map the authentication landscape"),
    ).toBeVisible();

    // Phase 2 and 3 challenges (should not be visible)
    await expect(
      page.getByText("Design a data privacy layer"),
    ).not.toBeVisible();
    await expect(
      page.getByText("Discovery: Find and shape your own problem"),
    ).not.toBeVisible();

    // Click "All" to reset
    await page
      .getByRole("button", { name: "All" })
      .first()
      .click();
    // All 6 should be back
    for (const title of challengeTitles) {
      await expect(page.getByText(title)).toBeVisible();
    }

    // Click the first challenge card to navigate to detail
    await page
      .getByText("Walk the terrain: Your first deployment")
      .click();
    await expect(page).toHaveURL(/\/challenges\/deploy-first-app$/);

    // Verify "Back to challenges" link exists
    await expect(
      page.getByRole("link", { name: /Back to challenges/ }),
    ).toBeVisible();

    // Verify "Submit your work" section exists
    await expect(
      page.getByRole("heading", { name: "Submit your work" }),
    ).toBeVisible();
  });
});

// ─── Flow 4: Profile page ────────────────────────────────────────────────────

test.describe("Profile page", () => {
  test("displays user info, journey map, goal evolution, devlog history, and copy link", async ({
    page,
    context,
  }) => {
    await page.goto("/ai-builders/profile");

    // Verify "Jordan Rivera" name is visible
    await expect(page.getByRole("heading", { name: "Jordan Rivera" })).toBeVisible();

    // Verify the journey map section with "Your journey" heading
    await expect(
      page.getByRole("heading", { name: "Your journey" }),
    ).toBeVisible();

    // Verify goal evolution shows 4 goals
    await expect(
      page.getByRole("heading", { name: "Goal evolution" }),
    ).toBeVisible();
    await expect(
      page.getByText("Learn to build AI apps"),
    ).toBeVisible();
    await expect(
      page.getByText("Build a chatbot for my work"),
    ).toBeVisible();
    await expect(
      page.getByText(/Prototype a document triage tool/),
    ).toBeVisible();
    await expect(
      page.getByText(/Pitch the document triage prototype/),
    ).toBeVisible();

    // Verify devlog history shows entries
    await expect(
      page.getByRole("heading", { name: "Devlog history" }),
    ).toBeVisible();
    await expect(
      page.getByText("Document triage prototype — iteration 2"),
    ).toBeVisible();
    await expect(
      page.getByText("First deployment — Flask behind proxy"),
    ).toBeVisible();

    // Grant clipboard permissions for the copy test
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // Click "Copy portfolio link" and verify button text changes to "Copied!"
    await page
      .getByRole("button", { name: "Copy portfolio link" })
      .click();
    await expect(
      page.getByRole("button", { name: "Copied!" }),
    ).toBeVisible();
  });
});

// ─── Flow 5: Portfolio and showcase ──────────────────────────────────────────

test.describe("Portfolio and showcase", () => {
  test("renders portfolio page with user data and footer link", async ({
    page,
  }) => {
    await page.goto("/ai-builders/portfolio/jordan-rivera");

    // Verify "Jordan Rivera" name in the banner
    await expect(
      page.getByRole("heading", { name: "Jordan Rivera" }),
    ).toBeVisible();

    // Verify "Completed work" section exists
    await expect(
      page.getByRole("heading", { name: "Completed work" }),
    ).toBeVisible();

    // Verify "Built with AI Builders Portal" footer link exists
    await expect(
      page.getByRole("link", { name: "AI Builders Portal" }),
    ).toBeVisible();
  });

  test("renders showcase page with items and tag filtering", async ({
    page,
  }) => {
    await page.goto("/ai-builders/showcase");

    // Verify page heading
    await expect(
      page.getByRole("heading", { name: "What people are building" }),
    ).toBeVisible();

    // Verify 8 showcase items visible (check all titles from the data)
    const showcaseTitles = [
      "Loan document classifier",
      "Rate lock dashboard",
      "Compliance checker",
      "Onboarding wizard",
      "Support ticket triage",
      "Internal doc search",
      "Project budget tracker",
      "AI meeting summarizer",
    ];
    for (const title of showcaseTitles) {
      await expect(page.getByText(title)).toBeVisible();
    }

    // Click a tag filter pill (e.g., "AI") and verify items filter
    await page.getByRole("button", { name: "AI", exact: true }).click();

    // AI-tagged items should be visible
    await expect(page.getByText("Loan document classifier")).toBeVisible();
    await expect(page.getByText("Support ticket triage")).toBeVisible();
    await expect(page.getByText("AI meeting summarizer")).toBeVisible();

    // Non-AI items should not be visible
    await expect(page.getByText("Onboarding wizard")).not.toBeVisible();
    await expect(page.getByText("Internal doc search")).not.toBeVisible();
    await expect(page.getByText("Project budget tracker")).not.toBeVisible();

    // Click "All" to verify all items return
    await page.getByRole("button", { name: "All" }).click();
    for (const title of showcaseTitles) {
      await expect(page.getByText(title)).toBeVisible();
    }
  });
});
