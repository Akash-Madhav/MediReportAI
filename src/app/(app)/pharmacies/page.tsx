'use client';

import Image from "next/image"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { mockPharmacies } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { Navigation, MapPin, Check, X, Loader2 } from "lucide-react"
import { useEffect, useState } from "react";
import type { Pharmacy } from "@/lib/types";

// Haversine formula to calculate distance between two lat/lng points
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

export default function PharmaciesPage() {
    const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
    const [nearbyPharmacies, setNearbyPharmacies] = useState<Pharmacy[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ latitude, longitude });

                    const pharmaciesWithDistance = mockPharmacies.map(pharmacy => ({
                        ...pharmacy,
                        distance: getDistance(latitude, longitude, pharmacy.coords.lat, pharmacy.coords.lng)
                    }));

                    pharmaciesWithDistance.sort((a, b) => a.distance - b.distance);

                    setNearbyPharmacies(pharmaciesWithDistance);
                    setLoading(false);
                },
                (error) => {
                    setError(`Error getting location: ${error.message}. Showing default list.`);
                    // Fallback to a default list if location is denied
                    setNearbyPharmacies(mockPharmacies.slice(0, 3));
                    setLoading(false);
                }
            );
        } else {
            setError("Geolocation is not supported by your browser. Showing default list.");
            setNearbyPharmacies(mockPharmacies.slice(0, 3));
            setLoading(false);
        }
    }, []);
    
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
                                {loading ? "Finding your location..." : error ? "Could not determine your location." : "Showing pharmacies in your area."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="aspect-video w-full rounded-lg overflow-hidden relative bg-muted">
                                <Image
                                    src="https://picsum.photos/seed/map/1200/800"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    alt="Map of pharmacies"
                                    className="filter dark:brightness-75 dark:contrast-125"
                                    data-ai-hint="city map"
                                />
                                 <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
                                 <div className="absolute bottom-4 left-4 text-xs text-muted-foreground">Map UI is for demonstration purposes.</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Nearby Locations</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {loading ? (
                                <div className="flex items-center justify-center p-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : error ? (
                                 <div className="text-center text-sm text-muted-foreground p-4">{error}</div>
                            ) : nearbyPharmacies.length > 0 ? (
                                nearbyPharmacies.slice(0, 3).map(pharmacy => (
                                <div key={pharmacy.id} className="p-4 border rounded-lg">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <p className="font-semibold">{pharmacy.name}</p>
                                            <p className="text-sm text-muted-foreground flex items-start gap-1.5 pt-1">
                                                <MapPin className="h-4 w-4 mt-0.5 shrink-0"/>
                                                <span>{pharmacy.address}</span>
                                            </p>
                                            {pharmacy.distance && (
                                                <p className="text-xs text-muted-foreground mt-1 font-medium">
                                                    {pharmacy.distance.toFixed(1)} km away
                                                </p>
                                            )}
                                        </div>
                                        <Button asChild variant="outline" size="sm" className="shrink-0">
                                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pharmacy.address)}`} target="_blank" rel="noopener noreferrer">
                                                <Navigation className="h-3 w-3 mr-2"/>
                                                Directions
                                            </a>
                                        </Button>
                                    </div>
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-xs font-semibold mb-2 text-muted-foreground">Metformin Availability:</p>
                                        {pharmacy.stock.find(s => s.medicineName === 'Metformin')?.available ? (
                                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                                                <Check className="h-3 w-3 mr-1"/> In Stock
                                            </Badge>
                                        ) : (
                                            <Badge variant="destructive">
                                                <X className="h-3 w-3 mr-1"/> Out of Stock
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                ))
                            ) : (
                                <div className="text-center text-sm text-muted-foreground p-4">No pharmacies found.</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
