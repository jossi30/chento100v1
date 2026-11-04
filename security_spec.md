# Security Specification & Test-Driven Hardening

## 1. Data Invariants
1. **Default Deny**: Any operation on an unspecified path or without proper authorization is denied.
2. **Identity Integrity**: `userRef` in a newly created listing must equal `request.auth.uid`. A non-admin cannot forge listings under another user's identity.
3. **Role Protection**: Standard users cannot elevate privileges to `role: "admin"` or set `isAdmin: true` on user profiles. Only administrators or server-side authenticators can grant administrative status.
4. **Moderation Integrity**: Standard users cannot unilaterally approve their own listings (`isApproved: true`, `status: "approved"`). Listings submitted by standard users remain `pending` until approved by an administrator.
5. **Path Hardening**: Path variables `{listingId}` and `{userId}` must conform to safe alphanumeric/dash/underscore identifiers with length `<= 128`.
6. **Immutable Fields**: `createdAt` and `userRef` cannot be modified after initial creation.
7. **Size & Type Limits**: Strings must adhere to length constraints defined in `firebase-blueprint.json` (e.g. title `<= 200`, description `<= 5000`).

## 2. The "Dirty Dozen" Payloads

1. **Malicious Admin Escalation on User Creation**:
   `{ "username": "attacker", "email": "attacker@evil.com", "isAdmin": true, "role": "admin" }` -> Must be REJECTED.
2. **Impersonated Listing Creation (Spoofed userRef)**:
   `{ "title": "Phishing Villa", "category": "guesthouse", "userRef": "victim_user_123" }` -> Must be REJECTED when auth.uid is "attacker_999".
3. **Auto-Approval Bypass on Creation**:
   `{ "title": "Unvetted Suite", "category": "guesthouse", "userRef": "attacker_999", "isApproved": true, "status": "approved" }` by normal user -> Must be REJECTED.
4. **Oversized String Payload (Denial of Wallet Attack)**:
   `{ "title": "A".repeat(10000), "category": "guesthouse" }` -> Must be REJECTED.
5. **Ghost Field Injection (Shadow Update)**:
   `{ "ghostField": "maliciousValue", "active": true }` -> Must be REJECTED.
6. **Path Injection / Junk ID**:
   Operation targeting path `/listings/../../dangerousPath` or 1KB junk characters -> Must be REJECTED by `isValidId()`.
7. **Tampering with Immutable Creation Time**:
   Update attempting `{ "createdAt": "1999-01-01T00:00:00.000Z" }` -> Must be REJECTED.
8. **Unauthorized State Transition to Approved**:
   Regular user attempting update `{ "status": "approved", "isApproved": true }` -> Must be REJECTED.
9. **Stealing / Reassigning Listing Ownership**:
   Regular user attempting update `{ "userRef": "new_owner_456" }` -> Must be REJECTED.
10. **Deleting Other User's Listing**:
    User A attempting to delete listing belonging to User B -> Must be REJECTED unless user is admin.
11. **Negative / NaN Price Attack**:
    `{ "title": "Free Suite", "regularPrice": -500, "category": "guesthouse" }` -> Must be REJECTED.
12. **PII Exposure in Public List**:
    Unauthenticated user attempting broad sweep of private user profiles -> Must be REJECTED.

## 3. Test Runner (firestore.rules.test.ts)
```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

describe('Firestore Security Rules - Dirty Dozen Validation', () => {
  let testEnv: any;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'chento100-1acd8',
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  test('Reject self-granted admin privilege', async () => {
    const unauthDb = testEnv.authenticatedContext('user_123');
    await assertFails(
      unauthDb.firestore().collection('users').doc('user_123').set({
        username: 'attacker',
        email: 'attacker@evil.com',
        isAdmin: true,
        role: 'admin',
      })
    );
  });

  test('Reject spoofed userRef in listing creation', async () => {
    const authDb = testEnv.authenticatedContext('user_123');
    await assertFails(
      authDb.firestore().collection('listings').doc('listing_spoofed').set({
        title: 'Spoofed Listing',
        description: 'Test',
        category: 'guesthouse',
        userRef: 'victim_user_999',
        regularPrice: 100,
        isApproved: false,
        status: 'pending',
      })
    );
  });
});
```
