# Fingoh Platform — Master Reference Document
**Date:** 25 September 2026  
**Session:** Sep 25 2026 — Product Knowledge Base complete

---

## 1. Platform Overview

**Fingoh** is a B2B trade fair exhibitor intelligence SaaS platform. It helps exhibitors at pharmaceutical and industrial trade fairs identify, enrich, score, and engage their best visitor prospects — before, during, and after the event.

**Three-tier architecture:**
- **Fingoh Admin** — internal platform management
- **Organiser** — event organiser portal (manages exhibitor onboarding, branding)
- **Exhibitors** — the exhibitor-facing app where all lead intelligence happens

---

## 2. Services, URLs, Hosting

| Service | Dev URL | Prod URL | Hosting |
|---|---|---|---|
| Exhibitor Frontend | `exhibitor-dev.fingoh.ai` (Vercel preview) | `exhibitor.fingoh.ai` | Vercel |
| Staff App (PWA) | `staff-dev.fingoh.ai` | `staff.fingoh.ai` | Vercel |
| Backend API | `api-dev.fingoh.ai` | `api.fingoh.ai` | Railway |
| XGBoost Scorer | Modal endpoint | Modal endpoint | Modal |
| Supabase (Dev) | `oalmnxravzpdhlinswfi.supabase.co` | — | Supabase |
| Supabase (Prod) | — | `qftbpixjwkmmusppkhzi.supabase.co` | Supabase |

---

## 3. Repositories & Branch Strategy

| Repo | Purpose | Notes |
|---|---|---|
| `fingoh-exhibitor` | React + Vite exhibitor frontend | Deployed on Vercel |
| `fingoh-exhibitor-backend` | FastAPI backend | Railway; **branch protection on main** — merge PRs manually |
| `fingoh-staff` | Vanilla JS PWA staff app | Vercel; **always edit `public/` only** |
| `fingoh-organiser` | Organiser portal | Separate deploy |
| `fingoh-admin` | Admin panel | Separate deploy |
| `xgboost-scorer` | Modal pharma scorer | Python, deployed via `modal deploy` |
| `client-base` | Client instance base branch | Branches from `main`; one per client |
| `client-acg` | ACG client instance | Branches from `client-base` |

**Client Instance Flow:** `main → client-base → client-{name}`  
Each client gets its own Supabase project.

---

## 4. Dev Workflow & Test Accounts

- Backend changes: push to feature branch → PR → **manually merge on GitHub** (branch protection)
- Railway auto-deploys from `main` after merge
- Vercel auto-deploys from `main` (exhibitor + staff)
- Test organiser account: use dev Supabase
- Test exhibitor account: registered under dev event

---

## 5. Backend Routers (FastAPI)

| Router | File | Key Endpoints |
|---|---|---|
| Audience / Visitors | `routers/audience.py` | `POST /audience/enrich`, `GET /audience/visitors`, meeting match |
| Products | `routers/products.py` | `POST /products/extract-from-brochure`, `GET /products/intelligence/{event_id}`, `PATCH /products/intelligence/{id}/pin`, `DELETE /products/brochures/{brochure_id}` |
| Events | `routers/events.py` | event CRUD, public lookup |
| Offerings | `routers/offerings.py` | exhibitor product/service offerings |
| Auth | `routers/auth.py` | JWT, Supabase auth |

---

## 6. Critical Rules — Never Forget

### ⚠️ `iei_tier` is a GENERATED COLUMN
- Table: `individual_exhibitor_intelligence` (or wherever `iei_tier` appears)
- **Never include `iei_tier` in UPDATE or PATCH calls**
- Error if included: PostgreSQL error 428C9 "Column is a generated column"

### ⚠️ Staff App: Always Edit `public/` Directory
- Vercel serves only `public/` for the staff app
- Root-level files (`index.html`, `sw.js` at root) are **NOT served**
- Always edit: `fingoh-staff/public/index.html`, `fingoh-staff/public/sw.js`, etc.

### ⚠️ Branch Protection on `fingoh-exhibitor-backend`
- `main` branch is protected — **cannot push directly**
- Always: create feature branch → PR → merge manually on GitHub UI

### ⚠️ iOS Service Worker: Never Clone POST Requests
- Cloning a POST request loses the method (becomes GET)
- In `sw.js`: pass POST requests directly to fetch, never `request.clone()` for POST

### ⚠️ iOS `navigator.onLine` Unreliable
- In iOS Safari airplane mode, `navigator.onLine` may return `true`
- Always use `try/catch` on fetch calls; treat any network error as offline

### ⚠️ Vercel 4.5MB Body Limit
- Vercel serverless functions cap request body at ~4.5MB
- Large file uploads (PDF brochures) must go **directly to Railway backend**
- Frontend detects hostname and posts to `api.fingoh.ai` or `api-dev.fingoh.ai` directly (not through Vercel proxy)

### ⚠️ CORS for Vercel Preview URLs
- `main.py` CORSMiddleware must include:
  ```python
  allow_origin_regex=r"https://.*\.vercel\.app"
  ```
- This covers all Vercel preview deployment URLs (random subdomain)

---

## 7. Product Knowledge Base (Sep 25 — NEW FEATURE)

### Overview
Exhibitors can upload PDF brochures → Claude extracts product intelligence → stored in DB → injected into visitor enrichment prompts for smarter ICP matching.

### New Tables (applied dev + prod Sep 25)

```sql
CREATE TABLE brochure_uploads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL,
  org_id uuid NOT NULL,
  file_name text,
  storage_path text,
  extraction_status text DEFAULT 'processing',
  product_count int,
  token_count int,
  document_summary text,
  document_type text DEFAULT 'product_catalog',
  key_facts jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  extracted_at timestamptz
);

CREATE TABLE product_intelligence (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  brochure_id uuid REFERENCES brochure_uploads(id) ON DELETE CASCADE,
  event_id uuid NOT NULL,
  org_id uuid NOT NULL,
  name text,
  type text,
  short_description text,
  full_description text,
  features jsonb,
  benefits jsonb,
  applications jsonb,
  technical_specs jsonb,
  target_customers jsonb,
  certifications jsonb,
  keywords jsonb,
  category_master jsonb,
  confidence float,
  is_pinned boolean DEFAULT false,
  display_order int
);
```

### New Endpoints (`routers/products.py`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/products/extract-from-brochure` | Multipart PDF → Claude → DB |
| GET | `/products/intelligence/{event_id}` | All extracted products for event |
| PATCH | `/products/intelligence/{id}/pin` | Pin/unpin product (max 5 pinned) |
| GET | `/products/brochures/{event_id}` | All uploaded docs with summaries |
| DELETE | `/products/brochures/{brochure_id}` | Delete doc + cascade delete products |

### Claude Extraction

- Model: `claude-opus-4-5`
- max_tokens: `16000`
- String caps in prompt: `short_description` ≤ 120 chars, `full_description` limited
- `document_summary` format: `"N products extracted: name1, name2 +N more"`
- Strip markdown fences before JSON parse:
  ```python
  text = re.sub(r'^```json\s*', '', text)
  text = re.sub(r'^```\s*', '', text)
  text = re.sub(r'\s*```$', '', text).strip()
  ```

### Enrichment Integration (`audience.py`)

- `_get_event_context()` fetches top 20 products from `product_intelligence`
- Injects "Exhibitor Product Intelligence" block into Claude enrichment prompt
- Block includes: name, description, features, benefits, applications, categories per product

### Frontend UI (`App.jsx` — Products & Services section)

Two tabs:
- **`📌 Registration (X/5)`** — pinned offerings for visitor registration; max 5; always shows "📄 Extract from brochure" button
- **`✦ Knowledge Base (N)`** — sub-views:
  - **Documents** — uploaded PDFs with summary, key_facts chips, Delete button
  - **Products** — all extracted products with pin/unpin toggle, features/benefits chips

Upload flow:
1. User selects PDF → reads as FormData
2. POST directly to `api.fingoh.ai` or `api-dev.fingoh.ai` (detected by hostname)
3. Purple preview panel shows extracted products
4. User selects which to pin → creates `event_offerings`

---

## 8. Enrichment Pipeline

1. Visitor scans badge (staff app) or registers (organiser portal)
2. Backend `POST /audience/enrich` called
3. `_get_event_context()` loads: event info + **top 20 pinned/ranked products** from `product_intelligence`
4. Claude (`claude-opus-4-5`, max_tokens 16000) enriches contact with ICP analysis
5. Junk filter: skips students, personal emails, missing company
6. Result stored in `individual_exhibitor_intelligence` table
7. XGBoost pharma scorer v4 runs scoring (Modal endpoint)

---

## 9. XGBoost Pharma Scorer v4

- **File:** `xgboost-scorer/scorer_app_pharma.py`
- **Hosted:** Modal (serverless GPU endpoint)
- **Features:** 47 signals + 47 presence flags = 94 features
- **Tier thresholds:** T1 ≥ 53 | T2 ≥ 43 | T3 ≥ 36
- **R²:** 0.886
- **Key signals:** regulatory maturity (COUNTRY_REG dict), proc_mandate, company_type_match, sourcing_specificity, meeting_interest, icp_fit from Claude enrichment
- **8,000 pharma dataset upload:** pending — cost ~$64-72, needs explicit confirmation

---

## 10. Meeting Match Formula (5-Dimension Bilateral Scoring)

```
MatchScore(v,e) = w1×intent_alignment(v,e) 
               + w2×icp_fit(v,e) 
               + w3×tier_correlation(v,e) 
               + w4×timing_fit(v,e) 
               + w5×prior_engagement(v,e)

Weights: w = [0.35, 0.25, 0.20, 0.12, 0.08]
```

| Dimension | Weight | Key Signals |
|---|---|---|
| Intent Alignment | 35% | sourcing keywords, meeting_interest, proc_mandate, category match |
| ICP Bilateral Fit | 25% | role_score, size_score, icp_fit from Claude |
| Tier Correlation | 20% | T1=1.0, T2=0.75, T3=0.40, T4=0.15; halved for unenriched |
| Timing Alignment | 12% | timeline_raw keywords, buying_cycle_stage |
| Prior Engagement | 8% | microsite, email_click, content_dl, prev_hist, repeat_buyer |

**Hard caps:** T4 ≤ 35 | unenriched ≤ 55

---

## 11. Staff App (PWA)

- **Tech:** Vanilla JS, service worker for offline
- **Repo:** `fingoh-staff/public/` — **always edit public/ only**
- **Key file:** `public/sw.js`
- **Offline strategy:** SW intercepts all API/Supabase/Railway/Modal calls → network first → on failure enqueue signal + show "Saved offline" UI
- **POST rule:** never clone POST requests in SW (loses method) — pass directly
- **Airplane mode rule:** never rely on `navigator.onLine` — always try/catch

---

## 12. Vercel Configuration

- **Exhibitor frontend:** `fingoh-exhibitor` → `exhibitor.fingoh.ai`
- **Staff app:** `fingoh-staff` → `staff.fingoh.ai`; serves only `public/`
- **Body limit:** 4.5MB — large uploads must bypass Vercel and go to Railway directly
- **Preview URLs:** `https://<random>.vercel.app` — covered by CORS regex in Railway backend

---

## 13. Supabase Schema (Key Tables)

| Table | Purpose |
|---|---|
| `events` | Trade fair events |
| `organisations` | Exhibitor organisations |
| `event_participants` | Visitors/contacts at events |
| `individual_exhibitor_intelligence` | Enriched visitor records (has `iei_tier` generated column) |
| `event_offerings` | Exhibitor products/services (pinned offerings shown to visitors) |
| `brochure_uploads` | PDF brochure upload records (NEW Sep 25) |
| `product_intelligence` | Extracted product records from brochures (NEW Sep 25) |
| `meeting_requests` | Visitor-exhibitor meeting requests |
| `badge_scans` | Staff badge scan records |

---

## 14. Common Debugging

| Error | Cause | Fix |
|---|---|---|
| `428C9` | `iei_tier` in UPDATE payload | Remove `iei_tier` from all UPDATE calls |
| `413 Content Too Large` | PDF upload through Vercel proxy | Upload directly to Railway URL |
| CORS error on preview URL | Vercel preview subdomain not in allowlist | Add `allow_origin_regex` to CORSMiddleware |
| `Could not parse Claude response` | Claude wraps JSON in markdown fences | Strip ` ```json ``` ` before parse |
| JSON truncation mid-response | `full_description` too verbose | Cap string lengths in prompt; increase max_tokens |
| iOS save failed | `navigator.onLine` unreliable | Use try/catch on all fetches |
| POST becomes GET in SW | `request.clone()` loses method | Pass POST request directly, no clone |
| `state.visitors.filter is not a function` | Filter called before load | Fix initialization order |
| Railway healthcheck failure | Transient deploy issue | Retry deploy |

---

## 15. Development History

| Date | Milestone |
|---|---|
| Aug 26 | DB schema documented (27 tables); `iei_tier` generated column discovered |
| Aug 28 | Meeting Match 5-dimension bilateral scoring implemented |
| Aug 31 | Staff app full offline PWA; iOS airplane mode fix; SW POST clone bug fixed |
| Sep 1-10 | Client-base branch strategy; ACG client instance setup |
| Sep 11-20 | XGBoost pharma scorer v4 (94 features, R²=0.886) trained + deployed on Modal |
| Sep 24 | CORS regex for Vercel preview URLs; 413 body limit fix (direct Railway upload) |
| Sep 25 | **Product Knowledge Base complete:** brochure upload → Claude extraction → DB → enrichment injection → UI with Documents + Products + pin/unpin. 29 products extracted from Fabtech brochure on prod. |

---

## 16. Next Session Priorities

1. **Agent tab real data wiring** — replace hardcoded demo data with real contact/signal data
2. **Deep IEI loading UI + cancel button** — UX for long enrichment jobs
3. **8,000 pharma dataset upload** — confirm cost (~$64-72) before running
4. **Zoho chatbot integration**
5. **ACG development** — start in separate chat with `ACG_CONTRIBUTING.md` as context
6. **Voice transcription** — Whisper/Deepgram for offline audio on staff app

---

*Generated: 25 Sep 2026 | Fingoh Platform Master Reference*
