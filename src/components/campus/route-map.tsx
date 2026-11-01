"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface RouteMapProps {
  tasks: Array<{
    id: string;
    targetName: string;
    address: string;
    type: "PICKUP" | "DELIVERY";
    status: string;
    sequence: number;
  }>;
}

// Koordinat simulasi area kampus UI Depok
const CAMPUS_COORDS: Record<string, [number, number]> = {
  "Kantin Bu Slamet": [-6.3638, 106.8285],
  "Ayam Geprek Mas Kris": [-6.3615, 106.8242],
  "Kopi & Toast Mahasiswa": [-6.3655, 106.8315],
  "Gedung A - Rektorat": [-6.3629, 106.8311],
  "Gedung B - Fakultas Teknik": [-6.3608, 106.8252],
  "Gedung C - Fakultas Ekonomi": [-6.3662, 106.8288],
  "Gedung D - Perpustakaan Pusat": [-6.3658, 106.8322],
  "Asrama Mahasiswa Putra": [-6.3585, 106.8295],
  "Asrama Mahasiswa Putri": [-6.3582, 106.8312],
};

export default function RouteMap({ tasks }: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([-6.3638, 106.8285], 15);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Bersihkan marker/layer lama kecuali tileLayer
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) {
        map.removeLayer(layer);
      }
    });

    const latlngs: [number, number][] = [];

    tasks.forEach((task) => {
      const coord = CAMPUS_COORDS[task.targetName] || [
        -6.363 + (Math.random() - 0.5) * 0.005,
        106.828 + (Math.random() - 0.5) * 0.005,
      ];
      latlngs.push(coord);

      const isPickup = task.type === "PICKUP";
      const isDone = task.status === "COMPLETED";

      const color = isDone ? "#10b981" : isPickup ? "#0f766e" : "#8b5cf6";

      const customIcon = L.divIcon({
        className: "custom-map-pin",
        html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 9999px; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 11px; box-shadow: 0 2px 4px rgba(0,0,0,0.25);">
          ${task.sequence}
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker(coord, { icon: customIcon })
        .addTo(map)
        .bindPopup(
          `<strong>#${task.sequence} ${isPickup ? "Ambil di:" : "Antar ke:"}</strong><br/>${task.targetName}<br/><span style="font-size: 11px; color: gray;">${task.address}</span>`
        );
    });

    // Gambar polyline rute multi-drop
    if (latlngs.length > 1) {
      const polyline = L.polyline(latlngs, {
        color: "#0f766e",
        weight: 3,
        dashArray: "6, 6",
      }).addTo(map);
      map.fitBounds(polyline.getBounds(), { padding: [30, 30] });
    }
  }, [tasks]);

  return (
    <div className="relative w-full h-[320px] rounded-2xl overflow-hidden border border-slate-200 z-0">
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}

