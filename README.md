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

### Image Storage

Images uploaded with blog posts are stored locally in the `public/uploads/posts` directory. The directory is automatically created when needed. Image paths are stored in Firestore as relative paths (e.g., `/uploads/posts/1234567890_image.jpg`).

**Note:** The `public/uploads` directory is in `.gitignore` to prevent committing uploaded images to version control. Make sure to back up this directory separately if needed for production deployments.