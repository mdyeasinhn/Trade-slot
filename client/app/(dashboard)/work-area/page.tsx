"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { setWorkAreaAction } from "@/lib/actions/work-area";
import { toast } from "@/components/ui/sonner";
import { Loader2, MapPin, CheckCircle } from "lucide-react";

const workAreaSchema = z.object({
  date: z.string().min(1, "Date is required"),
  centerLat: z.coerce.number().min(-90).max(90, "Invalid latitude"),
  centerLng: z.coerce.number().min(-180).max(180, "Invalid longitude"),
  radiusKm: z.coerce.number().min(1).max(100, "Radius must be between 1 and 100 km"),
});

type WorkAreaForm = z.infer<typeof workAreaSchema>;

export default function WorkAreaPage() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<WorkAreaForm>({
    resolver: zodResolver(workAreaSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      centerLat: 51.5074,
      centerLng: -0.1278,
      radiusKm: 10,
    },
  });

  const onSubmit = async (data: WorkAreaForm) => {
    setIsLoading(true);
    const result = await setWorkAreaAction(data);
    if (result.success) {
      toast.success("Work area saved");
    } else {
      toast.error(result.error || "Failed to save work area");
    }
    setIsLoading(false);
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Work Area</h1>
        <p className="text-muted-foreground">Set your daily work area to receive booking requests from nearby customers.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Set Work Area for {today}</CardTitle>
          <CardDescription>Define the center point and radius for your service area</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                {...register("date")}
                min={today}
                disabled={isLoading}
              />
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="centerLat">Latitude</Label>
                <Input
                  id="centerLat"
                  type="number"
                  step="0.0001"
                  placeholder="51.5074"
                  {...register("centerLat")}
                  disabled={isLoading}
                />
                {errors.centerLat && <p className="text-sm text-destructive">{errors.centerLat.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="centerLng">Longitude</Label>
                <Input
                  id="centerLng"
                  type="number"
                  step="0.0001"
                  placeholder="-0.1278"
                  {...register("centerLng")}
                  disabled={isLoading}
                />
                {errors.centerLng && <p className="text-sm text-destructive">{errors.centerLng.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="radiusKm">Radius (km)</Label>
              <Input
                id="radiusKm"
                type="number"
                min="1"
                max="100"
                step="1"
                {...register("radiusKm")}
                disabled={isLoading}
              />
              {errors.radiusKm && <p className="text-sm text-destructive">{errors.radiusKm.message}</p>}
            </div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Save Work Area
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p>Set a center point (latitude/longitude) for your daily work location</p>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p>Choose a radius - customers within this distance can request bookings</p>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p>Update daily - you can set different areas for different days</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}