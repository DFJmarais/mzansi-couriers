from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.section import WD_SECTION
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.style import WD_STYLE_TYPE
from pathlib import Path

OUT = Path('/home/ubuntu/mzansi-couriers/reports/mzansi-couriers-launch-readiness-and-integration-report.docx')

def shade(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = tcPr.find(qn('w:shd'))
    if shd is None:
        shd = OxmlElement('w:shd')
        tcPr.append(shd)
    shd.set(qn('w:fill'), fill)

def set_cell_text(cell, text, bold=False, color=None, size=9):
    cell.text = ''
    p = cell.paragraphs[0]
    r = p.add_run(str(text))
    r.bold = bold
    r.font.size = Pt(size)
    if color:
        r.font.color.rgb = RGBColor.from_string(color)
    cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER

def table(doc, headers, rows, widths=None):
    t = doc.add_table(rows=1, cols=len(headers))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.style = 'Table Grid'
    for i, h in enumerate(headers):
        set_cell_text(t.rows[0].cells[i], h, bold=True, color='FFFFFF', size=8.5)
        shade(t.rows[0].cells[i], '0B5D4B')
    for row in rows:
        cells = t.add_row().cells
        for i, value in enumerate(row):
            set_cell_text(cells[i], value, size=8.5)
            if len(t.rows) % 2 == 0:
                shade(cells[i], 'F1F7F5')
    if widths:
        for row in t.rows:
            for i, w in enumerate(widths):
                row.cells[i].width = Inches(w)
    doc.add_paragraph()
    return t

def bullet(doc, text, level=0):
    p = doc.add_paragraph(style='List Bullet' if level == 0 else 'List Bullet 2')
    p.add_run(text)
    return p

def numbered(doc, text):
    p = doc.add_paragraph(style='List Number')
    p.add_run(text)
    return p

def status(doc, label, text, color):
    p = doc.add_paragraph()
    r = p.add_run(label + ': ')
    r.bold = True
    r.font.color.rgb = RGBColor.from_string(color)
    p.add_run(text)
    return p

# Document setup
doc = Document()
sec = doc.sections[0]
sec.top_margin = Inches(0.65)
sec.bottom_margin = Inches(0.65)
sec.left_margin = Inches(0.72)
sec.right_margin = Inches(0.72)

styles = doc.styles
styles['Normal'].font.name = 'Aptos'
styles['Normal']._element.rPr.rFonts.set(qn('w:eastAsia'), 'Aptos')
styles['Normal'].font.size = Pt(9.5)
for name, size, color in [('Title', 25, '0B5D4B'), ('Heading 1', 17, '0B5D4B'), ('Heading 2', 12.5, '136F63'), ('Heading 3', 10.5, '0B5D4B')]:
    styles[name].font.name = 'Aptos Display'
    styles[name]._element.rPr.rFonts.set(qn('w:eastAsia'), 'Aptos Display')
    styles[name].font.size = Pt(size)
    styles[name].font.color.rgb = RGBColor.from_string(color)

# Footer
footer = sec.footer.paragraphs[0]
footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
footer.add_run('Mzansi Couriers • Launch-readiness report • 4 October 2026').font.size = Pt(8)

# Cover
p = doc.add_paragraph()
p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run('MZANSI COURIERS')
r.bold = True; r.font.size = Pt(30); r.font.color.rgb = RGBColor.from_string('0B5D4B')
p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run('End-to-End Implementation, Integration and Launch-Readiness Report')
r.bold = True; r.font.size = Pt(19); r.font.color.rgb = RGBColor.from_string('183B35')
p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.add_run('Prepared for platform owner review\n4 October 2026').font.size = Pt(11)
doc.add_paragraph()
p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run('DECISION SUMMARY')
r.bold = True; r.font.size = Pt(12); r.font.color.rgb = RGBColor.from_string('C45B2C')
p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run('Core platform: substantially implemented and heavily tested.\nUnrestricted production launch: NOT YET RECOMMENDED.')
r.bold = True; r.font.size = Pt(14)
p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
p.add_run('The remaining blockers are primarily live operational verification and production configuration—not the absence of the core pricing, relay, ledger, refund, onboarding, or courier workflows.').font.size = Pt(10)
doc.add_page_break()

# Executive summary
doc.add_heading('1. Executive summary', level=1)
doc.add_paragraph('Mzansi Couriers is a React 19 / Vite / TypeScript application with an Express/tRPC backend, Drizzle ORM, MySQL database, Paystack payment integration, Maps-assisted route geometry, courier onboarding, relay planning, tracking, safety controls, immutable parcel finance records, and Capacitor Android/iOS scaffolding.')
doc.add_paragraph('The system has moved well beyond a simple web wrapper. It contains separate customer, courier, and administrator workspaces; courier-first public launch gating; native-capability adapters for camera, location, notifications, biometric checks, secure storage, and native route opening; and a shared-pool relay model that allocates one parcel’s 80% courier pool across multiple couriers.')
status(doc, 'Overall status', 'READY FOR CONTROLLED PILOT / CLOSED BETA; NOT READY FOR AN UNRESTRICTED COMMERCIAL LAUNCH.', 'C45B2C')
status(doc, 'Evidence strength', 'Strong for automated logic and sandbox workflows; incomplete for live Paystack production transactions, production webhook delivery, domain cutover, and real multi-wave corridor operations.', 'C45B2C')
status(doc, 'Android timing', 'Capacitor development can begin now in parallel, but store submission should wait until the critical launch gates in Section 8 are closed.', '0B5D4B')

table(doc, ['Area', 'Current assessment', 'Launch implication'], [
    ['Customer booking and pricing', 'Implemented; quote and checkout are server-validated.', 'Suitable for controlled customer pilot after live Paystack verification.'],
    ['Courier onboarding', 'Implemented with steps, document uploads, expiry dates, review states, notifications, and draft persistence.', 'Operational team still needs a defined approval SLA and real-document pilot.'],
    ['Relay economics', 'Implemented with shared 80% pool, route geometry, costs, capacity, backhaul, reserves, and dispatch decisions.', 'Good planning foundation; production wave execution records still need completion.'],
    ['Financial ledger and refunds', 'Implemented append-only ledger, idempotency keys, refund workflow, Paystack webhook handling, and audit metrics.', 'Must be verified against the published production webhook and real payout reconciliation.'],
    ['Tracking and custody', 'Tracking, QR/photo code workflow, GPS, proof photos, handovers, inspections, and privacy gates are present.', 'Need a controlled physical parcel test with two couriers and a sender/recipient.'],
    ['Capacitor wrapper', 'Android project and native plugin integrations exist; build output is configured for dist/public.', 'Ready for engineering build work, not yet ready for Play release sign-off.'],
])

# Scope and architecture
doc.add_heading('2. What is implemented and how it integrates', level=1)
doc.add_heading('2.1 Core architecture', level=2)
bullet(doc, 'Frontend: React 19, TypeScript, Vite, Tailwind 4, shadcn-style UI, tRPC client, responsive public pages, mobile-style customer/courier workspaces, and admin dashboard.')
bullet(doc, 'Backend: Express server, tRPC routers, Drizzle ORM, MySQL/TiDB-compatible schema, server-side secrets, storage references for uploaded documents/photos, and webhook routes.')
bullet(doc, 'Authentication: Manus OAuth/session flow for web; native auth callback support for Capacitor, native secure session storage, and role-aware routing to customer, courier, or admin dashboards.')
bullet(doc, 'External integrations: Paystack for customer checkout/refunds/transfers; Maps proxy for route geometry; Twilio/notification surfaces; native camera, geolocation, local/push notifications, biometric and route-opening adapters.')
bullet(doc, 'Production deployment: Manus-hosted site at `https://mzansicourier-nsebzqbt.manus.space`; custom domain `mzansicouriers.co.za` is not yet confirmed as connected.')

doc.add_heading('2.2 Customer flow', level=2)
numbered(doc, 'Customer enters or searches pickup and drop-off locations.')
numbered(doc, 'The route quote uses route band, service level, actual/volumetric weight, parcel dimensions, surcharges, discounts, and urgency rules.')
numbered(doc, 'The customer uploads a labelled parcel photo and accepts packaging declarations.')
numbered(doc, 'The backend creates a Paystack checkout session and later verifies the transaction server-side before the route can start.')
numbered(doc, 'A successful payment initializes the parcel financial ledger with customer payment, 20% platform allocation, 80% courier pool, payment cost, and reserve values.')
numbered(doc, 'The customer can track a parcel; owner-only refund eligibility is exposed on the tracking page and requests go to admin review.')

doc.add_heading('2.3 Courier recruitment and operating flow', level=2)
numbered(doc, 'Applicant completes a four-step public application with contact, vehicle, readiness, safety, and consent information.')
numbered(doc, 'Required documents include South African ID, driver licence, and vehicle insurance. Licence and insurance expiry dates are captured.')
numbered(doc, 'Administrators preview documents, approve or request replacement, add review notes, and trigger applicant notifications.')
numbered(doc, 'Approved couriers onboard bank details for weekly Paystack payouts and receive courier-specific route offers.')
numbered(doc, 'Courier workflow supports parcel-code verification, route start, native/location support, proof photos, delivery completion, safety check-ins, incidents, and handover operations.')

doc.add_heading('2.4 Relay and payment economics', level=2)
doc.add_paragraph('The commercial rule is applied once per customer charge:')
for line in ['Customer charge = final tariff', 'Mzansi gross platform allocation = customer charge × 20%', 'Shared courier pool = customer charge × 80%', 'Each relay courier receives only an allocation from that single shared pool', 'Courier estimated net = allocated gross − operating cost − handover/route costs', 'Mzansi estimated contribution = platform allocation − configured payment/payout/refund costs']:
    bullet(doc, line)
doc.add_paragraph('The allocator includes actual road kilometres from the Maps directions proxy, linehaul, deadhead and return kilometres, fuel and vehicle costs, tolls, handover time/fees, parcel count, parcel weight/volume, vehicle capacity, backhaul, minimum courier payout, and total pool availability.')

doc.add_heading('2.5 Financial protection', level=2)
bullet(doc, 'Each paid parcel has an append-only financial ledger and immutable event keys.')
bullet(doc, 'Ledger events include payment, platform allocation, courier pool, reserve, leg allocation, cancellation, replacement leg, refund lifecycle, platform reversal, courier-pool reversal, payment cost, payout cost, and settlement.')
bullet(doc, 'Refund reversals are proportional and do not create negative courier earnings when no courier payout has occurred; post-payout loss is separately recorded as a payout cost.')
bullet(doc, 'Settlement closes only after all linked courier allocations are paid, reducing double-payment risk.')

# Testing
doc.add_heading('3. Testing and end-to-end evidence', level=1)
doc.add_heading('3.1 Automated regression evidence', level=2)
table(doc, ['Evidence', 'Result', 'What it covers'], [
    ['Full Vitest run on 4 Oct 2026', '70 files passed; 2,625 tests passed; 5 skipped', 'Current codebase regression, payment, tracking, admin, safety, QR/code, native adapters, performance, accessibility, security, and failure tests.'],
    ['Launch-hardening suite', '1,206 tests passed within the full run', 'Ledger conservation, refund reversals, dispatch gates, reserves, route viability, capacity, and wave-planning primitives.'],
    ['Paystack integration suites', 'Passed in current run', 'Configuration contracts, checkout/verify behavior, webhook signatures, refund lifecycle helpers, and payment readiness logic.'],
    ['Native/courier suites', 'Passed in current run', 'Capacitor camera/location/notification adapters, native courier behavior, offline store, route search, theme behavior, and secure session helpers.'],
    ['Production build', 'Passed; Vite bundle and server bundle generated', 'Release compilation. Build emitted a chunk-size warning for the large App bundle; this is an optimization item, not a build failure.'],
])
doc.add_paragraph('The test count is evidence of code-level regression coverage, not proof that every external provider, physical handover, bank transfer, or production DNS record has been exercised.')

doc.add_heading('3.2 Browser and preview smoke testing', level=2)
table(doc, ['Flow', 'Observed result', 'Confidence'], [
    ['Public home / courier-first gating', 'Public booking/tracking/fleet surfaces are gated while courier recruitment remains visible.', 'Verified in preview and production HTML checks.'],
    ['Courier application', 'Multi-step form, validation, missing-document blocking, back navigation, and reload draft persistence verified with synthetic QA data.', 'Good for UI behavior; real documents still need a controlled applicant pilot.'],
    ['Admin dashboard', 'Unified courier dashboard, recruitment/enquiry review, relay economics, payout/refund audit workspaces reachable in preview.', 'Good UI smoke evidence; admin workflow needs real operational data review.'],
    ['Tracking', 'Public tracking privacy behavior and customer refund surface verified at UI/API level.', 'Needs physical two-courier custody test.'],
    ['Preview HMR', 'Proxy-aware secure HMR was tested with a harmless text change and reverted; no Vite console error observed after final reload.', 'Development-preview fix only; production serving configuration was not changed.'],
])

doc.add_heading('3.3 Paystack sandbox end-to-end evidence', level=2)
doc.add_paragraph('A disposable R10 Paystack test transaction was initialized in sandbox mode. The test checkout produced a Paystack test receipt, and the application refund lifecycle was exercised through the manual refund and webhook/ledger paths. The resulting test evidence is sandbox-only: no real funds were sent and it does not replace a production-mode transaction, production webhook delivery check, or bank payout reconciliation.')
bullet(doc, 'Verified server-side Paystack secret configuration without displaying secret values.')
bullet(doc, 'Verified checkout initialization and transaction reference handling.')
bullet(doc, 'Verified signed webhook processing and refund lifecycle states.')
bullet(doc, 'Verified immutable ledger reversal behavior and late/duplicate event protection.')
bullet(doc, 'Not yet verified: a real production charge, a production refund, a live courier transfer, and a Paystack Dashboard delivery record for the published webhook URL.')

doc.add_heading('3.4 Commercial simulation evidence', level=2)
doc.add_paragraph('The launch simulation used the production shared-pool allocator and Maps-assisted road geometry. It tested local, regional, JHB→Bloemfontein, JHB→Cape Town, 4–6 legs, parcel density from 1 through 120 parcels, capacity limits, tolls, fuel stress, empty returns, backhaul, courier cancellation/recovery, and 50% refund/failure conditions.')
table(doc, ['Representative scenario', 'Customer revenue', 'Mzansi 20%', 'Courier pool', 'Decision'], [
    ['Sandton→Soweto, 1 parcel', 'R180', 'R36', 'R144', 'Reject/consolidate: courier net below cost'],
    ['Sandton→Soweto, 5 parcels', 'R750', 'R150', 'R600', 'Dispatch'],
    ['JHB→Bloemfontein, 5 parcels', 'R3,250', 'R650', 'R2,600', 'Reject/reprice: pool below route cost'],
    ['JHB→Bloemfontein, 20 parcels', 'R9,000', 'R1,800', 'R7,200', 'Dispatch'],
    ['JHB→Cape Town, 5 legs, 5 parcels', 'R9,500', 'R1,900', 'R7,600', 'Reject/consolidate'],
    ['JHB→Cape Town, 5 legs, 20 parcels', 'R31,000', 'R6,200', 'R24,800', 'Dispatch'],
    ['JHB→Cape Town, 5 legs, 50 parcels', 'R65,000', 'R13,000', 'R52,000', 'Consolidate/wave: single-vehicle capacity issue'],
    ['JHB→Cape Town, 50% refund/failure stress', 'R16,500', 'R3,300', 'R13,200', 'Reject/consolidate under reserve rules'],
])
doc.add_paragraph('The simulation’s most important result is not that all routes pass. It is that low-density and capacity-infeasible routes are refused before dispatch. This is the intended behavior.')

# gaps
doc.add_heading('4. Work still required before the full vision works end to end', level=1)
doc.add_heading('4.1 Critical launch blockers', level=2)
critical = [
    ('Production Paystack verification', 'Run one controlled low-value production transaction using the owner’s real Paystack setup, verify server-side status, confirm the published webhook receives the event in Paystack Dashboard, and reconcile the resulting ledger. Do not use test credentials in production.'),
    ('Live courier payout verification', 'Verify recipient-bank setup, Paystack transfer initiation, transfer webhook/status, payout retry behavior, and ledger closure with a controlled amount. A successful customer payment alone does not prove courier payout readiness.'),
    ('Custom domain cutover', 'Connect `mzansicouriers.co.za` in Manus, verify SSL, confirm apex and `www` behavior, add redirects/canonical URL, and verify Google indexing after DNS propagation. The current DNS screenshot showed an existing hosting setup; it does not prove the Manus custom-domain mapping is active.'),
    ('Physical relay pilot', 'Run one labelled parcel through sender → courier 1 → courier 2 → recipient, including pickup code, handover acceptance, inspection, defect photo, delivery scan, GPS privacy, sender/recipient notifications, and rating/review capture.'),
    ('Production multi-wave execution', 'The planner can split 50+ parcels into capacity-safe waves, but the operational system still needs durable wave/run records, courier assignment, departure state, handover state, recovery state, and settlement linkage for each wave.'),
    ('Provider notification confirmation', 'Confirm production email, WhatsApp/Twilio, push, and in-app delivery with real sender/recipient/courier test accounts. Automated notification tests are not delivery receipts.'),
]
for title, detail in critical:
    p = doc.add_paragraph(); r = p.add_run(title + ' — '); r.bold = True; r.font.color.rgb = RGBColor.from_string('C45B2C'); p.add_run(detail)

doc.add_heading('4.2 Important improvements before scale', level=2)
for text in [
    'Replace the fixed default operating assumptions with verified per-vehicle profiles and a controlled process for fuel-price updates, maintenance, insurance, and driver minimums.',
    'Add an operations console for route exceptions: late courier, failed handover, no-show, damaged parcel, recovery assignment, refund reserve, and customer communication status.',
    'Make “gross platform fee”, “estimated platform contribution”, and “accounting profit” visually distinct everywhere. The 20% value is not net profit.',
    'Add a production reconciliation report matching Paystack payments/refunds/transfers to ledger entries and bank settlement dates.',
    'Add monitoring and alerting for webhook failures, duplicate events, payout retries, route underfunding, notification failures, and stale GPS/check-ins.',
    'Split the large frontend bundle with route-level dynamic imports before broad public launch; the current build passes but reports a chunk-size warning.',
    'Complete customer ratings/reviews as a persisted workflow if the current UI only sends prompts or notifications; verify sender and recipient permissions separately.',
    'Formalize insurance, prohibited-item enforcement, claims handling, POPIA/privacy retention, tax treatment, and courier service terms with professional advice.',
]: bullet(doc, text)

doc.add_heading('4.3 Features that are present but require explicit verification', level=2)
table(doc, ['Feature', 'Implemented evidence', 'Verification still needed'], [
    ['QR / parcel code', 'Courier workflow decodes a parcel code from camera/photo input and checks it against the expected tracking code.', 'Test a real printed QR/code under poor lighting and confirm pickup, handover, and delivery transitions are atomic.'],
    ['Sender/recipient notifications', 'Notification, email, Twilio/webhook, and in-app surfaces exist.', 'Verify actual delivery in production channels and prevent leakage of other users’ tracking.'],
    ['Ratings and reviews', 'The product requirements and notification language refer to rating/review prompts.', 'Confirm a persisted review model, moderation, one-review-per-role rule, and admin reporting exist end to end.'],
    ['Offline mode', 'Offline store and offline route-search tests pass; courier workflow reports queued evidence/location behavior.', 'Test reconnect conflict resolution, upload retry, duplicate suppression, and device restart with a real phone.'],
    ['Native hardware', 'Capacitor camera, location, notifications, biometric, secure storage, and map adapters exist.', 'Build and test on a physical Android device with runtime permissions, background behavior, and battery constraints.'],
])

# Android
doc.add_heading('5. Capacitor Android readiness', level=1)
doc.add_paragraph('The repository already contains Capacitor scaffolding. `capacitor.config.json` identifies the app as `com.mzansi.couriers`, uses `dist/public` as the web directory, and configures Android HTTPS behavior. Capacitor Android, Camera, Geolocation, Local Notifications, Push Notifications, Browser, and related packages are present.')
table(doc, ['Already available', 'Still required for Play submission'], [
    ['Android project and Gradle files', 'Release keystore and secure signing process'],
    ['Build output configured to dist/public', 'Release build generated from a tagged production commit'],
    ['Native auth callback scheme and secure session adapter', 'Physical-device auth callback test after install'],
    ['Camera, location, notifications, biometric, and native route adapters', 'Runtime permission, background location, battery, camera, and notification tests'],
    ['Production backend remains hosted; secrets remain server-side', 'Privacy declaration, Data Safety form, screenshots, store listing, support URL, and account deletion verification'],
    ['iOS/Android package metadata exists in the project', 'Android-specific review of deep links, back button, WebView navigation, and offline recovery'],
])
doc.add_heading('Recommended Android build sequence', level=2)
for step in [
    'Freeze and tag the current web/backend checkpoint after critical production verification.',
    'Set the final production URL and confirm the custom domain before packaging; do not hard-code the temporary preview hostname.',
    'Run `pnpm run build` and sync the generated `dist/public` into Capacitor.',
    'Open the Android project in Android Studio, set the release application ID/signing configuration, and build a signed internal-test APK/AAB.',
    'Test login, customer booking, Paystack redirect/return, courier QR/photo/location workflow, notifications, offline/reconnect, and account deletion on a physical device.',
    'Only then prepare Play Console declarations and production rollout.',
]: numbered(doc, step)

doc.add_heading('6. Recommended launch operating model', level=1)
for text in [
    'Launch first with local and regional corridors, scheduled consolidation, verified cars/vans, pre-approved handover points, and 5–20 parcels per corridor.',
    'Use the dispatch result contract strictly: DISPATCH only when geometry, capacity, reserves, courier net, and pool funding all pass; otherwise CONSOLIDATE, REPRICE, or REJECT.',
    'Do not promise same-day or long-distance delivery without a verified courier and recovery capacity.',
    'Require total courier pool to cover route cost floors, minimum payouts, and disruption reserve; never treat reserved funds as profit.',
    'Keep customer tracking scoped to the customer’s own parcel and courier operational views scoped to assigned work.',
    'Use the admin relay-economics panel to review gross, operating cost, estimated net, pool share, and vehicle-profile verification before approving weekly payouts.',
]: bullet(doc, text)

doc.add_heading('7. Launch decision checklist', level=1)
table(doc, ['Gate', 'Pass condition', 'Current status'], [
    ['Core build', 'TypeScript and production build pass', 'PASS'],
    ['Automated regression', 'No current test failures', 'PASS: 2,625 passed; 5 skipped'],
    ['Pricing conservation', '20% + 80% conserved once per parcel/relay pool', 'PASS in tests and simulation'],
    ['Dispatch protection', 'Unviable routes rejected before dispatch', 'PASS in simulation primitives; verify live commit path'],
    ['Refund ledger', 'Idempotent signed events and reversals', 'PASS in sandbox/tests; verify published production webhook'],
    ['Customer live payment', 'Production Paystack transaction reconciles', 'OPEN'],
    ['Courier live payout', 'Verified Paystack transfer reconciles', 'OPEN'],
    ['Domain', 'mzansicouriers.co.za resolves to this site with SSL', 'OPEN'],
    ['Physical relay', 'Two-courier custody test passes', 'OPEN'],
    ['50+ parcel waves', 'Durable operational wave records execute and settle', 'OPEN'],
    ['Android pilot', 'Signed physical-device build passes core flows', 'OPEN'],
])

doc.add_heading('8. Final assessment', level=1)
doc.add_paragraph('Mzansi Couriers has a credible technical foundation for a controlled launch. The strongest completed work is the economic discipline: the system no longer treats a long-distance parcel as if every courier receives a separate 80% payout. It models one shared pool, actual road geometry, costs, capacity, reserves, minimum payouts, refunds, and ledger conservation, and it rejects scenarios that do not support sustainable courier economics.')
doc.add_paragraph('However, a platform is not end to end merely because the code and tests pass. Before launch, Mzansi must close the external and operational proof points: a real production Paystack payment, production webhook delivery, a verified courier transfer, custom-domain cutover, a physical two-courier relay, notification delivery, and a durable multi-wave run/settlement process. Until those are complete, the correct status is controlled pilot—not unrestricted public scale.')
status(doc, 'Recommended next action', 'Close the six critical blockers in Section 4.1 in order, then perform a final release-candidate test using the custom domain and a physical Android device.', '0B5D4B')

# Evidence references
doc.add_heading('Appendix A — Evidence and source files', level=1)
for ref in [
    '`server/services/courier-pricing.ts` — tariff, weight/volume, route bands, and 20% platform fee.',
    '`server/services/relay-pool-pricing.ts` — shared courier-pool allocator.',
    '`server/services/relay-settlement.ts` — route geometry, vehicle economics, allocations, and ledger initialization.',
    '`server/services/financial-ledger.ts` — append-only ledger events and invariants.',
    '`server/services/launch-readiness.ts` — dispatch gates and parallel-wave planning.',
    '`server/payments/paystack.ts` and `server/payments/webhook.ts` — checkout, verification, refunds, transfers, and signed webhooks.',
    '`client/src/pages/CourierApplication.tsx` — recruitment, documents, expiry dates, draft persistence.',
    '`client/src/components/CourierRunWorkflow.tsx` — courier route, code verification, camera, GPS, proof, and delivery actions.',
    '`client/src/pages/AdminCourierDashboard.tsx` and related admin panels — recruitment, economics, refunds, payout/audit workspaces.',
    '`capacitor.config.json` and `android/` — native wrapper configuration.',
    '`reports/relay-launch-simulation-report.md` — 23-scenario commercial simulation using road geometry.',
    '`reports/shared-relay-courier-pool-design.md` — shared-pool relay model and worked example.',
    'Current regression evidence: 70 test files, 2,625 passed, 5 skipped; production build passed on 4 October 2026.',
]: bullet(doc, ref)

doc.add_paragraph()
p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = p.add_run('End of report')
r.italic = True; r.font.color.rgb = RGBColor.from_string('6B7F79')

OUT.parent.mkdir(parents=True, exist_ok=True)
doc.save(OUT)
print(OUT)
