import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppNavigation } from "@/components/app-navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth(); if (!session?.user) redirect("/login");
  return <div className="registered-shell"><AppNavigation userName={session.user.name}/><main className="registered-main">{children}</main></div>;
}
