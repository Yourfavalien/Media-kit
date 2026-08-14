# Secure data connection — minimal future requirements

## Recommended shape

GitHub Pages remains the public front end. A separate server-side function or tiny API stores the social credentials, requests approved TikTok and Instagram metrics on a schedule, normalizes them, and returns only the public numbers needed by the media kit.

Flow: TikTok/Instagram APIs → scheduled secure function → small cache/database → public read-only JSON endpoint → this page.

## What the secure service needs

1. **Official platform access**
   - TikTok developer app and the API product/permissions that cover the creator account and requested metrics.
   - Meta developer app, an Instagram Professional account connected as required by Meta, and the Instagram Graph API permissions needed for account insights.
   - Platform approval/review may be required. Available metrics and history depend on account type, permissions, and each platform’s current API rules.

2. **Server-side token storage**
   - Tokens and app secrets stored only as encrypted environment secrets in the backend host.
   - Never place them in GitHub Pages HTML, JavaScript, repository files, or the public JSON response.
   - Implement the platform-required refresh/reauthorization process and alert when authorization expires.

3. **Scheduled collection and caching**
   - Refresh on a reasonable schedule such as every 6–24 hours; live-per-visitor API calls are unnecessary and can hit rate limits.
   - Store the last successful snapshot so the page can still show labeled stale data during platform outages.
   - Record `updatedAt`, metric period/definitions, and collection status.

4. **A narrow public endpoint**
   - HTTPS, read-only, CORS restricted to `https://yourfavalien.site` (and an explicit review origin while testing).
   - Return only approved aggregate metrics—no tokens, email addresses, internal IDs, or raw audience records.
   - Add rate limiting, schema validation, short cache headers, basic monitoring, and a controlled error response.

## Response contract used by this draft

```json
{
  "updatedAt": "2026-08-13T15:30:00Z",
  "source": "live",
  "platforms": {
    "tiktok": {
      "followers": 152,
      "engagementRate": 12.3,
      "impressions": 607,
      "averageViews": 304,
      "note": "25% follower engagement · 75 total engagements"
    },
    "instagram": {
      "followers": 37,
      "engagementRate": 8.9,
      "impressions": 213,
      "reach30d": 72,
      "note": "51.35% follower engagement · 34.5 avg. story views"
    }
  }
}
```

`source` should be `live`, `cached`, or `demo`. The page treats data older than 48 hours as stale and keeps the previous successful numbers visible if a manual refresh fails.

## Later access gate compatibility

The detailed analytics are wrapped in `#analyticsExperience` and `[data-analytics-content]`. A later gate can blur that region, add an unlock dialog/form, and reveal it after approval without changing the analytics loader. Gate authorization itself should be server-validated if it protects genuinely private information; a client-only blur is visual friction, not security.

