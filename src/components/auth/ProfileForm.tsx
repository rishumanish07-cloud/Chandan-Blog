
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/lib/auth/hooks";
import { updateUserProfile } from "@/lib/actions/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Image as ImageIcon } from "lucide-react";
import NextImage from "next/image";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const profileFormSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters long.").max(50, "Name must be less than 50 characters."),
  bio: z.string().max(160, "Bio must be less than 160 characters.").optional(),
  image: z.instanceof(File).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm({ user }: { user: NonNullable<ReturnType<typeof useAuth>['user']> }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.photoURL);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: user.displayName || "",
      bio: user.bio || "",
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue("image", file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("displayName", values.displayName);
    formData.append("bio", values.bio || "");
    if (values.image) {
      formData.append("image", values.image);
    }

    try {
      await updateUserProfile(user, formData);
      toast({
        title: "Profile Updated!",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to Update Profile",
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl py-12">
      <h1 className="font-headline text-4xl font-bold mb-8">Edit Profile</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium">Display Name</label>
            <Input id="displayName" placeholder="Your Name" {...form.register("displayName")} />
            {form.formState.errors.displayName && <p className="text-sm text-destructive">{form.formState.errors.displayName.message}</p>}
        </div>

        <div className="space-y-2">
          <label htmlFor="bio" className="text-sm font-medium">Bio</label>
          <Textarea id="bio" placeholder="Tell us a little about yourself" rows={4} {...form.register("bio")} />
          {form.formState.errors.bio && <p className="text-sm text-destructive">{form.formState.errors.bio.message}</p>}
        </div>

        <div className="space-y-4">
            <label className="text-sm font-medium">Profile Picture</label>
            <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={previewUrl ?? ""} alt="Profile preview" />
                    <AvatarFallback><User className="h-10 w-10"/></AvatarFallback>
                </Avatar>
                <label htmlFor="image-upload" className="cursor-pointer rounded-md bg-secondary px-4 py-2 text-secondary-foreground hover:bg-secondary/80">
                    <span>Change Picture</span>
                    <input id="image-upload" type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} />
                </label>
            </div>
            {form.formState.errors.image && <p className="text-sm text-destructive">{form.formState.errors.image.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </form>
    </div>
  );
}
