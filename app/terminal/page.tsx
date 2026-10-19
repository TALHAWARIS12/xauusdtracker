import { auth } from "@/auth";
import { getSubscriptionStatus } from "@/lib/subscription";
import { TerminalClient } from "@/components/terminal/TerminalClient";
import { redirect } from "next/navigation";

export default async function TerminalPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/terminal");
  }

  // Server-enforced subscription check against Prisma PostgreSQL database
  const isSubscribed = await getSubscriptionStatus(session.user.id);

  return (
    <TerminalClient
      isSubscribed={isSubscribed}
      userEmail={session.user.email}
    />
  );
}
