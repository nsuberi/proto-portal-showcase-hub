"""Browser E2E tests for the Workshop flow using Playwright.

Tests workshop landing, stage navigation, and content presence.
Requires Docker Compose to be running: docker compose up -d
"""

import re

import pytest
from playwright.sync_api import Page, expect


class TestWorkshopPageLoads:
    """Test that all workshop pages load correctly."""

    def test_workshop_landing_loads(self, page: Page, base_url: str):
        """Workshop landing should load with stage cards."""
        page.goto(f"{base_url}/workshop")
        page.wait_for_load_state("networkidle")

        expect(page.locator("text=Workshop")).to_be_visible()
        expect(page.locator(".phase-card").first).to_be_visible()

    @pytest.mark.parametrize("stage", [1, 2, 3, 4, 5])
    def test_workshop_stage_loads(self, page: Page, base_url: str, stage: int):
        """Each workshop stage should load with content."""
        page.goto(f"{base_url}/workshop/{stage}")
        page.wait_for_load_state("networkidle")

        expect(page.locator("body")).to_be_visible()
        content = page.content()
        assert len(content) > 500, f"Stage {stage} appears empty"


class TestWorkshopNavigation:
    """Test navigation within the workshop flow."""

    def test_workshop_landing_has_start_cta(self, page: Page, base_url: str):
        """Workshop landing should have Start the Workshop CTA."""
        page.goto(f"{base_url}/workshop")
        page.wait_for_load_state("networkidle")

        cta = page.locator("a").filter(
            has_text=re.compile(r"start|foundation|workshop", re.I)
        )
        expect(cta.first).to_be_visible(timeout=10000)

    def test_forward_navigation(self, page: Page, base_url: str):
        """User can navigate forward through all 5 stages."""
        page.goto(f"{base_url}/workshop/1")
        page.wait_for_load_state("networkidle")

        for stage in range(2, 6):
            next_btn = page.locator("a.phase-nav-btn--next")
            expect(next_btn).to_be_visible(timeout=10000)
            next_btn.click()
            page.wait_for_load_state("networkidle")
            assert f"/workshop/{stage}" in page.url

    def test_backward_navigation(self, page: Page, base_url: str):
        """User can navigate backward from stage 5."""
        page.goto(f"{base_url}/workshop/5")
        page.wait_for_load_state("networkidle")

        prev_btn = page.locator("a.phase-nav-btn--prev")
        expect(prev_btn).to_be_visible(timeout=10000)
        prev_btn.click()
        page.wait_for_load_state("networkidle")
        assert "/workshop/4" in page.url


class TestWorkshopStageContent:
    """Test that stages contain expected domain content."""

    def test_stage1_mentions_rag(self, page: Page, base_url: str):
        """Stage 1 should mention RAG or retrieval."""
        page.goto(f"{base_url}/workshop/1")
        page.wait_for_load_state("networkidle")

        content = page.content().lower()
        assert "rag" in content or "retrieval" in content

    def test_stage3_mentions_kappa(self, page: Page, base_url: str):
        """Stage 3 should mention kappa or inter-rater."""
        page.goto(f"{base_url}/workshop/3")
        page.wait_for_load_state("networkidle")

        content = page.content().lower()
        assert "kappa" in content or "inter-rater" in content

    def test_stage5_mentions_tsr(self, page: Page, base_url: str):
        """Stage 5 should mention Test Summary Report."""
        page.goto(f"{base_url}/workshop/5")
        page.wait_for_load_state("networkidle")

        content = page.content()
        assert "TSR" in content or "Test Summary Report" in content


class TestLandingToWorkshop:
    """Test entry from main landing to workshop."""

    def test_landing_has_workshop_link(self, page: Page, base_url: str):
        """Main landing page should have workshop entry link."""
        page.goto(f"{base_url}/")
        page.wait_for_load_state("networkidle")

        workshop_link = page.locator("a").filter(has_text=re.compile(r"workshop", re.I))
        expect(workshop_link.first).to_be_visible(timeout=10000)

    def test_clicking_workshop_link(self, page: Page, base_url: str):
        """Clicking workshop link from landing navigates to /workshop."""
        page.goto(f"{base_url}/")
        page.wait_for_load_state("networkidle")

        workshop_link = page.locator("a").filter(
            has_text=re.compile(r"eval workshop", re.I)
        )
        expect(workshop_link.first).to_be_visible(timeout=10000)
        workshop_link.first.click()
        page.wait_for_load_state("networkidle")
        assert "/workshop" in page.url
