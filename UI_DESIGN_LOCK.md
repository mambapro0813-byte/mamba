# AI TRADE UI Design Lock

Approved baseline: 2026-09-13

## Permanent desktop UI baseline
The approved desktop experience is the `primary_dashboard_v2.js` shell plus `primary_dashboard_cleanup.js` and `unified_page_shell.js`.

Rules for future work:
1. Keep the current light blue / white SaaS visual system, left navigation, top search/status bar, KPI row, rounded cards, spacing and typography hierarchy.
2. New features must open inside the existing primary shell whenever possible. Do not replace the main shell with legacy `.app` navigation.
3. Legacy Product Brain / Customer Brain / CRM / Quotes / Orders / Follow-up pages remain functional/data engines and are rendered inside the unified workspace.
4. Do not reintroduce right-side floating tool buttons. Existing underlying functions remain callable from classified dashboard entries.
5. Mobile and desktop may have different responsive layouts, but desktop visual identity must remain consistent with this locked baseline.
6. UI changes should be incremental refinements only unless the product owner explicitly requests a redesign.

Stable backup branch: `stable-ui-20260913`.
