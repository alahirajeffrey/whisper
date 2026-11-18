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

After a new user verifies their email, Whisper redirects them to `/onboarding/profile` to choose a unique nickname and avatar colour. First name, last name, and email stay in Clerk and are not returned by the Whisper profile query. The nickname and colour are stored in Convex as the public identity for future posts.

You can start editing the landing page in `app/page.tsx`; the profile onboarding page is in `app/onboarding/profile/page.tsx`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
