# Profile Photos for Workers and Panchayath Representatives

Add profile photo support for individuals in the **Native Workers** and **Gramapanchayath** directories, allowing residents and administrators to add photos via direct file upload (with automatic compression and instant preview) or direct image URL, while gracefully falling back to trade/role category icons when no photo is provided.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following key decisions were confirmed during the interactive interview:
> - **Target Directories**: Photos are enabled exclusively for people-oriented sections: **Native Workers** (`/workers`) and **Panchayath Representatives** (`/panchayath`). Other directories (Shops, Donors, Bus timings) continue with their clean category emblems.
> - **Input Methods**: Dual-mode input supporting both **direct local file upload** (with automatic client-side resizing and base64 compression) and **direct web image URL input**.
> - **Fallback Experience**: Profiles without photos display a distinctive **trade or role category icon** inside a softly tinted rounded badge matching the village design system.

---

### 1. Overview & Core Concept

- **What It Does**: Enables individual workers (electricians, plumbers, carpenters, masons, painters) and Gramapanchayath officials (President, Secretary, Ward Members) to feature profile headshots on their directory listing cards. 
- **Target Audience / Persona**: Local Pailippuram residents looking for trustworthy, identifiable village service providers and local governance representatives.
- **Key Value**: Builds community trust and immediate recognition by attaching real local faces to names, contact numbers, and service designations, while ensuring zero broken images or empty voids.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Public Directory Browsing (`/workers` and `/panchayath`)**:
   - Visitors browse worker cards or panchayath representative listings.
   - Each card prominently displays an 80×80px rounded avatar (`rounded-2xl`, subtle 1.5px border, object-cover).
   - If a photo exists, the person's real portrait is shown with full touch-to-view clarity.
   - If no photo exists, an elegant category-tinted badge with the specific trade/role SVG icon (e.g. wrench for plumber, lightning bolt for electrician, emblem for panchayath president) is displayed.
2. **Citizen Submission (`/share?type=worker`)**:
   - Citizens registering themselves or local workers see an optional **"Profile Photo / ഫോട്ടോ"** field.
   - They can drag-and-drop or select an image file from camera/gallery, or paste a link.
   - An instant thumbnail preview with a "Remove" button appears before submission.
3. **Admin Management (`/admin/workers/[id]` & `/admin/panchayath/[id]`)**:
   - Admins can view current photos, upload replacement images directly, paste image URLs, or clear photos with instant feedback.

#### Visual Identity & Theme
- **Avatar Geometry**: $80 \times 80\text{px}$ on desktop/tablet, $72 \times 72\text{px}$ on compact mobile viewports, with `rounded-2xl` ($16\text{px}$) curvature to match the app's established card curvature ($22\text{px}$ outer $- 6\text{px}$ inset $= 16\text{px}$ inner radius).
- **Surface & Border**: `1.5px solid var(--card-border)` with subtle shadow (`0 2px 8px rgba(15, 23, 42, 0.04)`).
- **Fallback Icon Badges**: Tinted according to the trade/section:
  - *Electrician / Technical*: Soft amber (`#fffbeb`, amber icon)
  - *Plumber / Water*: Soft blue (`#eff6ff`, royal blue icon)
  - *Carpenter / Builder*: Soft warm stone (`#fef3c7`, warm brown icon)
  - *Panchayath Leaders*: Deep navy tint (`#eff6ff`, midnight navy emblem)
- **Zero-Pill Discipline**: Contact details and ward metadata remain unboxed clean text separated by typographic middots (`·`).

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Direct File Upload via Client-Side Canvas Compression**
  - *Chosen Approach*: Files uploaded by users/admins are converted and downscaled on the client using an HTML5 Canvas helper to standard web dimensions ($320 \times 320\text{px}$ WebP/JPEG, quality 0.85, $\le 60\text{KB}$ Data URI) and stored directly in the listing record.
  - *Why*: Eliminates dependencies on external S3/Supabase storage buckets that may not be provisioned in hermetic or mock preview environments, ensuring 100% reliable local preview and zero broken image links.
  - *Alternatives Considered*: External image hosting services (risk of CORS, expired tokens, or sandbox network blocking).
- **Decision 2: Trade & Role Icon Fallbacks**
  - *Chosen Approach*: Dedicated trade-aware SVG icons rather than generic person silhouettes or empty placeholders.
  - *Why*: Directly honors the user's clarified preference and ensures listings without photos remain informative, visual, and vibrant.
- **Decision 3: Reusable Image Upload & Preview Component**
  - *Chosen Approach*: Create a shared `ImageUploadField` component used across both the public submission form (`/share`) and the admin edit forms (`/admin/[section]/[id]`).
  - *Why*: Guarantees consistent validation (file size caps, image aspect ratio, format support) and unified preview styling.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          User Interface                                │
│                                                                        │
│   ┌────────────────────────┐            ┌──────────────────────────┐   │
│   │   /workers &           │            │   /share & /admin/       │   │
│   │   /panchayath          │            │   [section]/[id]         │   │
│   └───────────┬────────────┘            └────────────┬─────────────┘   │
│               │                                      │                 │
│               ▼                                      ▼                 │
│   ┌────────────────────────┐            ┌──────────────────────────┐   │
│   │ PersonAvatar Component │            │    ImageUploadField      │   │
│   │ (Photo / Trade Icon)   │            │  (Camera/File/URL/Canvas)│   │
│   └───────────┬────────────┘            └────────────┬─────────────┘   │
└───────────────┼──────────────────────────────────────┼─────────────────┘
                │                                      │
                ▼                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Data Layer & State                              │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │  listings (kind='worker') & panchayath_items (section='bearer' │   │
│   │  or 'ward'): fields include photo_url / image_data             │   │
│   ├────────────────────────────────────────────────────────────────┤   │
│   │  lib/supabase.js (In-Memory Database & Seed Data with Photos)  │   │
│   │  lib/sections.js (Admin schemas with image upload field type)  │   │
│   │  lib/submit.js & app/api/submissions (Persist photo payload)   │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

#### Data Model & Schema Updates
1. **`listings` Table**:
   - Add `photo_url` (`text`, nullable) to worker records.
   - Seed sample worker records with representative local photos.
2. **`panchayath_items` Table**:
   - Add `photo_url` (`text`, nullable) for office bearers and ward members.
   - Seed sample panchayath leadership listings with representative portraits.
3. **`submissions` Table**:
   - Include `photo_url` in citizen worker submissions.

#### Components to Implement / Update
- **`components/PersonAvatar.js`**: Reusable avatar component handling photo display with error fallbacks and trade-specific icon defaults.
- **`components/ImageUploadField.js`**: Interactive file selector + camera trigger + URL input with live square crop preview.
- **`components/ListingCard.js`**: Layout update to render the person avatar alongside title, trade, area, and action buttons.
- **`app/panchayath/page.js`**: Layout update for bearers and ward members to showcase their photos alongside designation and contact.
- **`lib/sections.js`**: Add `{ name: 'photo_url', label: 'Profile Photo', type: 'image' }` to worker and panchayath field definitions.
- **`app/share/page.js`**: Integrate photo selection into the worker share form.
