# Nammude Pailippuram (നമ്മുടെ പൈലിപ്പുറം)

A free community information website for Pailippuram, Kerala: important contacts, local shops, bus timing, blood
donors, panchayath details and announcements. Visitors can suggest new information or ask for corrections. A small
team of admins reviews, edits and publishes everything.

Built with Next.js (the website), Supabase (database and admin sign-in) and Vercel (hosting).

> Status: written but **not yet built or run**. The tools used to write it could not reach the package registry, so
> `npm install` and `npm run build` have never been run. Do step 5 below first and fix anything it reports.

## How data flows

1. A visitor opens a page. The browser asks Supabase for rows where `status = 'approved'`. Nothing else is readable.
2. A visitor fills in **Share information** or **Request a correction**. It is saved in `submissions` as `pending`.
   Visitors can add to this table but can never read it.
3. An admin signs in and sees the waiting items on the Admin page (removal requests first).
   - **Edit and approve** opens the normal edit form, pre-filled. Saving publishes it as a live item.
   - **Reject**, **Mark handled** or **Decline** closes it.
4. Admins can **edit, hide/show, delete or add** any item in every section (contacts, shops, bus, donors,
   panchayath, announcements). Every action is written to the activity log with the admin's email and what changed.
5. Pages show a "Checked on [date]" line. Items not verified for 90 days appear under **Outdated** for re-checking.

## Who can see or change what

| Data | Visitors | Admins |
| --- | --- | --- |
| Live items (status approved) | read | read, add, edit, hide, delete |
| Hidden items | no access | read, edit, show, delete |
| Submissions (incl. private contact details) | can only add a new one | read, approve, reject |
| Activity log | no access | read, add |
| Admin list | no access | no access from the website (set in Supabase only) |

All of this is enforced by Row Level Security in `supabase/schema.sql`, not just by the pages. A user's data is never
mixed with another user's: there are no visitor accounts, only admins.

## Folders

- `app/` pages. `app/admin/` is the admin area. `app/admin/[section]/` is the list and `[section]/[id]/` the edit form.
- `lib/sections.js` describes every section once. The admin list and the edit form are built from it, so a new field
  is added in one place.
- `components/` shared pieces (menu, page header, listing card, admin guard).
- `supabase/schema.sql` the whole database and its security rules.

## Setup (about an hour, no coding)

1. **Supabase**: create a free project. Open SQL Editor, paste all of `supabase/schema.sql`, run it once.
2. **First admin**: Authentication > Users > Add user (email and password). Copy the UID, then in SQL Editor run
   `insert into admins (user_id) values ('PASTE-UID');`. Add a second admin the same way.
3. **Keys**: Project Settings > API. Copy the Project URL and the **anon public** key.
   Copy `.env.example` to `.env.local` and fill in both. Never use the `service_role` key anywhere.
4. **Logo**: put your logo at `public/logo.png`.
5. **Run it**: `npm install`, then `npm run dev` and open http://localhost:3000. Then `npm run build` to check
   there are no errors.
6. **Publish**: push to GitHub (GitHub Desktop is fine), import the repo on Vercel, add the two variables
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the name goes in the Key box, the value in Value).
7. **Privacy test before launch**: signed out, open the site and confirm hidden items and submissions never appear.
   Sign in as admin and confirm they do.

## Things to know

- **Not 
- **Error tracking**: nothing reports errors yet. Simplest fix: create a free Sentry project for Next.js and run
  `npx @sentry/wizard@latest -i nextjs`.
- **Backups**: the free Supabase plan has none and pauses after about a week of no use. Use Admin > Export a backup weekly.
- **Spam**: only a hidden trap field, length limits and admin review. Add a captcha if spam appears.
- **Legal**: the About and privacy page is draft text. Replace it with reviewed text before launch.
- **Hosting**: Vercel Hobby is for non-commercial use only. The site must stay free of adverts and sponsors.
- **Version control**: this folder is not yet a git repository. Run `git init`, commit, and push to a private GitHub repo.
