"""
E2E Test: Workshop Flow

Tests all workshop routes return 200 and contain expected content.
"""


class TestWorkshopRoutes:
    """Test suite for workshop page routes"""

    def test_workshop_landing_loads(self, client):
        """GET /workshop should return workshop landing page"""
        response = client.get("/workshop")
        assert response.status_code == 200
        assert b"Workshop" in response.data

    def test_workshop_stage_1_loads(self, client):
        """GET /workshop/1 should return stage 1"""
        response = client.get("/workshop/1")
        assert response.status_code == 200
        assert b"Foundation" in response.data

    def test_workshop_stage_2_loads(self, client):
        """GET /workshop/2 should return stage 2"""
        response = client.get("/workshop/2")
        assert response.status_code == 200
        assert b"Acceptance" in response.data

    def test_workshop_stage_3_loads(self, client):
        """GET /workshop/3 should return stage 3"""
        response = client.get("/workshop/3")
        assert response.status_code == 200
        assert b"Validation" in response.data or b"Validating" in response.data

    def test_workshop_stage_4_loads(self, client):
        """GET /workshop/4 should return stage 4"""
        response = client.get("/workshop/4")
        assert response.status_code == 200
        assert b"Improvement" in response.data or b"Improve" in response.data

    def test_workshop_stage_5_loads(self, client):
        """GET /workshop/5 should return stage 5"""
        response = client.get("/workshop/5")
        assert response.status_code == 200
        assert b"Reporting" in response.data or b"Production" in response.data


class TestWorkshopContent:
    """Test suite for workshop content presence"""

    def test_workshop_landing_has_stage_cards(self, client):
        """Workshop landing should have stage overview cards"""
        response = client.get("/workshop")
        assert response.status_code == 200
        assert b"phase-card" in response.data

    def test_workshop_landing_has_stage_links(self, client):
        """Workshop landing should link to all 5 stages"""
        response = client.get("/workshop")
        assert response.status_code == 200
        for stage in range(1, 6):
            assert f"/workshop/{stage}".encode() in response.data

    def test_workshop_stage1_mentions_rag(self, client):
        """Stage 1 should mention RAG pipeline concepts"""
        response = client.get("/workshop/1")
        assert response.status_code == 200
        data = response.data.lower()
        assert b"rag" in data or b"retrieval" in data

    def test_workshop_stage3_mentions_kappa(self, client):
        """Stage 3 should mention inter-rater reliability"""
        response = client.get("/workshop/3")
        assert response.status_code == 200
        data = response.data.lower()
        assert b"kappa" in data or b"inter-rater" in data

    def test_workshop_stage5_mentions_tsr(self, client):
        """Stage 5 should mention Test Summary Report"""
        response = client.get("/workshop/5")
        assert response.status_code == 200
        data = response.data
        assert b"TSR" in data or b"Test Summary Report" in data


class TestWorkshopNavigation:
    """Test suite for workshop navigation elements"""

    def test_workshop_pages_have_phase_nav(self, client):
        """All workshop pages should have phase navigation"""
        routes = [
            "/workshop",
            "/workshop/1",
            "/workshop/2",
            "/workshop/3",
            "/workshop/4",
            "/workshop/5",
        ]
        for route in routes:
            response = client.get(route)
            assert response.status_code == 200
            assert (
                b"phase-nav" in response.data
            ), f"Route {route} missing phase navigation"

    def test_workshop_stages_have_bottom_nav(self, client):
        """Workshop stages 1-4 should have next navigation"""
        for stage in range(1, 5):
            response = client.get(f"/workshop/{stage}")
            assert response.status_code == 200
            assert b"phase-nav-btn" in response.data

    def test_workshop_stage_headers_say_stage(self, client):
        """Workshop stages should say 'Stage N' not 'Phase N'"""
        for stage in range(1, 6):
            response = client.get(f"/workshop/{stage}")
            assert response.status_code == 200
            assert f"Stage {stage}".encode() in response.data


class TestLandingDualCTA:
    """Test suite for landing page dual CTA"""

    def test_landing_has_workshop_link(self, client):
        """Landing page should have link to workshop"""
        response = client.get("/")
        assert response.status_code == 200
        assert b"/workshop" in response.data

    def test_landing_has_sdlc_journey_link(self, client):
        """Landing page should still have SDLC journey link"""
        response = client.get("/")
        assert response.status_code == 200
        assert b"SDLC Journey" in response.data

    def test_landing_has_dual_cta_group(self, client):
        """Landing page should have dual CTA group"""
        response = client.get("/")
        assert response.status_code == 200
        assert b"landing-cta-group" in response.data
