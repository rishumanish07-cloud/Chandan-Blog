# Vercel Blob Storage Setup Guide

Your blog now uses **Vercel Blob Storage** for all image uploads (posts and avatars). This is production-ready and scales automatically.

## Quick Setup Steps

### 1. Create a Blob Store

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Storage** tab
3. Click **Create Database**
4. Select **Blob**
5. Give it a name (e.g., "blog-images")
6. Click **Create**

### 2. Get Your Token

After creating the store, you'll see environment variables. Copy the `BLOB_READ_WRITE_TOKEN`.

### 3. Add to Environment Variables

**For Local Development:**

Create or update `.env.local` in your project root:

```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx
```

**For Production (Vercel):**

The token is automatically added to your Vercel project when you create the Blob store. No manual setup needed!

### 4. Alternative: Use Vercel CLI

If you have Vercel CLI installed:

```bash
vercel env pull .env.local
```

This will automatically download all environment variables including the Blob token.

## What Changed?

### Before (Local Filesystem)
- Images stored in `public/uploads/`
- Not suitable for serverless/production
- Files lost on redeployment

### After (Vercel Blob)
- Images stored in Vercel's CDN
- Automatic scaling and optimization
- Persistent across deployments
- Fast global delivery

## File Organization

Images are organized by type and user:

```
posts/{userId}/{timestamp}_filename.jpg
avatars/{userId}/{timestamp}_filename.jpg
```

## Testing

1. Add your `BLOB_READ_WRITE_TOKEN` to `.env.local`
2. Restart your dev server: `npm run dev`
3. Try creating a post with an image
4. Try updating your profile picture
5. Check your Vercel Blob dashboard to see the uploaded files

## Troubleshooting

**Error: "Missing BLOB_READ_WRITE_TOKEN"**
- Make sure you added the token to `.env.local`
- Restart your dev server after adding the token

**Images not showing up**
- Check that `*.public.blob.vercel-storage.com` is in your `next.config.ts` image domains (already added)
- Verify the token has read/write permissions

**Old local images**
- Old images in `public/uploads/` will still work
- New uploads will go to Vercel Blob
- You can manually migrate old images if needed

## Cost

Vercel Blob pricing:
- **Hobby plan**: 500MB free storage
- **Pro plan**: 100GB included
- Additional storage: $0.15/GB/month

For most blogs, the free tier is sufficient!
