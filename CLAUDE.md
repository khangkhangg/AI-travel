# CLAUDE.md - Project Guidelines

## Git Workflow

### Committing and Pushing Code

When pushing to GitHub, use the `khangkhangg` account. The `khang-cognisian` account does NOT have access to this repository.

**Push command (if credential issues occur):**
```bash
TOKEN=$(gh auth token) && git remote set-url origin "https://khangkhangg:${TOKEN}@github.com/khangkhangg/AI-travel.git" && git push
```

**After pushing, clean up the remote URL:**
```bash
git remote set-url origin https://github.com/khangkhangg/AI-travel.git
```

### Git Configuration
- User: `khangkhangg`
- Email: `khangkhangg@users.noreply.github.com`

### Files to Never Commit
- `test-results/` - Playwright test results (gitignored)
- `playwright-report/` - Playwright reports (gitignored)
- `.env` files with secrets

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth
- **Styling:** Tailwind CSS
- **Maps:** Leaflet.js
- **Testing:** Playwright

## Key Directories

- `app/` - Next.js app router pages and API routes
- `components/` - React components
  - `components/curated/` - Curated trip view components
  - `components/collaborate/` - Collaboration/kanban components
- `lib/` - Utilities, database, auth helpers
- `docs/plans/` - Design documents and implementation plans
