This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Clerk authentication

1. Create a Clerk application and enable email sign-up and sign-in with email verification codes. Disable password sign-in; the Whisper forms use one-time email codes.
2. Activate Clerk's Convex integration in the Clerk Dashboard and copy its Frontend API URL.
3. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CONVEX_URL`, and `CLERK_JWT_ISSUER_DOMAIN` to the values for your Clerk and Convex apps.
4. Set the issuer URL on the Convex deployment as well: `npx convex env set CLERK_JWT_ISSUER_DOMAIN <clerk-frontend-api-url>`.
5. Run `npx convex dev` to publish the schema, auth configuration, and profile functions.

After a new user verifies their email, Whisper asks them to choose a unique nickname. First name, last name, and email stay in Clerk and are not returned by the Whisper profile query. The nickname is stored in Convex and is the public-facing identity for future posts.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
