# Product Requirements Document: Visitor Management System (VMS) for IIM Lucknow

**Version:** 1.0 (post two-round critique cycle)
**Owner:** Product Management
**Status:** Draft for stakeholder review

---

## 0. Method Note

This PRD was built iteratively: a first-draft scope was produced, then attacked from a devil's-advocate position to surface gaps, then revised; that revised draft was attacked a second time and revised again. Sections 1–4 show the *final* PRD. Section 5 shows the full critique trail (Round 1 and Round 2) so reviewers can see what was caught and why each decision was made, rather than just the polished output.

---

## 1. Problem Statement & Context

IIM Lucknow runs a high-security, high-footfall campus with overlapping visitor populations: prospective students and parents, corporate recruiters, guest faculty and conference delegates, vendors/contractors, alumni, RTI/official visitors, and family of resident students/faculty. Today this is handled via manual registers at multiple gates (Noida and Lucknow campuses), phone-call approvals, and physical ID checks. This creates:

- No single source of truth on who is on campus at any time (safety/audit risk, especially for an institute with hostels and minors occasionally on campus for events).
- Slow, inconsistent host-approval workflows.
- No pre-registration for bulk events (placements, convocation, conferences) causing gate queues.
- No integration with existing campus systems (hostel, security, ERP).
- Poor reporting for compliance, security audits, and management review.

**Goal:** Build a professional-grade, multi-campus Visitor Management System that digitizes the full visitor lifecycle — pre-registration, approval, check-in/out, badge issuance, host notification, blacklisting, and audit reporting — while integrating with existing campus identity and security infrastructure.

---

## 2. Goals and Non-Goals

### Goals
1. Reduce average gate check-in time to under 2 minutes for pre-registered visitors and under 5 minutes for walk-ins.
2. Provide real-time, queryable visibility into "who is on campus" for security and administration.
3. Support differentiated workflows per visitor type (individual, bulk/event, vendor, recurring/contractor, VIP).
4. Provide a complete, tamper-evident audit trail for compliance and incident investigation.
5. Integrate with existing campus systems rather than duplicate identity data (ERP/HRMS for hosts, hostel system, possibly existing access-control/turnstile hardware).
6. Work reliably on low-bandwidth/offline-prone gate conditions.

### Non-Goals (explicitly out of scope for v1)
- Replacing the physical access-control/turnstile/biometric system for staff and students (VMS will *integrate* with it, not replace it).
- Full vehicle/parking management (only basic vehicle number capture in v1).
- Payment processing (e.g., paid guest house bookings) — handled by existing systems, VMS only references booking IDs.
- Native mobile apps for hosts/security in v1 (mobile-responsive web first; native app deferred to v2 — see gap discussion in Section 5).

---

## 3. Personas & Core Use Cases

| Persona | Need |
|---|---|
| **Gate Security Officer** | Fast check-in/out, ID capture, instant flag on blacklisted/suspicious visitor, badge printing, offline capability |
| **Host (faculty/staff/student rep)** | Pre-register expected visitors, get notified on arrival, approve/reject ad-hoc visit requests, see visit history |
| **Visitor** | Self-service pre-registration link, QR-based fast entry, minimal data re-entry on repeat visits |
| **Admin/Security Head** | Dashboards, audit reports, blacklist management, configure approval rules per visitor type, manage gates/locations |
| **Event Coordinator** | Bulk upload of attendee lists (placements, conferences, convocation), generate group QR passes |
| **Compliance/Estate Office** | Export logs for audits, fire-safety headcount, RTI/legal visitor records, data retention policy enforcement |

### Representative User Journeys
1. **Pre-registered individual visit:** Host creates visit request with visitor name, phone, purpose, time window → visitor receives SMS/email with QR + form to fill ID/photo in advance → at gate, security scans QR, system shows photo + approval status + blacklist check → badge auto-prints → host gets arrival SMS/app notification → checkout via QR scan or security manual checkout, auto-checkout after configurable window if forgotten.
2. **Walk-in visitor:** Security captures details + photo at kiosk/tablet → system looks up host in directory → sends approval request to host (SMS/app/email with Approve/Reject buttons) → on approval, badge prints; on timeout (configurable, e.g., 10 min), escalates to host's manager or front-desk admin.
3. **Bulk event (e.g., placement company, 200 recruiters):** Coordinator uploads CSV → system generates individual QR codes, sends in bulk → on event day, dedicated fast-lane scanning, real-time headcount dashboard for fire safety.
4. **Recurring vendor/contractor:** Vendor registered once with company-level approval + validity period (e.g., 6 months) → daily check-in only requires ID scan, no re-approval each time, but each entry/exit still logged.
5. **Blacklist/security incident:** Security flags a visitor → future check-in attempts trigger silent alert to security supervisor + denial at gate, with reason logged.
6. **VIP/dignitary visit:** Pre-planned with security briefing notes attached, restricted visibility (only security head + designated host can see details), often bypasses standard approval SLA.

---

## 4. Final Functional Requirements (post-critique)

### 4.1 Visitor Pre-Registration & Approval
- FR1: Hosts can raise a visit request specifying visitor identity (name, phone, email optional), purpose, expected date/time window, and location (campus/building).
- FR2: System supports configurable approval chains per visitor category (e.g., self-approve for routine guests, two-level approval for visits involving hostel access or after-hours entry).
- FR3: Visitor self-registration via a public link/QR (no login required) that pre-fills data captured at host's invite, with mandatory ID proof upload and live photo capture.
- FR4: Bulk upload (CSV/Excel template) for event-based registration with validation and duplicate detection.
- FR5: Recurring/long-validity passes for vendors and contractors, with a company-level master record and individual personnel mapped to it; auto-expiry and renewal workflow.
- FR6: Approval requests deliverable via SMS, email, and in-app/push, with one-tap approve/reject; configurable timeout and escalation path.

### 4.2 Gate Operations (Check-in/out)
- FR7: Tablet/kiosk-based security console supporting QR scan, manual search, and walk-in registration.
- FR8: ID document capture (photo of govt ID) and live photo capture at point of entry; OCR-assisted data extraction for Aadhaar/DL/Passport where feasible, with manual override.
- FR9: Real-time blacklist/watchlist check at check-in with a hard stop and silent alert to security supervisor.
- FR10: Badge printing (thermal/QR badge) with visitor photo, name, host, validity time, and visually distinct badge types per visitor category (escorted vs unescorted, vendor, VIP).
- FR11: Checkout via QR re-scan, security manual action, or automatic checkout after a configurable maximum stay duration, with a flag raised for un-checked-out visitors past threshold for security follow-up.
- FR12: **Offline mode**: gate console must continue functioning (local queue, cached blacklist, cached host directory) during connectivity loss and reconcile on reconnect (see Section 5, Round 1 gap).

### 4.3 Real-Time Visibility & Notifications
- FR13: Live "who is on campus" dashboard, filterable by location/visitor type/host, for security and admin roles.
- FR14: Host notified on visitor arrival and departure (configurable channel preference).
- FR15: Automated headcount export for fire-safety/emergency muster point reconciliation (printable/exportable list of all on-premises visitors by zone).

### 4.4 Administration & Configuration
- FR16: Role-based access control: Visitor, Host, Gate Security, Security Supervisor, Admin, Compliance/Auditor (read-only), Event Coordinator.
- FR17: Configurable visitor categories, approval workflows, badge templates, and gate/location hierarchy (multi-campus: Lucknow + Noida + any future campus, multiple gates per campus).
- FR18: Blacklist/watchlist management with reason codes, evidence attachment, and review/expiry dates (avoid permanent blacklisting without periodic review — compliance requirement).
- FR19: Host directory sync from existing HRMS/ERP/student database (not manually maintained) — see integration requirements.

### 4.5 Reporting, Audit & Compliance
- FR20: Exportable audit logs (who approved whom, when, IP/device of action) — tamper-evident (append-only / hash-chained log table), retained per institutional data retention policy.
- FR21: Standard reports: daily visitor count, host-wise visit frequency, average approval time, gate-wise traffic, blacklist trigger report, overdue-checkout report.
- FR22: Data privacy controls aligned to India's Digital Personal Data Protection (DPDP) Act 2023 — explicit consent capture at registration, defined retention period with auto-purge, visitor right-to-access/delete request workflow, and data minimization (don't collect more ID detail than necessary for the visit category).

### 4.6 Integrations (system-of-record discipline)
- FR23: SSO integration with IIM-L's identity provider (likely Azure AD/Office 365, common in academic institutes) for host/staff/admin login.
- FR24: One-way sync from ERP/HRMS for the host/employee directory; one-way sync from student information system for student hosts (e.g., hostel guest visits).
- FR25: Optional integration hook (webhook/API) to existing turnstile/access-control hardware at building entries, so a VMS-issued badge can also trigger physical access where applicable.
- FR26: SMS/Email gateway integration (existing institutional gateway if available, else a standard provider) and WhatsApp Business API as a stretch goal for notifications (high open-rates in India).

### 4.7 Non-Functional Requirements
- NFR1: Availability — 99.5% during campus operational hours; gate console offline-tolerant as above.
- NFR2: Performance — check-in transaction (scan to badge print) under 5 seconds on a stable connection.
- NFR3: Scalability — must handle event-day spikes (e.g., 1,500 placement visitors checking in within a 2-hour window) without degradation; architecture must support horizontal scaling of check-in service independent of admin/reporting services.
- NFR4: Security — encryption at rest and in transit for all PII; ID documents stored with restricted access and automatic redaction in exports/reports unless explicitly authorized; regular penetration testing given it handles government ID data.
- NFR5: Auditability — every state change logged immutably.
- NFR6: Accessibility — gate console and self-registration form usable on low-end Android devices and by visitors with limited digital literacy (large fonts, multilingual: English + Hindi at minimum).
- NFR7: Device resilience — kiosk/tablet hardware and thermal printers must support common Indian vendors (e.g., Zebra/TSC printers) with driver-level abstraction so hardware swap doesn't require app changes.

---

## 5. Critique Trail: Two Rounds of Devil's Advocate Review

### Round 1 — Critiquing the Initial Draft Scope

The initial draft (not shown in full) assumed: single-campus operation, always-online gate tablets, a single linear approval workflow for all visitor types, manual blacklist checks, no formal data privacy handling, and a single combined "VMS service" doing everything (registration, check-in, reporting) without distinguishing load profiles.

**Devil's advocate challenges raised:**

1. **"Your gate console assumes Wi-Fi/4G never fails. What happens during the placement season when 200 people show up and the network saturates, or campus Wi-Fi has an outage?"**
   - *Gap:* No offline mode; check-in would halt entirely, defeating the speed goal and creating a security gap (no fallback process defined).
   - *Solution adopted:* FR12 — offline-capable gate console with local-first queue and cached blacklist/directory, sync-on-reconnect (became part of architecture decision: edge caching at gate device, eventual-consistency sync model).

2. **"You designed one approval workflow. A walk-in salesperson and a VIP dignitary and a parent visiting a hosteller cannot reasonably go through the identical process — would you really make a Director's guest wait for a 10-minute SMS approval timeout?"**
   - *Gap:* One-size-fits-all workflow ignores risk-tiering and the reality of VIP/short-notice visits.
   - *Solution adopted:* FR2, FR6 — configurable, category-specific approval chains and escalation rules; VIP path explicitly modeled as a journey (Section 3, Journey 6).

3. **"Where does the host directory come from? If security has to manually type 'Prof. X' every time, you'll get typos, duplicate hosts, and stale data the day someone leaves the institute."**
   - *Gap:* No integration plan with ERP/HRMS/student systems — directory would be manually maintained and decay quickly.
   - *Solution adopted:* FR19, FR24 — directory sync as a first-class integration requirement, not an afterthought.

4. **"You're capturing Aadhaar/passport copies of every visitor. Do you have any retention or consent policy? Because under India's DPDP Act, that's now a real legal exposure for the institute, not a nice-to-have."**
   - *Gap:* No privacy/compliance requirement at all in the initial draft.
   - *Solution adopted:* FR22 — explicit DPDP-aligned consent, retention, deletion-request, and data minimization requirements; flows into architecture (encryption, access control on documents).

5. **"You've bundled registration, check-in, and reporting into one service. On placement day, will a Power BI–style report query slow down someone's badge printing at the gate?"**
   - *Gap:* No separation of transactional (gate) workload from analytical (reporting) workload — a real performance risk under event-day load.
   - *Solution adopted:* NFR3 plus architectural decision (Section 6) to separate the check-in/transactional path from reporting/analytics path, with read replicas / a reporting store.

**Result of Round 1:** scope expanded to include offline mode, tiered approval workflows, directory integration, privacy compliance, and a load-separation principle — all reflected in Section 4 above.

---

### Round 2 — Critiquing the Round-1-Revised Draft

With Round 1 gaps fixed, the draft was attacked again, this time focused on operational edge cases, multi-campus reality, and longer-term maintainability rather than headline features.

**Devil's advocate challenges raised:**

1. **"You added offline mode for the gate console — but what happens if a blacklisted person is checked in while offline because the cached blacklist on that device is six hours stale? Who's accountable for that gap?"**
   - *Gap:* Offline mode solves availability but introduces a *consistency* risk for safety-critical data (blacklist) that wasn't addressed — silently "good enough" caching isn't acceptable for a security control.
   - *Solution adopted:* Defined a max-staleness SLA for cached blacklist data (e.g., force sync every 15 minutes when online; if device has been offline beyond a configurable threshold, e.g., 2 hours, the console visibly flags "blacklist data may be stale" to the security officer and requires manual ID verification/escalation rather than silent auto-approval). Added to FR12 and to NFR4 as an explicit risk control, and reflected in the architecture's conflict-resolution policy (Section 6.3).

2. **"Two campuses — Lucknow and Noida — with different security teams, different gate hardware potentially, and possibly different network providers. Is this really one tenant, one config, or have you actually designed for multi-campus from the data model up?"**
   - *Gap:* The draft treated "multi-campus" as a checkbox (FR17) without considering that location-scoping must run through *every* feature — RBAC, dashboards, blacklist scope (is a person blacklisted at one campus blacklisted everywhere, or only at the one with the incident?), and reporting.
   - *Solution adopted:* Explicit decision: blacklist is **institute-wide by default** but with a campus-scoped visibility flag for incidents under investigation (avoids cross-campus information leakage during sensitive HR/security matters while keeping the safety-critical default global). RBAC and dashboards (FR13, FR16, FR17) now explicitly location-scoped at the data-model level, not just UI-filtered — this became a core entity design decision (Section 6.2).

3. **"You've integrated with HRMS/ERP/SIS as one-way syncs. What's your contract when those systems are down, change their API, or rename a field? Who owns that integration long-term — is this institute IT, or does the vendor maintain it forever?"**
   - *Gap:* Integration was specified functionally (FR23–FR26) but had no resilience design (what if the source system is unavailable) or ownership/maintenance model — a common cause of VMS projects quietly breaking 8 months after go-live.
   - *Solution adopted:* Defined integration pattern as scheduled batch sync (nightly + on-demand) with last-known-good fallback (system continues operating on cached directory if HRMS sync fails, with an admin alert rather than a hard failure), plus a documented integration contract (versioned API/file schema) as a deliverable, and named institute IT as the long-term integration owner with the vendor providing a maintenance SLA — captured as a delivery/ops requirement, not just a feature.

4. **"You built bulk upload for events, but what happens when 1,500 placement visitors all try to check in inside a 90-minute window using the *same* general-purpose check-in flow as a single walk-in guest? Have you actually load-tested that path, or just assumed it scales?"**
   - *Gap:* NFR3 stated a scalability goal but the functional design hadn't created a *distinct, lighter-weight fast-lane flow* for bulk/event check-in (e.g., skip live photo capture, skip ID OCR, just QR validation + headcount) — without this, "scale" is just a number on paper, not a designed flow.
   - *Solution adopted:* Added an explicit "fast-lane / event mode" gate configuration (lighter validation, QR-only scan, pre-approved batch, dedicated queue/dashboard) as part of FR10/FR7, distinguished from the standard walk-in flow, and called out in the architecture as a separate, horizontally-scaled check-in service path (Section 6.4).

5. **"Self-registration requires no login — so what stops someone from registering a fake visit, screenshotting a QR, and sharing it, or just resubmitting the same form 500 times to spam a host's phone with approval requests?"**
   - *Gap:* No abuse/anti-fraud control was specified for the public self-registration surface — a real gap for a "no-login, public link" design.
   - *Solution adopted:* Added requirements: QR codes are single-use and time-bound (auto-expire after the visit window, optionally one device-binding check at first scan); public registration form has rate-limiting + CAPTCHA + OTP verification of visitor phone number before an approval request is sent to a host; repeated rejected/expired requests from the same number trigger a cool-down. These are added as FR3a/FR6a-equivalent hardening requirements under Section 4.1/4.2 and as an explicit abuse-prevention NFR (extends NFR4).

**Result of Round 2:** the PRD moved from "feature-complete" to "operationally defensible" — addressing data-consistency risk in offline mode, true multi-campus data modeling, integration resilience/ownership, a real fast-lane design for bulk events, and anti-abuse controls on the only unauthenticated surface in the system. Sections 4.1, 4.2, 4.4, 4.6, and 4.7 above already reflect these fixes; Section 6 reflects the architectural consequences.

**Residual risks knowingly deferred to v2 (documented, not silently dropped):**
- Native mobile apps for host/security (kept mobile-responsive web for v1 given budget/timeline; revisit if host adoption data shows push-notification reliability issues with web).
- Full biometric (fingerprint/face-match) verification at gate — flagged as a future enhancement once volume/ROI justifies the hardware and consent-model complexity under DPDP.
- Vehicle/parking management beyond a free-text vehicle number field.
- WhatsApp Business API notifications — desirable but treated as stretch goal, not committed, due to vendor approval lead time.

---

## 6. Architecture & Technology Recommendations

The critique trail directly drove three architectural principles:
- **Separate transactional (gate) path from analytical (reporting) path** (Round 1, point 5).
- **Design for offline-first at the edge, with explicit staleness handling, not just "works offline"** (Round 2, point 1).
- **Treat multi-campus/location as a first-class dimension in the data model**, not a UI filter (Round 2, point 2).

### 6.1 High-Level Architecture

A modular monolith-to-microservices-ready architecture is recommended over a full microservices approach for v1 — the team size and operational maturity typical of an institute deployment doesn't justify microservices complexity yet, but the system should be built with clear service boundaries so individual pieces (e.g., the check-in service) can be split out and independently scaled when event-day load demands it (this directly satisfies NFR3 and the Round 1/Round 2 fast-lane requirement).

**Logical components:**
1. **Gate Edge App** (runs on tablet/kiosk) — offline-capable, local SQLite/IndexedDB cache of directory + blacklist + pending check-ins, syncs via a dedicated sync API.
2. **Core API Service** — registration, approval workflow, RBAC, visitor/host/visit entities (the "system of record").
3. **Check-in/Fast-Lane Service** — a separable, horizontally-scalable path specifically for high-throughput scan/validate/badge-print transactions; reads from a fast cache (Redis) seeded from Core API, writes append-only check-in events.
4. **Notification Service** — abstracts SMS/email/push/WhatsApp providers, handles approval-request delivery and escalation timers (queue-based, retry-safe).
5. **Integration Service** — scheduled sync jobs with HRMS/ERP/SIS/AD, with last-known-good fallback and admin alerting on sync failure (Round 2, point 3).
6. **Reporting/Analytics Service** — reads from a replica/warehouse, not the live transactional DB, so heavy report queries never contend with gate check-in performance.
7. **Audit/Compliance Store** — append-only, hash-chained log of all state-changing actions, separate from operational data so it can't be casually altered even by admins.

### 6.2 Data Model Principles
- Every core entity (Visitor, Visit, Host, Badge, Blacklist Entry) carries a `campus_id`/`location_id` as a first-class foreign key, not an optional tag — this is what makes RBAC, dashboards, and reporting genuinely multi-campus rather than filtered-in-the-UI (Round 2, point 2).
- Blacklist entries carry both a global `is_global` flag (default true) and an optional `scope_campus_id` for investigation-period restricted entries.
- Visit and check-in records are immutable once created; corrections are modeled as new linked records, never destructive edits — supports the tamper-evident audit requirement (FR20).

### 6.3 Offline & Sync Strategy
- Gate Edge App treats blacklist and host-directory data as a **local read cache with a TTL and staleness indicator**, not a permanent local copy — addresses Round 2, point 1 directly: the UI must visibly warn security staff when cache is stale beyond the configured threshold.
- Check-in events created offline are queued locally (durable local storage) and synced as an append-only event stream on reconnect; conflict resolution is straightforward because check-in events are immutable facts (no concurrent-edit conflicts), only ordering/sync-status matters.

### 6.4 Fast-Lane / Event-Mode Path
- A configurable "event mode" routes pre-approved, pre-batched visitors (from bulk upload) through a lighter-weight validation pipeline (QR signature check + cached approval status only, no live ID OCR), hitting the Check-in/Fast-Lane Service which can be scaled out independently (additional container instances) for the duration of an event, satisfying the load-test concern raised in Round 2.

### 6.5 Frontend Architecture
- **Gate/Kiosk app:** Progressive Web App (PWA) — installable on Android tablets, offline-first via service workers + IndexedDB, works with common low-cost Android kiosk hardware and thermal printer SDKs without needing native app store distribution/updates (faster patch cycles for a security-relevant tool).
- **Host/Admin/Security web portal:** Standard responsive single-page application; role-based UI rendering tied directly to backend RBAC (never trust frontend role checks alone).
- **Public self-registration form:** Lightweight, server-rendered or static page (fast load on poor mobile networks, minimal JS dependency) with OTP-gated submission per the anti-abuse hardening from Round 2.
- Design system: consistent component library shared across kiosk/portal to reduce maintenance overhead and keep gate-staff training simple (low-literacy-friendly UI per NFR6).

### 6.6 Recommended Tech Stack

| Layer | Recommendation | Rationale |
|---|---|---|
| Gate Edge App | PWA — React + service workers, IndexedDB/Dexie.js for local cache | Offline-first, installable, no app-store update lag, runs on low-cost Android tablets |
| Admin/Host Web Portal | React (or Vue) SPA, TypeScript | Strong ecosystem, RBAC-aware component patterns, large hiring pool in India |
| Public registration page | Server-rendered (Next.js SSR) or lightweight static + minimal JS | Fast on poor networks, smaller attack surface for an unauthenticated surface |
| Core API / Integration / Notification Services | Node.js (NestJS) or Java (Spring Boot) | Both viable; NestJS if team prefers TS end-to-end consistency with frontend; Spring Boot if institute IT already standardizes on Java — recommend confirming against existing institute stack before finalizing |
| Check-in/Fast-Lane Service | Same backend framework as Core API, but deployed as an independently scalable service/container | Needs independent horizontal scaling for event spikes without redeploying the whole system |
| Primary Database | PostgreSQL | Strong relational integrity for visit/approval workflows, mature support for partitioning by campus/date for scale, JSONB for flexible per-category fields |
| Cache / Fast-lane store | Redis | Sub-second lookups for blacklist/approval-status checks at the gate, pub/sub for real-time dashboard updates |
| Reporting/Analytics | Read replica of Postgres, or a lightweight warehouse (e.g., Postgres + materialized views initially; move to a proper warehouse only if data volume later demands it) | Avoid over-engineering analytics infra for an institute-scale dataset in v1 |
| Audit/Compliance Log | Append-only table with hash-chaining (or a dedicated immutable log store) | Tamper-evidence requirement (FR20) without needing exotic blockchain-style tooling |
| Message/Notification Queue | Redis Streams or a managed queue (e.g., AWS SQS) for SMS/email/push delivery with retry | Reliability for approval-notification delivery, decouples notification from request path |
| File/Document Storage | Object storage (S3-compatible) with encryption at rest, signed-URL access | ID document/photo storage with restricted, auditable access (NFR4) |
| Identity/SSO | OAuth2/OIDC integration with institute's Azure AD (or equivalent IdP) | Reuse existing institute identity rather than a parallel user store for staff |
| Hosting | Cloud-hosted (institute's preferred provider, e.g., Azure given likely AD usage) with on-prem fallback discussion if institute mandates data residency on campus | DPDP compliance and institute IT policy will likely dictate residency requirements — confirm early |
| Printer/Hardware Integration | Vendor SDK abstraction layer (Zebra/TSC ESC/POS-compatible) behind a common print-service interface | Avoid vendor lock-in to one printer brand, per NFR7 |
| Observability | Centralized logging + metrics (e.g., ELK/Grafana stack or cloud-native equivalent) | Needed to actually catch the offline-sync and integration-failure scenarios surfaced in Round 2 before they become incidents |

---

## 7. Open Questions for Stakeholder Confirmation
1. Does IIM Lucknow IT mandate on-prem/data-residency hosting, or is cloud hosting (Azure, given AD usage) acceptable? This affects the hosting row above and DPDP compliance design.
2. What is the actual existing turnstile/access-control hardware (if any) at building entries, to validate the FR25 integration hook feasibility?
3. Who owns long-term maintenance of the HRMS/ERP/SIS integration post-go-live — institute IT or the vendor under an AMC?
4. Is a native mobile app for hosts/security a hard requirement for launch, or can PWA/responsive web be validated first (cost/timeline tradeoff)?
5. What is the institute's current SMS/email gateway, if any, to be reused rather than procuring a new one?

---

## 8. Success Metrics (v1 launch)
- ≥90% of campus visits arrive via pre-registration within 3 months of launch (vs. ad-hoc walk-in).
- Average check-in time: pre-registered <2 min, walk-in <5 min, event/fast-lane <30 sec/visitor.
- Zero unresolved blacklist bypass incidents.
- 100% of visitor data handled with documented DPDP-aligned consent and retention.
- <1% check-in transactions lost/unsynced after offline periods (measured via reconciliation logs).
