'use server';
/**
 * @fileOverview AI-powered blog post summarization flow.
 *
 * - summarizePost - A function that generates a concise summary of a blog post.
 * - SummarizePostInput - The input type for the summarizePost function.
 * - SummarizePostOutput - The return type for the summarizePost function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizePostInputSchema = z.object({
  postContent: z
    .string()
    .describe('The complete text content of the blog post to be summarized.'),
});
export type SummarizePostInput = z.infer<typeof SummarizePostInputSchema>;

const SummarizePostOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the blog post content.'),
});
export type SummarizePostOutput = z.infer<typeof SummarizePostOutputSchema>;

export async function summarizePost(input: SummarizePostInput): Promise<SummarizePostOutput> {
  return summarizePostFlow(input);
}

const summarizePostPrompt = ai.definePrompt({
  name: 'summarizePostPrompt',
  input: {schema: SummarizePostInputSchema},
  output: {schema: SummarizePostOutputSchema},
  prompt: `Summarize the following blog post in a concise paragraph. The summary should capture the main points and provide a quick overview of the content.\n\nBlog Post:\n{{{postContent}}}`,
});

const summarizePostFlow = ai.defineFlow(
  {
    name: 'summarizePostFlow',
    inputSchema: SummarizePostInputSchema,
    outputSchema: SummarizePostOutputSchema,
  },
  async input => {
    const {output} = await summarizePostPrompt(input);
    return output!;
  }
);
