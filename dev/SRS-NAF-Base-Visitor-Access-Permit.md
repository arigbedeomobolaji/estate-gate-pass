# SRS – NAF Base Visitor Access Permit & Estate Management System

2026-11-26 · Olorunfemi

---

## 1. Introduction

This document specifies the software requirements for the NAF Base Visitor Access Permit & Estate Management System — a web-based platform that replaces the manual visitor clearance process at NAF Base with a digital, role-controlled permit workflow.

### 1.1 Purpose

The system enables registered residents to create visitor permits online, allows gate guards to verify visitors in seconds via QR code or permit number, and gives the 441 CIS Unit administrator full oversight of base access activity and resident management.

### 1.2 Scope

The system covers:

- Visitor permit creation (with optional visitor photo), approval, and QR code generation
- Gate-level verification, entry/exit recording, and denial management — with visitor photo display
- Resident, guard, and gate administration (admin-provisioned accounts only)
- Service Number and email-based authentication with forced first-login password change
- PERSONNEL and CIVILIAN resident sub-types
- Bulk resident creation via CSV/Excel import
- Rule-based permit classification (STANDARD / EXTENDED) with configurable charge amounts
- Audit trail and reporting with individual guard identification on every gate action
- Progressive Web App (PWA) with installability and Web Push notifications
- In-app + push arrival notifications (v1); email/SMS/WhatsApp channels (future)

Out of scope for Version 1: group/bulk permits, recurring permits, online payment processing, offline mode, biometric/CCTV integration, native mobile applications.

### 1.3 Intended Audience

| Audience | Use |
| --- | --- |
| 441 CIS Unit (client / administrator) | Approve, configure, and operate the system |
| Project development team | Implementation and testing reference |
| BSG estate management | Resident database import and onboarding |
| Gate security officers | Day-to-day operation |

### 1.4 Document Conventions

- **SHALL** = mandatory requirement
- **SHOULD** = recommended but not mandatory for v1
- **MAY** = optional / future consideration
- Version covered by this SRS: **Version 1.0**

---

## 2. Overall Description

### 2.1 System Context

NAF Base currently processes visitor access manually: residents phone or radio the gatehouse, guards write entries in a logbook, and no central record is maintained. The proposed system digitises this workflow end-to-end via a responsive web application accessible on phones, tablets, and computers.

### 2.2 Key Stakeholders

| Stakeholder | Role |
| --- | --- |
| 441 CIS Unit | System owner, administrator, resident registration authority |
| BSG Estate Management | Resident database source; onboarding partner |
| Registered Residents | Create and manage visitor permits |
| Gate Security Officers | Verify visitors and record gate activity |
| Visitors | Present permit (QR code or number) at the gate |

### 2.3 High-Level Workflow

1. Resident logs in and creates a visitor permit (< 1 minute).
2. System auto-approves and generates a unique permit number and QR code.
3. Resident shares the QR code or permit number with the visitor.
4. Visitor presents the code at the gate.
5. Guard scans or searches; system displays permit validity in seconds.
6. Guard grants or denies entry; system records the action.
7. Resident receives an in-app arrival notification instantly.
8. Guard records exit when visitor departs.

### 2.4 Operating Environment

- **Platform:** Responsive web application (Next.js); no native mobile app in v1.
- **Hosting:** Cloud-based (Vercel); database on Neon PostgreSQL.
- **Guard devices:** Internet-enabled tablet, phone, or desktop at each gate.
- **Connectivity:** Designed for low-bandwidth conditions; guard verification screen is lightweight.
- **Expected load:** 500–1,000 visitors per day across all gates.

---

## 3. User Roles & Characteristics

### 3.1 Resident

A resident is a person authorised to live on NAF Base, registered by the 441 CIS Unit administrator. Residents are classified into two sub-types:

- **PERSONNEL** — serving military or civilian staff with a Service Number issued by 441 CIS. Can log in with their Service Number or email address.
- **CIVILIAN** — family members, contractors, or other accredited persons who reside on the base but have no Service Number. Can log in with their email address only.

Both sub-types have equal permit-creation rights. The permit form SHALL be completable in under 1 minute.

**Profile data (PERSONNEL):** Full name · Service Number · House/flat number · Phone number · Email address.

**Profile data (CIVILIAN):** Full name · House/flat number · Phone number · Email address (mandatory).

**Access:** Own permits and visitor records only. A resident SHALL NOT view another resident's data.

### 3.2 Gate Guard / Security Officer

Guards operate from internet-enabled devices at their assigned gate. Every guard SHALL have a **personal account** (provisioned by the administrator) linked to their individual Service Number. The interface SHALL be optimised for speed — a visitor SHALL be processed in a few seconds.

**Gate audit model:** When multiple guards are detailed to the same gate, each logs in with their own credentials. The system records the specific guard account that processed every entry, exit, or denial, providing a full individual audit trail. Shared gate credentials are not permitted.

**Assignment:** Each guard account is assigned to one gate. The system records which guard processed each visitor.

**Access:** Permit verification, entry/exit recording, and today's gate activity. No access to resident management or other gates' records unless authorised.

### 3.3 Administrator (441 CIS Unit)

The administrator manages the system on behalf of NAF Base command. At least one administrator account SHALL exist at all times.

**Access:** Full system — resident management, guard management, gate configuration, all permit and visit records, audit logs, and reports.

**Registration authority:** Only the administrator may create or import resident accounts. Self-registration by residents is not permitted in v1.

---

## 4. Functional Requirements

### 4.1 Authentication & Session Management

- FR-01: All user accounts SHALL be provisioned exclusively by the administrator. No self-registration is permitted.
- FR-02: PERSONNEL users SHALL be able to log in with their **Service Number** or **email address** plus password.
- FR-03: CIVILIAN users SHALL log in with their **email address** plus password (no Service Number).
- FR-04: On first login, every new account SHALL be forced to change their password before accessing any page. The system SHALL redirect to a mandatory `/change-password` screen.
- FR-05: Until the password is changed, the user SHALL NOT be able to access any other route.
- FR-06: Sessions SHALL expire after 8 hours of inactivity.
- FR-07: The system SHALL redirect each role to its own dashboard on login (Resident → `/resident`; Guard → `/guard`; Admin → `/admin`).
- FR-08: The system SHALL maintain a secure, HTTP-only session cookie.
- FR-09: The administrator SHALL be able to reset any user's password and re-trigger the forced change on next login.

### 4.2 Resident – Permit Creation

- FR-10: A resident SHALL be able to create a visitor permit in a single form.
- FR-11: The permit form SHALL collect: visitor full name, visitor phone, purpose of visit, visit date, visit end date (optional — for multi-day permits), expected arrival time, expected departure time, vehicle registration (optional), vehicle type (optional), **visitor photograph (optional)**.
- FR-12: The visitor photograph SHALL be uploaded from the resident's device, resized client-side to a maximum of 400 × 400 px before submission.
- FR-13: The system SHALL auto-populate the resident's name and house/flat number; the resident SHALL NOT re-enter their own details.
- FR-14: The system SHALL automatically approve every permit submitted by a registered resident.
- FR-15: On approval, the system SHALL immediately generate a unique permit number (`EST-YYYYMMDD-XXXXX`) and a unique QR code.
- FR-16: Arrival time SHALL be before departure time; the system SHALL reject the form otherwise.
- FR-17: If the permit duration exceeds the configured free threshold (default: 30 days), the system SHALL classify it as **EXTENDED** and display the applicable charge to the resident before submission.

### 4.3 Resident – Permit Management

- FR-11: A resident SHALL be able to view all their permits (active, upcoming, completed, cancelled).
- FR-12: A resident SHALL be able to view the QR code for any active permit.
- FR-13: A resident SHALL be able to cancel an active permit with an optional reason, provided the visitor has not yet entered.
- FR-14: A resident SHALL be able to see the real-time visit status of each permit (Expected / Inside / Exited / Denied).

### 4.4 Resident – Dashboard

- FR-15: The resident dashboard SHALL display: today's expected visitors, visitors currently inside, visitors awaiting arrival, and a shortcut to create a new permit.

### 4.5 Guard – Permit Verification

- FR-24: The guard SHALL be able to verify a permit by scanning a QR code.
- FR-25: The guard SHALL be able to verify a permit by entering the permit number manually.
- FR-26: The guard SHALL be able to search by visitor name or resident name/house number.
- FR-27: The verification screen SHALL display: visitor name, resident name, house/flat, purpose, valid date, valid time window, vehicle details, visitor photograph (if uploaded), and a clear status badge.
- FR-28: If a visitor photograph was uploaded at permit creation, it SHALL be prominently displayed on the guard's verification screen to allow visual confirmation of the visitor's identity.
- FR-29: The status badge SHALL show one of: **VALID** · **EXPIRED** · **NOT YET VALID** · **ALREADY USED** · **CANCELLED** · **NOT FOUND**.
- FR-30: Verification SHALL complete within 3 seconds on a standard mobile data connection.

### 4.6 Guard – Entry & Exit

- FR-22: The guard SHALL be able to grant entry for a VALID permit. The system SHALL record: visitor, resident, house/flat, permit number, gate, guard account, date, and exact entry time.
- FR-23: The system SHALL prevent the same permit being used to grant entry a second time (status becomes INSIDE or EXITED after first use).
- FR-24: The guard SHALL be able to deny entry and SHALL be prompted to record a reason.
- FR-25: The guard SHALL be able to record visitor exit. The system SHALL record: exit gate, exit guard, and exact exit time.
- FR-26: The guard dashboard SHALL display: visitors currently inside, today's expected visitors, recent entries, and visitors awaiting verification.

### 4.7 Notifications

- FR-27: Immediately after a guard grants entry, the system SHALL send an in-app notification to the permit's resident: "[Visitor name] has arrived at [Gate name] at [HH:MM]."
- FR-28: The notification architecture SHALL be modular so that email, SMS, and WhatsApp channels can be added without redesigning the core application.

### 4.8 Administrator – Resident Management

- FR-42: The administrator SHALL be able to create individual resident accounts, specifying: full name, email, house/flat number, phone, user sub-type (PERSONNEL / CIVILIAN), and Service Number (required for PERSONNEL only).
- FR-43: On account creation, the system SHALL generate a temporary password and set `mustChangePassword = true` so the resident is forced to change it on first login.
- FR-44: The administrator SHALL be able to import residents in bulk from an Excel or CSV file. The file SHALL contain at minimum: full name, email, house/flat number, phone, user sub-type, and (for PERSONNEL) Service Number.
- FR-45: The bulk import SHALL validate each row before writing any records. Any row with a duplicate email or Service Number SHALL be reported as an error without preventing other rows from importing.
- FR-46: The administrator SHALL be able to activate or deactivate any resident account.
- FR-47: A deactivated resident SHALL NOT be able to log in or create new permits; existing approved permits for that resident SHALL remain visible for guard reference.
- FR-48: The administrator SHALL be able to reset any user's password, which SHALL re-trigger the forced password change on next login.

### 4.9 Administrator – Guard & Gate Management

- FR-33: The administrator SHALL be able to create and manage guard accounts and assign each guard to a gate.
- FR-34: The administrator SHALL be able to create, rename, and deactivate gates.
- FR-35: Supported gates in v1: Main Gate, Gate 2, FPG Gate, AFIT Gate (configurable).

### 4.10 Administrator – Monitoring & Reports

- FR-36: The administrator SHALL be able to search all permits and visit records by: visitor name, resident name, house/flat number, permit number, vehicle registration, date, gate, and status.
- FR-37: The administrator dashboard SHALL display: visitors today, currently inside, expected today, entries today, exits today, active permits, expired permits, cancelled permits.
- FR-38: The administrator SHALL be able to view a full audit trail of: permit creation, cancellation, modification, entry granted/denied, exit recorded, and account changes.
- FR-39: The administrator SHALL be able to export visitor history and audit logs as reports.

### 4.11 Data Retention

- FR-40: Detailed visit records SHALL be retained for a configurable period (default: 60 days). The retention period SHALL be adjustable by the administrator without code changes.

### 4.12 Permit Rules & Charge Classification

- FR-50: The administrator SHALL be able to configure a **permit rule** specifying: maximum free days (default: 30), charge per day beyond the free threshold, and currency (default: NGN).
- FR-51: When a resident submits a permit form, the system SHALL automatically calculate the permit duration in calendar days.
- FR-52: If the duration is within the free threshold, the permit SHALL be classified as **STANDARD** with no charge.
- FR-53: If the duration exceeds the free threshold, the system SHALL classify the permit as **EXTENDED**, calculate the total charge (charge per day × excess days), and display this to the resident **before** final submission.
- FR-54: The resident SHALL be required to acknowledge the displayed charge before an EXTENDED permit is submitted.
- FR-55: Charge status SHALL be tracked per permit: **PENDING** (charge accrued, not yet paid), **PAID**, or **WAIVED** (at administrator discretion).
- FR-56: Online payment processing is out of scope for v1; charge tracking is for administrative record-keeping only.

### 4.13 Progressive Web App (PWA) & Push Notifications

- FR-57: The application SHALL be installable as a Progressive Web App on Android, iOS (Add to Home Screen), and desktop Chrome/Edge.
- FR-58: The PWA manifest SHALL declare the application name, short name, icons (at least 192 × 192 and 512 × 512 px), theme colour, background colour, `display: standalone`, and `start_url`.
- FR-59: A service worker SHALL be registered on first page load to enable PWA install prompts and future offline caching.
- FR-60: Residents SHALL be prompted (once) to allow Web Push notifications after their first login.
- FR-61: When a guard grants entry, the system SHALL send a Web Push notification to the resident's registered browser/device: "[Visitor name] has arrived at [Gate name] at [HH:MM]."
- FR-62: Push subscriptions SHALL be persisted per user and per device; a user may have multiple active subscriptions (phone, tablet, desktop).
- FR-63: If the resident's browser is not subscribed to push notifications, the system SHALL fall back to in-app notification only (no silent failure).

---

## 5. Non-Functional Requirements

### 5.1 Performance

| Requirement | Target |
| --- | --- |
| Permit verification (scan to result) | ≤ 3 seconds on 3G |
| Permit creation (form submit to QR display) | ≤ 5 seconds |
| Dashboard page load | ≤ 3 seconds |
| Concurrent users supported (v1) | 500 |
| Peak daily visitor throughput | 1,000 visitors/day |

### 5.2 Security

- NFR-01: All data SHALL be transmitted over HTTPS; no plain HTTP in production.
- NFR-02: Passwords SHALL be stored as bcrypt hashes (minimum cost factor 12).
- NFR-03: Session tokens SHALL be signed JWTs with an 8-hour expiry, stored in HTTP-only cookies.
- NFR-04: QR codes SHALL encode a cryptographically random token; the system SHALL store only its SHA-256 hash, never the raw token.
- NFR-05: Role-based access control SHALL be enforced server-side on every API route; client-side role checks are for UX only.
- NFR-06: A resident SHALL only access their own permits; cross-resident data access SHALL be rejected with HTTP 403.
- NFR-07: The system SHALL maintain a tamper-evident audit log of all sensitive actions (see FR-38).
- NFR-08: Environment secrets (database URL, auth secret) SHALL never be committed to source control.

### 5.3 Scalability

- NFR-09: The application SHALL be stateless so that horizontal scaling (additional server instances) requires no code changes.
- NFR-10: The database schema SHALL support adding gates, guards, and residents without schema migration.
- NFR-11: The notification module SHALL be pluggable; adding a new channel (SMS, WhatsApp) SHALL require only a new provider implementation, not core changes.
- NFR-12: The data-retention period SHALL be configurable via a system setting without redeployment.

### 5.4 Availability & Reliability

- NFR-13: Target uptime: 99.5% measured monthly.
- NFR-14: The system SHALL recover automatically from transient database connection failures (connection pooling via Neon serverless driver).
- NFR-15: If the QR scanner fails, manual permit number entry SHALL always be available as a fallback.

### 5.5 Usability

- NFR-16: The resident permit form SHALL be completable in under 60 seconds by a first-time user.
- NFR-17: The guard verification screen SHALL require no more than 2 taps/clicks from login to granting entry.
- NFR-18: The application SHALL be fully responsive and usable on screens from 320 px (phone) to 1920 px (desktop).
- NFR-19: Critical status indicators (VALID / EXPIRED / DENIED) SHALL be distinguishable by colour AND text so they remain accessible to colour-blind users.

---

## 6. System Constraints & Assumptions

### 6.1 Constraints

| # | Constraint |
| --- | --- |
| C-01 | The system SHALL be a responsive web application; no native Android or iOS app in v1. |
| C-02 | Internet connectivity is required at guard stations; full offline operation is out of scope for v1. |
| C-03 | Resident accounts are created or imported only by the administrator; self-registration is not permitted. |
| C-04 | The system SHALL run on Vercel (compute) and Neon PostgreSQL (database) for v1. |
| C-05 | All pages and API responses SHALL be served over HTTPS. |
| C-06 | The application SHALL be built with Next.js 15, React 19, Prisma ORM, and TypeScript. |

### 6.2 Assumptions

| # | Assumption |
| --- | --- |
| A-01 | Each gate station has a reliable internet-enabled device (tablet, phone, or desktop). |
| A-02 | BSG can supply the existing resident database in Excel or CSV format for import. |
| A-03 | Residents have a valid email address and can access the web application on a personal device. |
| A-04 | The 441 CIS Unit will designate at least one person as system administrator before go-live. |
| A-05 | Visitor photographs are uploaded from the resident's own device (camera or gallery). The system does not operate a centralised camera or scanning station. |
| A-06 | Group/bulk permits (e.g., for events) are deferred to a future version. |
| A-07 | A single permit covers a single visitor for a single visit window. |

---

## 7. Version 1 Scope & Future Roadmap

### 7.1 Version 1 — Essential Features

| Area | Feature | Included in V1 |
| --- | --- | --- |
| Resident | Login & session | Yes |
| Resident | Create visitor permit | Yes |
| Resident | Auto-approval & QR/permit number generation | Yes |
| Resident | View & cancel permits | Yes |
| Resident | Real-time visitor status | Yes |
| Resident | In-app arrival notification | Yes |
| Guard | Secure login & gate assignment | Yes |
| Guard | QR code scan | Yes |
| Guard | Manual permit number search | Yes |
| Guard | Visitor name / resident search | Yes |
| Guard | Grant entry / deny entry with reason | Yes |
| Guard | Record visitor exit | Yes |
| Guard | Today's gate activity dashboard | Yes |
| Admin | Resident creation & CSV/Excel bulk import | Yes |
| Admin | Guard & gate management | Yes |
| Admin | Permit monitoring & visitor search | Yes |
| Admin | Entry/exit history & audit logs | Yes |
| Admin | Configurable data-retention period | Yes |
| Admin | Permit rule configuration (free threshold & charges) | Yes |
| Notifications | In-app + Web Push (PWA) | Yes |
| Notifications | Email / SMS / WhatsApp | No (future) |
| Permits | Visitor photo on permit (resident-uploaded) | Yes |
| Permits | Rule-based STANDARD / EXTENDED classification | Yes |
| Permits | Group / bulk permits | No (future) |
| Permits | Recurring visitor permits | No (future) |
| Auth | Service Number or email login | Yes |
| Auth | Forced password change on first login | Yes |
| Auth | PERSONNEL / CIVILIAN resident sub-types | Yes |
| PWA | Installable Progressive Web App | Yes |

### 7.2 Future Roadmap

| Priority | Feature |
| --- | --- |
| High | Email notifications on visitor arrival |
| High | WhatsApp / SMS notifications |
| High | Online payment processing for EXTENDED permit charges |
| Medium | Bulk / group permit creation (event support) |
| Medium | Recurring visitor permits (domestic staff, regular contractors) |
| Medium | Blacklist / watchlist management |
| Medium | Advanced analytics and base-wide reporting |
| Medium | Offline mode for guard stations (service worker caching) |
| Low | Vehicle registration / plate recognition |
| Low | Staff and vendor permit types |
| Low | Delivery management module |
| Low | Native Android / iOS mobile application |
| Low | CCTV integration |
| Low | Biometric system integration |

---

## 8. Appendix — Complete End-to-End User Journey

This example is taken directly from the stakeholder brief and illustrates the intended system behaviour.

**Scenario:** Mrs. Adeola (Block C, Flat 18) expects a visitor on 25 September 2026.

---

**Step 1 — Resident creates the permit**

Mrs. Adeola logs in and completes the permit form:

| Field | Value |
| --- | --- |
| Visitor | John Okafor |
| Phone | 080XXXXXXXX |
| Purpose | Personal Visit |
| Date | 25 September 2026 |
| Time window | 14:00 – 17:00 |
| Vehicle | ABC 123 XY |

System response:

> **PERMIT APPROVED**
> Permit No: `EST-250926-8F73A`
> QR code generated.

Mrs. Adeola shares the QR code or permit number with John.

---

**Step 2 — Visitor arrives at the gate**

John arrives at Main Gate at 14:32. The guard opens the system and scans John's QR code (or searches for the permit number).

System displays:

> 🟢 **VALID PERMIT**
> John Okafor
> Visiting: Mrs. Adeola · Block C, Flat 18
> Purpose: Personal Visit
> Valid: 14:00 – 17:00

Guard verifies the visitor and clicks **GRANT ENTRY**.

System records:

| Field | Value |
| --- | --- |
| Entered | 14:32 |
| Gate | Main Gate |
| Guard | Guard Account 004 |
| Vehicle | ABC 123 XY |

---

**Step 3 — Resident receives notification**

Mrs. Adeola's in-app notification:

> John Okafor has arrived at the Main Gate at 14:32.
> Permit: EST-250926-8F73A

---

**Key principle (from stakeholder brief):**

> *Simple for the resident. Fast for the guard. Controlled by the administrator. Secure for the estate. Affordable to start. Scalable for future use.*

The resident SHALL create a permit in under 1 minute. The guard SHALL verify and admit a visitor in a few seconds.
