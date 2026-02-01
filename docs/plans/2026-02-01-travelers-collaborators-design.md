# Travelers & Collaborators Feature Design

**Date:** 2026-02-01
**Status:** Approved
**Author:** Claude + User

## Overview

Add the ability to manage travelers (trip members for cost splitting) and collaborators (users with edit access) from the Collaborate page, with optional email invites configurable by the super admin.

## UI Entry Point

The Collaborate page header shows "👥 X travelers" which becomes clickable, opening a popover with two tabs:

- **Travelers tab** - People going on the trip (for cost splitting)
- **Collaborators tab** - Users with trip edit/view access

## Travelers vs Collaborators

| Travelers | Collaborators |
|-----------|---------------|
| People going on the trip | People editing the trip |
| Name + age (no account needed) | Must have account |
| Used for cost splitting | Used for permissions |
| Can include kids | Adults only (account holders) |

## Travelers Management

### UI
- List of travelers with name, age, child badge
- Remove button (X) per traveler
- "Add Traveler" expandable form
- Form fields: Name*, Age*, Email (optional), Phone (optional)
- Auto-detects child status (age < 12)

### Data Storage
Stored in `trips.generated_content.travelers`:
```typescript
interface Traveler {
  id: string;
  name: string;
  age: number;
  isChild: boolean;
  email?: string;
  phone?: string;
}
```

### API
- `POST /api/trips/[id]/travelers` - Add traveler
- `DELETE /api/trips/[id]/travelers?travelerId=xxx` - Remove traveler

## Collaborator Invites

### Invite Flow
```
User clicks "Invite" → Enters email + role (Editor/Viewer)
                              │
                              ▼
                     ┌─────────────────┐
                     │ Email Configured?│
                     └────────┬────────┘
                        Yes   │   No
                    ┌─────────┴─────────┐
                    ▼                   ▼
            Send invite email    Show share link modal
            with magic link      "Copy link to share"
                    │                   │
                    └─────────┬─────────┘
                              ▼
                    Save pending invite to DB
                    (email, role, invite_token, expires_at)
                              │
                              ▼
                    Recipient clicks link
                              │
                              ▼
                     ┌─────────────────┐
                     │ Has account?    │
                     └────────┬────────┘
                        Yes   │   No
                    ┌─────────┴─────────┘
                    ▼                   ▼
              Add to trip        Redirect to signup
              Show trip page     then add to trip
```

### Share Link Format
```
https://yourapp.com/invite/[token]
```
Token expires in 7 days.

### Database Schema
```sql
CREATE TABLE trip_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'viewer',
  token VARCHAR(64) UNIQUE NOT NULL,
  invited_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMP
);
```

### API
- `GET /api/trips/[id]/collaborators` - List collaborators (existing)
- `POST /api/trips/[id]/collaborators` - Add collaborator directly (existing)
- `DELETE /api/trips/[id]/collaborators?userId=xxx` - Remove collaborator (existing)
- `POST /api/trips/[id]/invite` - Create invite (new)
- `GET /api/invite/[token]` - Accept invite page (new)

## Email Configuration (Admin Panel)

### Supported Providers
| Provider | Free Tier | Best For |
|----------|-----------|----------|
| Resend | 100/day | Simple setup, modern API |
| SendGrid | 100/day | Enterprise, high volume |
| AWS SES | 62K/month (if on EC2) | AWS users, cheapest at scale |
| SMTP | Varies | Self-hosted, existing mail server |

### Admin UI
New "Email Configuration" section in Admin Settings:
- Email Provider dropdown (Disabled/Resend/SendGrid/AWS SES/SMTP)
- Provider-specific credential fields
- From Email field
- Test Email button
- Save to `.env`

### Environment Variables
```
EMAIL_PROVIDER=disabled|resend|sendgrid|ses|smtp
EMAIL_API_KEY=xxx (for Resend/SendGrid)
EMAIL_FROM=invites@yourdomain.com
AWS_SES_REGION=us-east-1 (for SES)
SMTP_HOST=smtp.gmail.com (for SMTP)
SMTP_PORT=587
SMTP_USER=xxx
SMTP_PASS=xxx
```

### Email Template
```
Subject: [Name] invited you to collaborate on "[Trip Title]"

Hey!

[Inviter Name] wants you to help plan their trip to [Destination].

[View Trip Button]

You've been invited as an [Role] - you can [role description].

---
Link expires in 7 days
```

## Implementation Plan

### New Files
- `components/collaborate/TravelersCollaboratorsPopover.tsx`
- `app/api/trips/[id]/travelers/route.ts`
- `app/api/trips/[id]/invite/route.ts`
- `app/invite/[token]/page.tsx`
- `lib/email/index.ts` - Email abstraction
- `lib/email/providers/resend.ts`
- `lib/email/providers/sendgrid.ts`
- `lib/email/providers/ses.ts`
- `lib/email/providers/smtp.ts`
- `lib/db/migrations/add_trip_invites.sql`

### Modified Files
- `app/admin/page.tsx` - Add email settings section
- `app/api/admin/settings/route.ts` - Handle email config
- `app/trips/[id]/collaborate/page.tsx` - Add popover trigger

## Success Criteria
- [ ] Travelers can be added/removed from Collaborate page
- [ ] Cost splitting updates when travelers change
- [ ] Collaborators can be invited via link (always works)
- [ ] Collaborators can be invited via email (when configured)
- [ ] Admin can configure email provider in settings
- [ ] Test email button verifies configuration
- [ ] Invite links expire after 7 days
- [ ] New users can accept invite after signup
