'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation, MapPin, Check, X, Loader2, Pill } from "lucide-react";
import { useEffect, useState } from "react";
import type { Pharmacy } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { onValue, ref, get } from "firebase/database";
import { db } from "@/lib/firebase";
import { findNearbyPharmacies } from "@/ai/flows/find-nearby-pharmacies";
import { Skeleton } from '@/components/ui/skeleton';

export default function PharmaciesPage() {
    const { user } = useAuth();
    const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const [nearbyPharmacies, setNearbyPharmacies] = useState<Pharmacy[]>([]);
    const [medicinesToCheck, setMedicinesToCheck] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        // Fetch user's medicines from their prescriptions
        const userPrescriptionsRef = ref(db, `prescriptions/${user.uid}`);
        const unsubscribe = onValue(userPrescriptionsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const allMedicines = Object.values(data).flatMap((presc: any) =>
                    (presc.medicines || []).map((med: any) => med.name)
                );
                const uniqueMedicines = [...new Set(allMedicines as string[])];
                setMedicinesToCheck(uniqueMedicines);
            }
        });

        return () => unsubscribe();
    }, [user]);

    const handleFetchAndSetPharmacies = async (latitude: number, longitude: number) => {
        setLoading(true);
        setError(null);
        try {
            await findNearbyPharmacies({ latitude, longitude });
            // Now that data is in the DB, set up a listener
            const pharmaciesRef = ref(db, `nearby_pharmacies/${user!.uid}`);
            const snapshot = await get(pharmaciesRef);
            if (snapshot.exists()) {
              const data = snapshot.val();
              const pharmaciesWithKmDistance = (Object.values(data) as Omit<Pharmacy, 'id'>[]).map((p, i) => ({
                    ...p,
                    id: Object.keys(data)[i], // Firebase object keys are the IDs
                    distance: p.distance ? p.distance / 1000 : undefined
                }));

              pharmaciesWithKmDistance.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
              setNearbyPharmacies(pharmaciesWithKmDistance);
            } else {
                setNearbyPharmacies([]);
            }
        } catch (apiError: any) {
            console.error(apiError);
            let errorMessage = "Could not fetch pharmacies. Please check API keys and try again.";
            if(apiError.message?.includes("401") || apiError.message?.includes("403")) {
              errorMessage = "Could not authenticate with MapmyIndia API. Please check your credentials and configuration.";
            }
            setError(errorMessage);
            setNearbyPharmacies([]);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        const initialize = async (latitude: number, longitude: number) => {
            // First check if data is already in DB for this user
            const pharmaciesRef = ref(db, `nearby_pharmacies/${user!.uid}`);
            const snapshot = await get(pharmaciesRef);
            if (snapshot.exists()) {
                const data = snapshot.val();
                const pharmaciesWithKmDistance = (Object.values(data) as Omit<Pharmacy, 'id'>[]).map((p, i) => ({
                    ...p,
                    id: Object.keys(data)[i],
                    distance: p.distance ? p.distance / 1000 : undefined
                }));
                pharmaciesWithKmDistance.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
                setNearbyPharmacies(pharmaciesWithKmDistance);
                setLoading(false);
            } else {
                // If not, fetch it from API
                await handleFetchAndSetPharmacies(latitude, longitude);
            }
        };

        if (user && "geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ latitude, longitude });
                    initialize(latitude, longitude);
                },
                (error) => {
                    setError(`Error getting location: ${error.message}. Using mock location.`);
                    const mockLocation = { latitude: 28.6139, longitude: 77.2090 }; // Delhi
                    setUserLocation(mockLocation);
                    initialize(mockLocation.latitude, mockLocation.longitude);
                }
            );
        } else if (user) {
            setError("Geolocation is not supported. Using mock location.");
            const mockLocation = { latitude: 28.6139, longitude: 77.2090 }; // Delhi
            setUserLocation(mockLocation);
            initialize(mockLocation.latitude, mockLocation.longitude);
        }
    }, [user]);

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold font-headline tracking-tight">
                    Find Pharmacies
                </h1>
                <p className="text-muted-foreground">
                    Locate nearby pharmacies and check for medicine availability.
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pharmacy Map</CardTitle>
                            <CardDescription>
                                {loading ? "Finding your location and nearby pharmacies..." : error && nearbyPharmacies.length === 0 ? "Could not display map." : "Showing pharmacies in your area."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Skeleton className="h-[450px] md:h-full w-full" />
                           {error && nearbyPharmacies.length === 0 && (
                            <div className="h-[450px] w-full flex items-center justify-center bg-muted rounded-lg">
                                <p className="text-destructive text-center">{error}</p>
                            </div>
                           )}
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Nearby Locations</CardTitle>
                             {userLocation && (
                                <Button size="sm" variant="outline" onClick={() => handleFetchAndSetPharmacies(userLocation.latitude, userLocation.longitude)} disabled={loading}>
                                    <Loader2 className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : 'hidden'}`} />
                                    Refresh
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {loading ? (
                                <div className="flex items-center justify-center p-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : error && nearbyPharmacies.length === 0 ? (
                                 <div className="text-center text-sm text-muted-foreground p-4">{error}</div>
                            ) : nearbyPharmacies.length > 0 ? (
                                nearbyPharmacies.slice(0, 5).map(pharmacy => (
                                <div key={pharmacy.id} className="p-4 border rounded-lg">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <p className="font-semibold">{pharmacy.name}</p>
                                            <p className="text-sm text-muted-foreground flex items-start gap-1.5 pt-1">
                                                <MapPin className="h-4 w-4 mt-0.5 shrink-0"/>
                                                <span>{pharmacy.address}</span>
                                            </p>
                                            {pharmacy.distance !== undefined && (
                                                <p className="text-xs text-muted-foreground mt-1 font-medium">
                                                    {pharmacy.distance.toFixed(1)} km away
                                                </p>
                                            )}
                                        </div>
                                        <Button asChild variant="outline" size="sm" className="shrink-0">
                                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${pharmacy.coords.lat},${pharmacy.coords.lng}`} target="_blank" rel="noopener noreferrer">
                                                <Navigation className="h-3 w-3 mr-2"/>
                                                Directions
                                            </a>
                                        </Button>
                                    </div>
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-xs font-semibold mb-3 text-muted-foreground">Stock Availability:</p>
                                        <div className="space-y-2">
                                            {medicinesToCheck.length > 0 ? medicinesToCheck.map(medicine => {
                                                const isAvailable = Math.random() > 0.3; // 70% chance

                                                return (
                                                    <div key={medicine} className="flex items-center justify-between text-sm">
                                                        <p className="flex items-center gap-2">
                                                            <Pill className="h-4 w-4 text-muted-foreground" />
                                                            {medicine}
                                                        </p>
                                                        {isAvailable ? (
                                                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                                                                <Check className="h-3 w-3 mr-1"/> In Stock
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="destructive">
                                                                <X className="h-3 w-3 mr-1"/> Out of Stock
                                                            </Badge>
                                                        )}
                                                    </div>
                                                )
                                            }) : <p className="text-sm text-muted-foreground">No prescribed medicines found.</p>}
                                        </div>
                                    </div>
                                </div>
                                ))
                            ) : (
                                <div className="text-center text-sm text-muted-foreground p-4">No pharmacies found near your location.</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
