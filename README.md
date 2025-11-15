# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Setup

### API Key Configuration

For AI features (Genkit with Google Gemini), you need to set up your Google GenAI API key:

1. Get your API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. Create a `.env.local` file in the root directory
3. Add your API key:
   ```
   GOOGLE_GENAI_API_KEY=your_api_key_here
   ```

The `.env.local` file is already in `.gitignore`, so your API key won't be committed to version control.

### Image Storage (Vercel Blob)

Images for blog posts and user avatars are stored in **Vercel Blob Storage** for scalable, production-ready file hosting.

**Setup:**

1. Create a Blob Store in your Vercel Dashboard:
   - Go to [Vercel Dashboard → Storage](https://vercel.com/dashboard/stores)
   - Click "Create Database" → Select "Blob"
   - Name it (e.g., "blog-images")

2. Get your Blob token:
   - After creating the store, copy the `BLOB_READ_WRITE_TOKEN`
   - Add it to your `.env.local` file:
     ```
     BLOB_READ_WRITE_TOKEN=your_token_here
     ```

3. For local development, you can also use Vercel CLI:
   ```bash
   vercel env pull .env.local
   ```

**Note:** Images are organized by type and user:
- Post images: `posts/{userId}/{timestamp}_filename.jpg`
- Avatars: `avatars/{userId}/{timestamp}_filename.jpg`