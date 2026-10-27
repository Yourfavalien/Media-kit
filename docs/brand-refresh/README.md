# Chrome logo refresh review

Uses the full-name primary chrome wordmark in the public HQ header and secure-entry branding. Compact preview, partner-sidebar and owner-control marks use the matching YFA monogram. Favicons, touch icons, notification icon and logo-editor default are updated. The Cloudflare asset allowlist/build script includes every new runtime image.

The existing live content API returned a saved cartoon-UFO data URI. Its exact SHA-256 fingerprint is recognized and omitted from the in-memory content override, preserving the new default artwork without editing stored settings. Other owner uploads continue through the existing editor. This was verified with the real public-content response and a separate future-upload fixture.

[Desktop comparison](hq-desktop-comparison.png) · [Mobile comparison](hq-mobile-comparison.png) · [Secure entry desktop](login-desktop-comparison.png) · [Secure entry mobile](login-mobile-comparison.png) · [Favicon rendering](favicon-rendering.png)

[Owner controls before](before-controls-mobile.png) · [Owner controls after](after-controls-mobile.png)

The original PNG files are retained byte-for-byte. Clean derivatives keep the same RGB artwork and native dimensions; only opacity is lifted (alpha exponent 0.6) and the monogram's detached board-label pixels in rows 0–9 are made transparent. The artwork begins at row 32, so no YFA strokes are removed. No generative model or new artwork was used.

Favicons derive from the supplied four-point star with alpha exponent 0.4. The monogram was unreadable at 16px. PNG favicons are 512×512; ICO includes 16, 32, 48, 64, 128 and 256px; Apple touch icons are 180×180. Images retain transparent backgrounds and proportional scaling. Enlarging icon exports does not create additional source detail. Silver chrome naturally has less contrast on white; Support logos have a subtle shadow limited to the image.

Validation used local Chromium at 1440px desktop and 390px mobile widths. Full-page captures and header comparisons were inspected. All nine Support pages passed logo-load and horizontal-overflow checks at both widths; mobile navigation and Escape closing worked. Public HQ and login layouts, popup, welcome template and owner-control shell were checked. Protected partner/admin server sessions were not authenticated; their shared static logo placements were inspected without changing access controls.

Existing videos, background artwork, photos, page copy, navigation, settings storage and authentication remain unchanged. Text-only headings/wordmarks and the welcome email's decorative UFO emoji are retained. Branding baked into videos, hero/banner artwork, social-preview artwork and the BIMI identity is not replaced because those are separate artwork/email-identity changes. Unreferenced legacy logo files are retained for compatibility.

Screenshots show local repository pages, not deployed versions. The icon sheet shows browser-rendered images at favicon sizes on light and dark surfaces, rather than a browser tab-bar capture.

[Complete changed-file list](changed-files.txt)
