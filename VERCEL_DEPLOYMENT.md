# Deploying the client, admin, and API services on Vercel

Deploy three Vercel projects connected to the same Git repository:

1. Import the repository and set **Root Directory** to `client`.
2. Import the repository a second time and set **Root Directory** to `admin-app`.
3. Import the repository a third time and set **Root Directory** to `api`. Use Vercel's **Other** preset, leave the build/output directory blank, and let Vercel install dependencies from `api/package.json`. The API function entry point is `api/[...route].js` relative to this project root.
4. For the client and admin projects, use the Vite framework preset, `npm run build` as the build command, and `dist` as the output directory. Both apps include their own `vercel.json` for client-side route fallback.
5. In the API project's Production, Preview, and Development environments, configure:
   - `FIREBASE_SERVICE_ACCOUNT_JSON`: the Firebase service-account JSON for the same project used by the frontends. Store it as a secret; do not commit it.
   - `FIREBASE_PROJECT_ID`: the Firebase project ID, if it cannot be inferred from the service account.
   - `FIRESTORE_DATABASE_ID`: the named Firestore database ID used by the frontends.
   - `ADMIN_EMAILS`: comma-separated bootstrap admin email addresses.
   - `CORS_ORIGINS`: exact public origins of both deployed sites, comma-separated. Include preview origins if preview deployments need API access.
6. Add `VITE_API_URL` to both frontend projects in Production, Preview, and Development. Set it to the API project's origin, for example `https://api.example.com` (no trailing slash).
7. On the client project, add `VITE_ADMIN_URL` to Production, Preview, and Development. Set it to the admin site's origin, for example `https://admin.example.com` (no trailing slash).
8. Deploy the API and both frontends. Verify `https://<api-origin>/api/health` reports `status: "ok"` and `database: "firestore"` before testing login, partner listing submissions, admin approval, and availability requests.

Vercel treats each project as its own deployment. Connecting both projects to the same repository means each site will deploy independently on pushes. The existing root `vercel.json` is retained for the repository's combined-service setup; use the two app directories above as the project roots for the separate sites.

## Creating the admin login in Firebase

The admin portal uses Firebase Authentication; it does not have a separate admin password database.

1. In the Firebase Console for the same project configured above, open **Authentication → Sign-in method** and enable **Email/Password**. The `auth/operation-not-allowed` error means this provider is disabled for the Firebase project.
2. Open **Authentication → Users** and create the administrator account with `chentoadmin@gmail.com`. Set its password directly in Firebase Console; never add the password to this repository, Vercel environment variables, or deployment documentation.
3. Add `chentoadmin@gmail.com` to the API project's `ADMIN_EMAILS` environment variable. Preserve any other administrator email addresses already there, then redeploy the API.
4. Sign in at the admin site's `/login` page with that Firebase account. The API verifies the Firebase ID token and synchronizes the trusted administrator profile to Firestore.
5. After confirming the account has an `admins/{uid}` record in Firestore, you may remove the email from `ADMIN_EMAILS` and redeploy. The Firestore admin record continues to authorize that account, while the bootstrap allowlist no longer grants admin status solely by email.

If the account already exists in Firebase Authentication, use Firebase Console's password reset flow rather than creating a duplicate account.
