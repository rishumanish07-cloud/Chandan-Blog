import { ReactNode } from "react";

export default function MessagesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container mx-auto h-[calc(100vh-80px)]">{children}</div>
  );
}