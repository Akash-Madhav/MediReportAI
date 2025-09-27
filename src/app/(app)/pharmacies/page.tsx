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
import { useToast } from "@/hooks/use-toast";

export default function PharmaciesPage() {
    const { user } = useAuth();
    const { toast } = useToast();
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
        if (!user) return;
        setLoading(true);
        setError(null);
        try {
            // The flow will now save to the DB itself.
            await findNearbyPharmacies({ latitude, longitude, userId: user.uid });
            
            // Now that data is in the DB, set up a listener
            const pharmaciesRef = ref(db, `nearby_pharmacies/${user.uid}`);
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
            let errorMessage = "Could not fetch pharmacies. Please try again.";
            if(apiError.message?.includes("401") || apiError.message?.includes("403")) {
              errorMessage = "Could not authenticate with the mapping service. Please check your configuration.";
            } else if (apiError.message?.includes("404")) {
              errorMessage = "The pharmacy service endpoint could not be found. Please contact support.";
            } else if (apiError.message?.includes("undefined in property")) {
                errorMessage = "There was an issue processing the pharmacy data from the AI. Retrying may help.";
            }
            setError(errorMessage);
            setNearbyPharmacies([]);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        const initialize = async (latitude: number, longitude: number) => {
            if(!user) return;
            // First check if data is already in DB for this user
            const pharmaciesRef = ref(db, `nearby_pharmacies/${user.uid}`);
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

    const handleDirectionsClick = (pharmacy: Pharmacy) => {
        toast({
            title: "Getting live location...",
            description: "Please wait while we fetch your current position for accurate directions.",
        });

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const url = `https://www.google.com/maps/dir/${latitude},${longitude}/${pharmacy.coords.lat},${pharmacy.coords.lng}`;
                    window.open(url, "_blank", "noopener,noreferrer");
                },
                (error) => {
                    toast({
                        variant: "destructive",
                        title: "Could not get live location",
                        description: `Using last known location instead. Error: ${error.message}`,
                    });
                    // Fallback to the location stored in state
                    const startLat = userLocation?.latitude || "";
                    const startLng = userLocation?.longitude || "";
                    const url = `https://www.google.com/maps/dir/${startLat},${startLng}/${pharmacy.coords.lat},${pharmacy.coords.lng}`;
                    window.open(url, "_blank", "noopener,noreferrer");
                }
            );
        } else {
            toast({
                variant: "destructive",
                title: "Geolocation not supported",
                description: "Cannot get live location. Using last known location.",
            });
            const startLat = userLocation?.latitude || "";
            const startLng = userLocation?.longitude || "";
            const url = `https://www.google.com/maps/dir/${startLat},${startLng}/${pharmacy.coords.lat},${pharmacy.coords.lng}`;
            window.open(url, "_blank", "noopener,noreferrer");
        }
    };

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

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Nearby Locations</CardTitle>
                        <CardDescription>
                            {loading ? "Finding pharmacies near you..." : `Showing ${nearbyPharmacies.length} pharmacies.`}
                        </CardDescription>
                    </div>
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
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {nearbyPharmacies.slice(0, 9).map(pharmacy => (
                        <div key={pharmacy.id} className="p-4 border rounded-lg flex flex-col">
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
                                <Button onClick={() => handleDirectionsClick(pharmacy)} variant="outline" size="sm" className="shrink-0">
                                    <Navigation className="h-3 w-3 mr-2"/>
                                    Directions
                                </Button>
                            </div>
                            <div className="mt-4 pt-4 border-t flex-grow">
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
                        ))}
                        </div>
                    ) : (
                        <div className="text-center text-sm text-muted-foreground p-4">No pharmacies found near your location.</div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
