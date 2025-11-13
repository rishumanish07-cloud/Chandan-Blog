'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating blog post paragraphs related to a given title using AI.
 *
 * - generateBlogParagraph - A function that accepts a blog post title and generates a related paragraph.
 * - GenerateBlogParagraphInput - The input type for the generateBlogParagraph function.
 * - GenerateBlogParagraphOutput - The return type for the generateBlogParagraph function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBlogParagraphInputSchema = z.object({
  title: z.string().describe('The title of the blog post.'),
});
export type GenerateBlogParagraphInput = z.infer<typeof GenerateBlogParagraphInputSchema>;

const GenerateBlogParagraphOutputSchema = z.object({
  paragraph: z.string().describe('A paragraph related to the blog post title.'),
});
export type GenerateBlogParagraphOutput = z.infer<typeof GenerateBlogParagraphOutputSchema>;

export async function generateBlogParagraph(input: GenerateBlogParagraphInput): Promise<GenerateBlogParagraphOutput> {
  return generateBlogParagraphFlow(input);
}

const generateBlogParagraphPrompt = ai.definePrompt({
  name: 'generateBlogParagraphPrompt',
  input: {schema: GenerateBlogParagraphInputSchema},
  output: {schema: GenerateBlogParagraphOutputSchema},
  prompt: `You are an expert blog content creator.

  Please generate a paragraph that is related to the following blog post title:

  Title: {{{title}}}

  Paragraph:`,
});

const generateBlogParagraphFlow = ai.defineFlow(
  {
    name: 'generateBlogParagraphFlow',
    inputSchema: GenerateBlogParagraphInputSchema,
    outputSchema: GenerateBlogParagraphOutputSchema,
  },
  async input => {
    const {output} = await generateBlogParagraphPrompt(input);
    return output!;
  }
);
