"""Minimal live ops summary tests."""
from server import flatten_event_batches, summarize_live_ops_events


def test_live_ops_summary_counts_funnel_and_revenue():
    docs = [
        {"device_id": "device-a", "received_at": "2026-01-01T12:00:00+00:00", "events": [
            {"name": "app_open", "props": {"installSource": "tiktok"}, "ts": "2026-01-01T12:00:00+00:00"},
            {"name": "onboarding_start", "ts": "2026-01-01T12:01:00+00:00"},
            {"name": "card_generated", "ts": "2026-01-01T12:02:00+00:00"},
            {"name": "paywall_shown", "ts": "2026-01-01T12:03:00+00:00"},
            {"name": "purchase_completed", "props": {"productId": "plump.monthly", "plan": "monthly"}, "ts": "2026-01-01T12:04:00+00:00"},
        ]},
        {"device_id": "device-b", "received_at": "2026-01-01T13:00:00+00:00", "events": [
            {"name": "app_open", "props": {"installSource": "unknown"}, "ts": "2026-01-01T13:00:00+00:00"},
            {"name": "onboarding_start", "ts": "2026-01-01T13:01:00+00:00"},
            {"name": "card_generated", "ts": "2026-01-01T13:02:00+00:00"},
            {"name": "paywall_shown", "ts": "2026-01-01T13:03:00+00:00"},
        ]},
    ]
    summary = summarize_live_ops_events(flatten_event_batches(docs))
    assert summary["funnel"]["installs"] == 2
    assert summary["funnel"]["onboardingStarted"] == 2
    assert summary["funnel"]["onboardingCompleted"] == 2
    assert summary["funnel"]["paywallSeen"] == 2
    assert summary["funnel"]["converted"] == 1
    assert summary["funnel"]["onboardingCompletedNotConverted"] == 1
    assert summary["conversionsByPlan"]["monthly"] == 1
    assert summary["installSources"]["tiktok"] == 1
    assert summary["recentConversions"][0]["productId"] == "plump.monthly"
