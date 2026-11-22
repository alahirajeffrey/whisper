This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Local development

Install dependencies once:

```bash
npm install
```

Start the app’s two local services in separate terminals:

```bash
npm run convex-dev
```

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000). Clerk is hosted, so it does not need a local process. After initial setup, restarting only requires starting these two commands again.

## Clerk authentication

1. Create a Clerk application and enable email sign-up and sign-in with email verification codes. Disable password sign-in; the Whisper forms use one-time email codes.
2. Activate Clerk's Convex integration in the Clerk Dashboard and copy its Frontend API URL.
3. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `NEXT_PUBLIC_CONVEX_URL` for your Clerk and Convex apps.
4. Set the Clerk Frontend API URL once on each Convex deployment: `npx convex env set CLERK_JWT_ISSUER_DOMAIN <clerk-frontend-api-url>`.
5. Run `npm run convex-dev` to publish the schema, auth configuration, and profile functions to the selected dev deployment. Keep it running while developing.

`CLERK_JWT_ISSUER_DOMAIN` is stored on the Convex deployment, so you do not set it again when restarting. A separate production deployment needs its own value.

Authentication uses email one-time codes for both sign-up and sign-in; there is no password field in the Whisper login flow. After a new user verifies their email, Whisper redirects them to `/onboarding/profile` to choose a unique nickname and avatar colour. Existing users with a completed profile go directly to `/community` after sign-in; new users go there after saving their profile. First name, last name, and email stay in Clerk and are not returned by the Whisper profile query. The nickname and colour are stored in Convex as the public identity for community posts.

## Community

The `/community` page is the signed-in home for anonymous posts. It supports a paginated feed, category filtering, live updates as posts are added, likes, comments and replies, and saving posts. Public post and comment data uses the user-selected nickname and avatar; account email and legal name are not exposed as public profile information. Convex stores the post, category, like, comment, and saved-post data.

The landing and email-code login page is in `app/page.tsx`; profile onboarding is in `app/onboarding/profile/page.tsx`; community UI is in `app/community/page.tsx`; backend schema and functions are under `convex/`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
