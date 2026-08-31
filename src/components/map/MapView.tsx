"use client";

import { useEffect, useRef, useCallback } from "react";
import { useItineraryStore, PlaceStop } from "@/store/itinerary-store";
import { priceLevelToNumber } from "@/lib/google-places";

const NYC_CENTER = { lat: 40.7128, lng: -74.006 };

export default function MapView() {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const clickMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);

  const stops = useItineraryStore((state) => state.stops);
  const addStop = useItineraryStore((state) => state.addStop);
  const travelMode = useItineraryStore((state) => state.travelMode);

  const addStopRef = useRef(addStop);
  addStopRef.current = addStop;
  const travelModeRef = useRef(travelMode);
  travelModeRef.current = travelMode;
  const stopsRef = useRef(stops);
  stopsRef.current = stops;

  const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng || !googleMapRef.current) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    if (clickMarkerRef.current) {
      clickMarkerRef.current.map = null;
    }
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }

    const dot = document.createElement("div");
    dot.style.cssText = `
      width: 28px; height: 28px; border-radius: 50%;
      background: #6366f1; border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      display: flex; align-items: center; justify-content: center;
      animation: pulse-ring 1.5s ease-out infinite;
    `;
    dot.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;

    if (!document.getElementById("map-pulse-style")) {
      const style = document.createElement("style");
      style.id = "map-pulse-style";
      style.textContent = `
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(99,102,241,0.5); }
          70% { box-shadow: 0 0 0 12px rgba(99,102,241,0); }
          100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
        }
      `;
      document.head.appendChild(style);
    }
    clickMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
      map: googleMapRef.current,
      position: { lat, lng },
      content: dot,
    });

    infoWindowRef.current = new google.maps.InfoWindow({
      content: `<div style="padding:4px;font-family:system-ui;font-size:13px;color:#666;">Loading...</div>`,
    });
    infoWindowRef.current.open({
      map: googleMapRef.current,
      anchor: clickMarkerRef.current,
    });

    try {
      const res = await fetch(
        `/api/places?action=nearby&lat=${lat}&lng=${lng}&radius=100`
      );
      const data = await res.json();
      const place = data.places?.[0];

      if (!place) {
        infoWindowRef.current?.setContent(
          `<div style="padding:4px;font-family:system-ui;font-size:13px;color:#999;">No place found here</div>`
        );
        return;
      }

      const priceLevel = priceLevelToNumber(place.priceLevel);
      const priceBadge = priceLevel !== null
        ? ["Free", "$", "$$", "$$$", "$$$$"][priceLevel]
        : "";

      const containerId = `add-btn-${Date.now()}`;
      infoWindowRef.current?.setContent(`
        <div style="padding:6px 2px;font-family:system-ui;min-width:180px;max-width:260px;">
          <div style="font-weight:600;font-size:14px;color:#111;">${place.displayName.text}</div>
          <div style="font-size:12px;color:#666;margin-top:2px;">${place.formattedAddress || ""}</div>
          <div style="display:flex;gap:6px;align-items:center;margin-top:6px;">
            ${place.rating ? `<span style="font-size:12px;color:#666;">★ ${place.rating.toFixed(1)}</span>` : ""}
            ${priceBadge ? `<span style="font-size:12px;padding:1px 6px;background:#f1f5f9;border-radius:4px;color:#334155;">${priceBadge}</span>` : ""}
            ${place.primaryType ? `<span style="font-size:11px;color:#888;">${place.primaryType.replace(/_/g, " ")}</span>` : ""}
          </div>
          <button id="${containerId}" style="
            margin-top:8px;width:100%;padding:6px 0;
            background:#2563eb;color:white;border:none;border-radius:6px;
            font-size:13px;font-weight:500;cursor:pointer;font-family:system-ui;
          ">Add to Itinerary</button>
        </div>
      `);

      google.maps.event.addListenerOnce(infoWindowRef.current!, "domready", () => {
        const btn = document.getElementById(containerId);
        if (!btn) return;

        btn.addEventListener("click", async () => {
          btn.textContent = "Adding...";
          btn.setAttribute("disabled", "true");
          btn.style.opacity = "0.6";

          let travelTime: number | undefined;
          const currentStops = stopsRef.current;
          const lastStop = currentStops[currentStops.length - 1];

          if (lastStop) {
            try {
              const dirRes = await fetch(
                `/api/directions?originLat=${lastStop.lat}&originLng=${lastStop.lng}&destLat=${place.location.latitude}&destLng=${place.location.longitude}&mode=${travelModeRef.current}`
              );
              const dirData = await dirRes.json();
              if (dirData.durationSeconds) {
                travelTime = Math.round(dirData.durationSeconds / 60);
              }
            } catch {
              // travel time optional
            }
          }

          const newStop: PlaceStop = {
            placeId: place.id,
            name: place.displayName.text,
            address: place.formattedAddress || "",
            lat: place.location.latitude,
            lng: place.location.longitude,
            priceLevel,
            category: place.primaryType || null,
            rating: place.rating,
            photoName: place.photos?.[0]?.name || undefined,
            travelMode: travelModeRef.current,
            travelTime,
          };

          addStopRef.current(newStop);

          infoWindowRef.current?.close();
          if (clickMarkerRef.current) {
            clickMarkerRef.current.map = null;
          }
        });
      });
    } catch {
      infoWindowRef.current?.setContent(
        `<div style="padding:4px;font-family:system-ui;font-size:13px;color:#d44;">Failed to load place info</div>`
      );
    }
  }, []);

  const initMap = useCallback(() => {
    if (!mapRef.current || googleMapRef.current) return;

    googleMapRef.current = new google.maps.Map(mapRef.current, {
      center: NYC_CENTER,
      zoom: 13,
      mapId: "itinerary-map",
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    googleMapRef.current.addListener("click", handleMapClick);
  }, [handleMapClick]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const script = document.getElementById("google-maps-script");
    if (script) {
      if ((window as unknown as { google?: { maps?: unknown } }).google?.maps) {
        initMap();
      }
      return;
    }

    const newScript = document.createElement("script");
    newScript.id = "google-maps-script";
    newScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,marker&v=weekly`;
    newScript.async = true;
    newScript.defer = true;
    newScript.onload = initMap;
    document.head.appendChild(newScript);
  }, [initMap]);

  useEffect(() => {
    if (!googleMapRef.current) return;

    markersRef.current.forEach((m) => (m.map = null));
    markersRef.current = [];

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (stops.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    stops.forEach((stop, index) => {
      const position = { lat: stop.lat, lng: stop.lng };
      bounds.extend(position);

      const pinElement = document.createElement("div");
      pinElement.className = "map-marker";
      pinElement.textContent = `${index + 1}`;
      pinElement.style.cssText = `
        width: 32px; height: 32px; border-radius: 50%;
        background: #2563eb; color: white; display: flex;
        align-items: center; justify-content: center;
        font-weight: bold; font-size: 14px;
        border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      `;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: googleMapRef.current!,
        position,
        content: pinElement,
        title: stop.name,
      });

      markersRef.current.push(marker);
    });

    if (stops.length > 1) {
      const path = stops.map((s) => ({ lat: s.lat, lng: s.lng }));
      polylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "#2563eb",
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map: googleMapRef.current,
      });
    }

    googleMapRef.current.fitBounds(bounds, 60);
  }, [stops]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full min-h-[400px] rounded-xl border border-border"
    />
  );
}
