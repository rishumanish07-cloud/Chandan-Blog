# How to Add Your BLOB_READ_WRITE_TOKEN Directly

Your token is now stored in a single file for easy configuration!

## Quick Steps:

### 1. Get Your Token from Vercel

1. Go to: https://vercel.com/dashboard/stores
2. Click **"Create Database"** → Select **"Blob"**
3. Name it (e.g., "blog-images")
4. Click **"Create"**
5. Copy the `BLOB_READ_WRITE_TOKEN` (looks like: `vercel_blob_rw_XXXXXXXXXX`)

### 2. Add Token to Your Code

Open this file: **`src/lib/blob/config.ts`**

Replace `'your_token_here'` with your actual token:

```typescript
// Before:
export const BLOB_TOKEN = 'your_token_here';

// After:
export const BLOB_TOKEN = 'vercel_blob_rw_XXXXXXXXXX_YYYYYYYYYYYYYYYY';
```

### 3. Save and Restart

```bash
npm run dev
```

That's it! Your token is now hardcoded and will work immediately.

## Where the Token is Used:

The token is imported and used in:
- ✅ `src/lib/actions/posts.ts` - For uploading/deleting post images
- ✅ `src/lib/actions/user.ts` - For uploading/deleting profile avatars

## ⚠️ Important Security Note:

**DO NOT commit this file to a public repository!**

If you're using Git and want to keep the token private:

1. Add to `.gitignore`:
   ```
   src/lib/blob/config.ts
   ```

2. Or use environment variables instead (recommended for production)

## Testing:

After adding your token:
1. Try creating a new post with an image
2. Try updating your profile picture
3. Check your Vercel Blob dashboard to see the uploaded files

## Troubleshooting:

**Error: "Invalid token"**
- Make sure you copied the entire token
- Token should start with `vercel_blob_rw_`
- No extra spaces or quotes

**Images not uploading**
- Check browser console for errors
- Verify the token is correctly pasted in `src/lib/blob/config.ts`
- Make sure you saved the file and restarted the dev server
