'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { useEffect, useState } from 'react';
import type { Pharmacy } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface InteractiveMapProps {
  userLocation: { latitude: number; longitude: number };
  pharmacies: Pharmacy[];
}

// Custom icons for markers
const userIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

const pharmacyIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/29/29302.png',
  iconSize: [25, 25],
  iconAnchor: [12, 25],
  popupAnchor: [0, -25],
});

const openRouteServiceApiKey = process.env.NEXT_PUBLIC_OPENROUTESERVICE_API_KEY;

export default function InteractiveMap({ userLocation, pharmacies }: InteractiveMapProps) {
  const [routes, setRoutes] = useState<LatLngExpression[][]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  useEffect(() => {
    const fetchRoutes = async () => {
      if (!openRouteServiceApiKey || openRouteServiceApiKey === "REPLACE_WITH_YOUR_KEY") {
        console.error("OpenRouteService API key is missing. Skipping route generation.");
        setLoadingRoutes(false);
        return;
      }
      
      setLoadingRoutes(true);
      const allRoutes: LatLngExpression[][] = [];
      const userCoords = [userLocation.longitude, userLocation.latitude];

      for (const pharmacy of pharmacies) {
        try {
          const pharmacyCoords = [pharmacy.coords.lng, pharmacy.coords.lat];
          const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
            method: 'POST',
            headers: {
              'Authorization': openRouteServiceApiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              coordinates: [userCoords, pharmacyCoords],
            }),
          });
          if (!response.ok) {
            console.error(`Failed to fetch route for ${pharmacy.name}: ${response.statusText}`);
            continue;
          }
          const data = await response.json();
          const routeCoords = data.routes[0].geometry.map((coord: number[]) => [coord[1], coord[0]]);
          allRoutes.push(routeCoords);
        } catch (error) {
          console.error('Error fetching route:', error);
        }
      }
      setRoutes(allRoutes);
      setLoadingRoutes(false);
    };

    if (pharmacies.length > 0) {
      fetchRoutes();
    } else {
        setLoadingRoutes(false);
    }
  }, [userLocation, pharmacies]);

  const userPosition: LatLngExpression = [userLocation.latitude, userLocation.longitude];

  return (
    <div className="h-[450px] md:h-full w-full rounded-lg overflow-hidden relative">
      <MapContainer center={userPosition} zoom={14} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Marker */}
        <Marker position={userPosition} icon={userIcon}>
          <Popup>You are here.</Popup>
        </Marker>

        {/* Pharmacy Markers */}
        {pharmacies.map((pharmacy) => (
          <Marker
            key={pharmacy.id}
            position={[pharmacy.coords.lat, pharmacy.coords.lng]}
            icon={pharmacyIcon}
          >
            <Popup>
              <div>
                <p className="font-bold">{pharmacy.name}</p>
                <p>{pharmacy.address}</p>
                {pharmacy.distance && <p className="mt-1 text-xs">{pharmacy.distance.toFixed(1)} km away</p>}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Routes */}
        {!loadingRoutes && routes.map((route, index) => (
          <Polyline key={index} pathOptions={{ color: 'hsl(var(--primary))', weight: 4, opacity: 0.7 }} positions={route} />
        ))}
      </MapContainer>
      {loadingRoutes && (
        <div className="absolute inset-0 bg-background/60 flex items-center justify-center z-[1000]">
            <div className="flex items-center gap-2 p-4 rounded-lg bg-card shadow-lg">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Loading routes...</span>
            </div>
        </div>
      )}
    </div>
  );
}
