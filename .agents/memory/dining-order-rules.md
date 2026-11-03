---
name: BeatTheLine dining rules
description: Product constraints for student pickup ordering.
---

Checkout collects the student's name and a mock payment-method choice; no payment is charged. Flex and Campus balances are unlimited in this demo. Meal swipes are AED 33.60 each, can only be used whole, and any unused value is discarded. NetID is a visual sign-in preview only: do not collect credentials or claim an account is linked until official university SSO is configured. Pickup times run every 10 minutes from 11:30 AM through 1:30 PM, with a maximum of five orders per slot.

The prototype staff queue has no staff allow-list or role approval. Any signed-in account can view and update orders, and development demo access accepts any non-empty email/password without checking or sending credentials. The demo bypass is permitted only when the API runs in development mode; production must continue requiring Clerk sign-in. Preview access can expose order details, so use test data only.

**Why:** These are user-stated dining rules. The user requested theoretical payment and NetID previews without campus connections, chose open-to-signed-in staff access, and approved a development-only demo sign-in.

**How to apply:** Keep payment, NetID, and demo staff access clearly labeled as prototypes until official integrations and staff roles are configured. Never collect NetID credentials or send demo passwords. Preserve whole-swipe denomination and pickup capacity rules. Do not enable demo access in production or use real student data in the preview.
