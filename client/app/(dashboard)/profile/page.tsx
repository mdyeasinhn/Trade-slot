import { requireTrader } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, BriefcaseBusiness, Clock, MapPin } from "lucide-react";

export default async function ProfilePage() {
  const { user, trader } = await requireTrader();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Your account and trader profile</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-xl">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{user.name}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-md border p-4">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{user.phone || "Not provided"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-md border p-4">
            <BriefcaseBusiness className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Trader name</p>
              <p className="font-medium">{trader.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-md border p-4">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Working hours</p>
              <p className="font-medium">{trader.workDayStart} - {trader.workDayEnd}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-md border p-4">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Timezone</p>
              <p className="font-medium">{trader.timezone}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
