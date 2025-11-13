"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/hooks";
import { toggleDislike } from "@/lib/actions/posts";
import { Button } from "@/components/ui/button";
import { ThumbsDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type DislikeButtonProps = {
  postId: string;
  dislikes: string[];
  likes: string[]; 
};

export function DislikeButton({ postId, dislikes = [], likes }: DislikeButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isDisliked, setIsDisliked] = useState(false);
  const [dislikeCount, setDislikeCount] = useState(dislikes.length);

  useEffect(() => {
    if(user) {
        setIsDisliked(dislikes.includes(user.uid));
    } else {
        setIsDisliked(false);
    }
    setDislikeCount(dislikes.length);
  }, [dislikes, user]);

  const handleDislike = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Login Required",
        description: "You must be logged in to dislike a post.",
      });
      return;
    }

    const newIsDisliked = !isDisliked;
    setIsDisliked(newIsDisliked);
    setDislikeCount(prev => newIsDisliked ? prev + 1 : prev - 1);
    
    try {
      await toggleDislike(postId, user.uid);
    } catch (error) {
      setIsDisliked(!newIsDisliked);
      setDislikeCount(prev => newIsDisliked ? prev - 1 : prev + 1);
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Could not update dislike status. Please try again.",
      });
    }
  };

  return (
    <Button onClick={handleDislike} variant="outline" size="lg">
      <ThumbsDown className={cn("mr-2 h-5 w-5", isDisliked && "fill-destructive text-destructive")} />
      <span>{dislikeCount} {dislikeCount === 1 ? "Dislike" : "Dislikes"}</span>
    </Button>
  );
}
