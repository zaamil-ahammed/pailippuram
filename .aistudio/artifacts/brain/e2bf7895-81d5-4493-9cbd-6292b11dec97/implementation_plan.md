# Implementation Plan - Victory Club NFC Digital Profile & Linktree Contact System

A dedicated, high-speed, mobile-first NFC contact card and Linktree-style profile system for Victory Club committee leaders and members at `/victory/member/[id]`. Designed for instant tap-and-save interactions during physical events, meetings, and networking.

---

## User Review Required

> [!IMPORTANT]
> The following parameters were confirmed through your requirements and are locked into this plan:
> - **URL Structure**: `/victory/member/[id]` (e.g. `/victory/member/c1` or `/victory/member/m1`).
> - **Target Audience**: All registered committee leaders and general club members managed via the Admin Panel.
> - **Primary Actions**:
>   1. **Save Contact** button: Downloads an RFC 2426 compliant `.vcf` (vCard) file directly to the device contacts.
>   2. **Instant Contact Buttons**: One-tap WhatsApp chat initiation and native phone call trigger.
>   3. **Social & Web Links**: Instagram handle, official club website, and personal portfolios.
>   4. **In-Person QR Code**: Modal popup with an instant SVG QR code for attendees without NFC support.
>   5. **Emergency & Identity Badge**: Blood group pill and location/residence for volunteer safety & coordination.

---

## 1. Overview & Core Concept

When an NFC card or badge is tapped against a smartphone, it immediately loads the member's dedicated profile:
- **Instant Recognition**: Displays the member's official portrait, gold verification badge, primary title, Malay title (`role_ml`), and wing (e.g. *Central Committee*, *GCC Wing*, *Youth Wing*).
- **One-Tap Contact Sync**: A prominent gold CTA lets guests save the full contact details (name, title, organization "Victory Club", phone number, photo, note) directly to their iOS Contacts or Google Contacts via vCard.
- **Fast Action Hub**: Large touch-friendly tiles (48px+ touch targets) for direct WhatsApp messages, direct phone calls, Instagram, and web links.
- **Offline & Low-Connectivity Resilient**: Server-rendered with fast fallback so the NFC card never shows a blank loading screen, even on slow mobile cellular networks.

---

## 2. User Experience & Visual Design

### 2.1 Theme & Aesthetic
- Consistent with the Victory Club dark luxury brand: `#0B0F17` (Deep Obsidian background), `#D4AF37` / `#F59E0B` (Metallic Gold accents), crisp white typography, and subtle glassmorphic container cards (`rgba(255, 255, 255, 0.04)`).
- Golden gradient avatar halo with official club emblem watermark.

### 2.2 Layout Structure (`/victory/member/[id]`)
1. **Top Nav Utility**:
   - Small club emblem linking to `/victory`.
   - "Share Card" button opening an interactive QR Code & direct copy-link sheet.
2. **Hero Header**:
   - High-resolution circular member portrait with fallback monogram avatar.
   - Name in prominent bold typography (`text-2xl font-bold`).
   - Official Role pill with gold border (`bg-amber-500/10 text-amber-300 border-amber-500/30`).
   - Malay Role subtitle (e.g., *Presiden*, *Setiausaha Agung*).
   - Wing / Portfolio indicator (e.g., *GCC Wing · UAE Coordinator*).
3. **Emergency & Vital Details Bar**:
   - Compact luxury badge containing: **Blood Group** (e.g., `O+`, `B+`, `A+`) and **Base Location** (e.g., `Dubai, UAE` or `Calicut, India`).
4. **Primary Action**:
   - **"Save to Contacts" (Download vCard)**: Full-width gold gradient button (`bg-gradient-to-r from-amber-500 to-yellow-600 text-black font-semibold shadow-lg shadow-amber-500/20 active:scale-95`).
5. **Interactive Quick Actions Grid**:
   - **WhatsApp**: Tap to open `https://wa.me/[phone]?text=Hi%20[Name],%20connected%20via%20Victory%20NFC`.
   - **Call Now**: Direct `tel:[phone]` link.
   - **Instagram**: One-tap profile open.
   - **Club Portal**: Direct link to `/victory`.
6. **QR Code Modal**:
   - High-contrast, clean QR code rendered client-side representing the exact current URL, with "Scan to Open Profile" or "Copy Link" buttons.

---

## 3. Key Product Decisions & Trade-offs

| Decision | Selection | Rationale |
|---|---|---|
| **Route Path** | `/victory/member/[id]` | Short, memorable, NFC-chip friendly, and avoids conflicts with admin or authentication routes. |
| **Data Provider** | Unified API (`/api/admin/records?table=victory_members`) + fallback list | Allows immediate loading from cached memory/Supabase while ensuring fallback profiles for hardcoded committee records if DB connection drops. |
| **vCard Format** | RFC 2426 vCard 3.0 Blob | Compatible across both Apple iOS (Safari opens contact sheet automatically) and Android (Contacts app imports immediately). |
| **QR Code Generation** | Pure SVG / lightweight canvas | No external tracking services or network dependencies; generates instantly offline on device. |
| **Discovery** | Links from `/victory` roster cards | Every committee card on `/victory` will have a clickable link to their NFC profile, turning the main victory directory into a public index. |
| **Admin Integration** | Direct "NFC Link" & "View Card" button in `/admin/victory` | Allows club managers to preview any member's card, copy the NFC URL to write onto physical tags, and inspect their QR code. |

---

## 4. Technical Architecture & Data Strategy

```
[Physical NFC Tag Tap]
          │
          ▼
GET /victory/member/[id]
          │
          ├──> 1. Next.js Dynamic App Router (`app/victory/member/[id]/page.js`)
          │
          ├──> 2. Fetch member data from `/api/admin/records?table=victory_members`
          │       (Matches either UUID or legacy ID like 'c1', 'm1', etc.)
          │
          ├──> 3. Render Linktree-Style Mobile View:
          │       ├── Profile Header (Photo, Name, Roles, Wing)
          │       ├── Emergency Info (Blood Group, Location)
          │       ├── vCard (.vcf) Generator Blob Trigger
          │       ├── Direct Communication Buttons (WhatsApp, Phone, Instagram)
          │       └── Dynamic QR Code Sharing Modal
          │
          └──> 4. Connected to `/victory` directory and `/admin/victory` NFC management
```

### Component Breakdown
1. **`app/victory/member/[id]/page.js`**:
   - Dynamic page component handling data resolution, loading states, 404 member-not-found states, and mobile touch interactions.
   - Client-side helper `generateVCard(member)` producing valid `.vcf` content and invoking download.
2. **`components/victory/NfcQrModal.js`**:
   - Reusable QR dialog with copy-to-clipboard feedback and crisp SVG QR display.
3. **`app/victory/page.js` updates**:
   - Wrap member cards or add a "Digital Card" tap action linking directly to `/victory/member/${member.id}`.
4. **`app/admin/victory/page.js` updates**:
   - Add an NFC Badge column/action with one-click "Copy NFC URL" and "Preview NFC Card".

---

## 5. Step-by-Step Implementation Plan

1. **Member Data Helper**: Ensure the data resolver in `/victory/member/[id]` seamlessly resolves both Supabase dynamic records and the fallback static roster by ID or slug.
2. **Create NFC Profile Page**: Build `app/victory/member/[id]/page.js` adhering to the dark luxury Victory aesthetic with 48px+ touch targets and vCard generator.
3. **Add In-Person QR Code Modal**: Implement interactive QR code rendering for on-the-spot camera scanning.
4. **Link from `/victory`**: Update committee member cards on the public Victory page to link directly to their NFC card page.
5. **Admin Management Updates**: Add NFC URL copy action and direct card launch button to `/admin/victory`.
6. **Build Verification**: Run `compile_applet` and verify zero lint/build errors. Test sample NFC routes (`/victory/member/c1`, `/victory/member/m1`, and dynamic IDs).
