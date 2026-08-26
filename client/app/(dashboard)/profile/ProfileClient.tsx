"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateTraderAction } from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, BriefcaseBusiness, Clock, MapPin, Edit, Save, Loader2, X } from "lucide-react";
import { toast } from "@/components/ui/sonner";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  traderName: z.string().min(1, "Trader name is required"),
  timezone: z.string().min(1, "Timezone is required"),
  workDayStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:mm)"),
  workDayEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:mm)"),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface ProfilePageProps {
  user: {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: string;
    trader: { id: string } | null;
  };
  trader: {
    id: string;
    name: string;
    phone: string | null;
    timezone: string;
    workDayStart: string;
    workDayEnd: string;
    jobDurationMin: number | null;
    bufferMin: number | null;
    bookingFee: number | null;
    currency: string;
    stripeAccountId: string | null;
    stripeOnboardingDone: boolean;
    stripeChargesEnabled: boolean;
    stripePayoutsEnabled: boolean;
  };
}

export function ProfilePageClient({ user, trader }: ProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      phone: user.phone || "",
      traderName: trader.name,
      timezone: trader.timezone,
      workDayStart: trader.workDayStart,
      workDayEnd: trader.workDayEnd,
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    setIsSaving(true);
    try {
      const result = await updateTraderAction(trader.id, {
        name: data.traderName,
        phone: data.phone,
        timezone: data.timezone,
        workDayStart: data.workDayStart,
        workDayEnd: data.workDayEnd,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      const updatedTrader = result.data;
      reset({
        name: data.name,
        phone: data.phone,
        traderName: updatedTrader.name,
        timezone: updatedTrader.timezone,
        workDayStart: updatedTrader.workDayStart,
        workDayEnd: updatedTrader.workDayEnd,
      });
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    reset({
      name: user.name,
      phone: user.phone || "",
      traderName: trader.name,
      timezone: trader.timezone,
      workDayStart: trader.workDayStart,
      workDayEnd: trader.workDayEnd,
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Your account and trader profile</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.email} alt={user.name} />
            <AvatarFallback className="text-xl">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{isEditing ? (
              <Input {...register("name")} className="w-auto bg-transparent border-none focus:ring-0" />
            ) : (
              user.name
            )}</CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Separator className="my-4" />
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Account Name</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    disabled={isSaving}
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+15550000000"
                    {...register("phone")}
                    disabled={isSaving}
                  />
                </div>
              </div>

              <Separator className="my-4" />
              
              <CardTitle className="text-lg">Trader Profile</CardTitle>
              <CardDescription className="mb-4">Business information and working hours</CardDescription>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="traderName">Trader Name</Label>
                  <Input
                    id="traderName"
                    {...register("traderName")}
                    disabled={isSaving}
                  />
                  {errors.traderName && <p className="text-sm text-destructive">{errors.traderName.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    {...register("timezone")}
                    disabled={isSaving}
                  />
                  {errors.timezone && <p className="text-sm text-destructive">{errors.timezone.message}</p>}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="workDayStart">Work Day Start</Label>
                  <Input
                    id="workDayStart"
                    type="time"
                    {...register("workDayStart")}
                    disabled={isSaving}
                  />
                  {errors.workDayStart && <p className="text-sm text-destructive">{errors.workDayStart.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="workDayEnd">Work Day End</Label>
                  <Input
                    id="workDayEnd"
                    type="time"
                    {...register("workDayEnd")}
                    disabled={isSaving}
                  />
                  {errors.workDayEnd && <p className="text-sm text-destructive">{errors.workDayEnd.message}</p>}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button type="submit" disabled={isSaving} className="flex-1">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={cancelEdit} disabled={isSaving} className="flex-1">
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-md border p-4">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Account Name</p>
                  <p className="font-medium">{user.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-md border p-4">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{user.phone || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-md border p-4">
                <BriefcaseBusiness className="h-5 w-5 text-muted_foreground" />
                <div>
                  <p className="text-sm text-muted_foreground">Trader Name</p>
                  <p className="font-medium">{trader.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-md border p-4">
                <MapPin className="h-5 w-5 text-muted_foreground" />
                <div>
                  <p className="text-sm text-muted_foreground">Timezone</p>
                  <p className="font-medium">{trader.timezone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-md border p-4">
                <Clock className="h-5 w-5 text-muted_foreground" />
                <div>
                  <p className="text-sm text-muted_foreground">Working Hours</p>
                  <p className="font-medium">{trader.workDayStart} - {trader.workDayEnd}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}