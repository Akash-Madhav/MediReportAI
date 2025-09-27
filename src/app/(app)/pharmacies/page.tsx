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
import { Navigation, MapPin, Check, X } from "lucide-react"

export default function PharmaciesPage() {
    // A real app would use geolocation to find nearby pharmacies.
    // We'll just use the mock data for now.
    const relevantPharmacies = mockPharmacies.slice(0, 3);
    
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
                            <CardDescription>Showing pharmacies in your area.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="aspect-video w-full rounded-lg overflow-hidden relative">
                                <Image
                                    // NOTE: This uses a placeholder from placeholder-images.json. 
                                    // You need a Google Maps API key for this to work.
                                    // The URL is intentionally broken to avoid exposing a key.
                                    src="https://maps.googleapis.com/maps/api/staticmap?center=40.730610,-73.935242&zoom=12&size=1200x800&maptype=roadmap&markers=color:0x34A0A4%7C40.7128,-74.0060%7C40.7580,-73.9855%7C40.7484,-73.9500&style=feature:poi|visibility:off&style=feature:transit|visibility:off&style=feature:road|element:labels.icon|visibility:off&style=feature:landscape|element:labels|visibility:off&key=YOUR_API_KEY_HERE"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    alt="Map of pharmacies"
                                    className="filter dark:brightness-75 dark:contrast-125"
                                    data-ai-hint="city map"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
                                 <div className="absolute bottom-4 left-4 text-xs text-muted-foreground">Map data ©2024 Google. UI is for demonstration purposes.</div>
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
                            {relevantPharmacies.map(pharmacy => (
                                <div key={pharmacy.id} className="p-4 border rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold">{pharmacy.name}</p>
                                            <p className="text-sm text-muted-foreground">{pharmacy.address}</p>
                                        </div>
                                        <Button variant="outline" size="sm" className="shrink-0">
                                            <Navigation className="h-3 w-3 mr-2"/>
                                            Directions
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
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
