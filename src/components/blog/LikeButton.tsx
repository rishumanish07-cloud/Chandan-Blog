"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/hooks";
import { toggleLike } from "@/lib/actions/posts";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type LikeButtonProps = {
  postId: string;
  likes: string[];
  dislikes: string[];
};

export function LikeButton({ postId, likes, dislikes }: LikeButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes.length);

  useEffect(() => {
    if(user) {
        setIsLiked(likes.includes(user.uid));
    } else {
        setIsLiked(false);
    }
    setLikeCount(likes.length);
  }, [likes, user]);

  const handleLike = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Login Required",
        description: "You must be logged in to like a post.",
      });
      return;
    }

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);

    try {
      await toggleLike(postId, user.uid);
    } catch (error) {
      setIsLiked(!newIsLiked);
      setLikeCount(prev => newIsLiked ? prev - 1 : prev + 1);
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Could not update like status. Please try again.",
      });
    }
  };

  return (
    <Button onClick={handleLike} variant="outline" size="lg">
      <Heart className={cn("mr-2 h-5 w-5", isLiked && "fill-destructive text-destructive")} />
      <span>{likeCount} {likeCount === 1 ? "Like" : "Likes"}</span>
    </Button>
  );
}
