"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/lib/auth/hooks";
import { createPost } from "@/lib/actions/posts";
import { generateBlogParagraph } from "@/ai/flows/ai-generate-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

const postFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters long."),
  content: z.string().min(20, "Content must be at least 20 characters long."),
  image: z.instanceof(File).optional(),
});

type PostFormValues = z.infer<typeof postFormSchema>;

export function PostForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: { title: "", content: "" },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("image", file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleGenerateParagraph = async () => {
    const title = form.getValues("title");
    if (!title) {
      toast({
        variant: "destructive",
        title: "Title is required",
        description: "Please enter a title before generating content.",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateBlogParagraph({ title });
      const currentContent = form.getValues("content");
      form.setValue("content", currentContent ? `${currentContent}\n\n${result.paragraph}` : result.paragraph);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "AI Generation Failed",
        description: "Could not generate content. Please try again.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (values: PostFormValues) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "You must be logged in to create a post.",
      });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("content", values.content);
    if (values.image) {
      formData.append("image", values.image);
    }

    try {
      await createPost(user, formData);
      toast({
        title: "Post Created!",
        description: "Your new blog post is now live.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Create Post",
        description: error.message,
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl py-12">
      <h1 className="font-headline text-4xl font-bold mb-8">Create New Post</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">Title</label>
          <Input id="title" placeholder="Your amazing blog post title" {...form.register("title")} />
          {form.formState.errors.title && <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="content" className="text-sm font-medium">Content</label>
            <Button type="button" variant="outline" size="sm" onClick={handleGenerateParagraph} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate Paragraph
            </Button>
          </div>
          <Textarea id="content" placeholder="Write your heart out..." rows={15} {...form.register("content")} />
          {form.formState.errors.content && <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>}
        </div>

        <div className="space-y-2">
            <label htmlFor="image" className="text-sm font-medium">Featured Image</label>
            <div className="flex items-center justify-center w-full">
                <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-border border-dashed rounded-lg cursor-pointer bg-card hover:bg-accent/10">
                    {previewUrl ? (
                        <Image src={previewUrl} alt="Preview" width={400} height={200} className="object-contain h-full w-full p-2 rounded-lg" />
                    ) : (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <ImageIcon className="w-8 h-8 mb-4 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG or WEBP (MAX. 5MB)</p>
                        </div>
                    )}
                    <input id="image-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} />
                </label>
            </div>
            {form.formState.errors.image && <p className="text-sm text-destructive">{form.formState.errors.image.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Publish Post
        </Button>
      </form>
    </div>
  );
}
