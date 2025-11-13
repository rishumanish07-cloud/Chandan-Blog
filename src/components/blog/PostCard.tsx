import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import type { Post } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, User } from "lucide-react";

type PostCardProps = {
  post: Post;
};

export function PostCard({ post }: PostCardProps) {
  const postDate = post.createdAt ? format(post.createdAt.toDate(), "MMM d, yyyy") : "No date";

  return (
    <Card className="flex flex-col overflow-hidden transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl">
      <Link href={`/posts/${post.id}`} className="block">
        <div className="aspect-w-16 aspect-h-9 relative">
          {post.imageUrl ? (
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              data-ai-hint="blog post image"
            />
          ) : (
             <div className="w-full h-full bg-secondary flex items-center justify-center">
                <span className="text-muted-foreground">No Image</span>
             </div>
          )}
        </div>
      </Link>
      <CardHeader>
        <Link href={`/posts/${post.id}`}>
          <CardTitle className="font-headline text-2xl leading-tight hover:text-primary transition-colors">{post.title}</CardTitle>
        </Link>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground line-clamp-3">
            {post.content.substring(0, 150)}...
        </p>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={post.authorPhotoURL} alt={post.authorName} />
            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{post.authorName}</p>
            <p className="text-xs text-muted-foreground">{postDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Heart className="h-4 w-4" />
          <span className="text-sm">{post.likes.length}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
