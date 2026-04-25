# Public Deployment

This project is a Next.js app with API routes, Prisma, Postgres, and durable media uploads through Vercel Blob.

## Recommended Stack

- App hosting: Vercel
- Database: Neon Postgres, Supabase Postgres, or Vercel Postgres
- File uploads: Vercel Blob

After deployment, the app will have a public `https://...vercel.app` URL that can be opened from any phone. Uploaded files are stored in Blob instead of the server filesystem, so they remain available after redeploys.

## 1. Create The Database

Create a hosted Postgres database and copy its connection string.

The value should look like this:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
```

Good low-friction choices:

- Neon: simple hosted Postgres
- Supabase: Postgres plus optional auth/storage tools
- Vercel Postgres: convenient if you keep everything in Vercel

## 2. Create Vercel Blob Storage

In Vercel, create a Blob store for this project. Vercel will provide:

```env
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxxxxxxxxxxx"
```

This token is required for production uploads.

## 3. Configure Vercel

1. Push this project to GitHub.
2. Open [Vercel](https://vercel.com/new) and import the repository.
3. Keep the default settings:
   - Framework Preset: `Next.js`
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: leave empty
4. Add these environment variables in Vercel Project Settings:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxxxxxxxxxxxxxx"
```

5. Deploy.

## 4. Initialize Online Tables

After the environment variables are configured, run this once against the hosted database:

```bash
npm run db:init
```

You can run it locally after setting the same `DATABASE_URL` in `.env`, or run it from a Vercel-connected shell/CI step.

## Local Development

Use the same hosted Postgres database locally, or create a separate development Postgres database. Put its connection string in `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
```

If `BLOB_READ_WRITE_TOKEN` is missing in local development, uploads fall back to `public/uploads` so the app is still easy to test on your machine. In production, the upload API requires Blob storage.

## Verification

Before pushing, run:

```bash
npm install
npm run build
```

After deployment, test from a phone:

1. Open the Vercel URL.
2. Log in or enter the admin area.
3. Upload an image/audio/video.
4. Refresh the page and open the same URL on another device.
5. Confirm the uploaded media still loads.
