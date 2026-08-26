import { requireTrader } from "@/lib/auth";
import { ProfilePageClient } from "./ProfileClient";

export default async function ProfilePage() {
  const { user, trader } = await requireTrader();
  return <ProfilePageClient user={user} trader={trader} />;
}