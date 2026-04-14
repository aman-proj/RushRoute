"use client";
import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useSocket } from '../hooks/useSocket';

// Dynamically import Leaflet components to avoid SSR errors
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then((mod) => mod.Polyline), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then((mod) => mod.CircleMarker), { ssr: false });

// Leaflet CSS needs to be required
import 'leaflet/dist/leaflet.css';

// Setup custom icons
let riderIcon: any, pickupIcon: any, dropoffIcon: any;
if (typeof window !== 'undefined') {
  const L = require('leaflet');
  
  riderIcon = new L.DivIcon({
    className: 'custom-div-icon',
    html: "<div style='background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px #3b82f6;'></div>",
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
  
  pickupIcon = new L.DivIcon({
    className: 'custom-div-icon',
    html: "<div style='background-color: #22c55e; width: 10px; height: 10px; border-radius: 50%; border: 2px solid black;'></div>",
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });

  dropoffIcon = new L.DivIcon({
    className: 'custom-div-icon',
    html: "<div style='background-color: #ef4444; width: 10px; height: 10px; border-radius: 0; border: 2px solid black;'></div>",
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
}

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#22c55e', '#14b8a6', '#0ea5e9', '#6366f1', '#a855f7', '#ec4899'];

export default function MapDashboard() {
  const { state, connected } = useSocket('ws://localhost:8000/ws');
  
  // Center: New Delhi (Connaught Place)
  const center: [number, number] = [28.6304, 77.2177];

  return (
    <div className="flex h-full w-full">
      {/* Map Area */}
      <div className="flex-1 relative h-full rounded-2xl overflow-hidden border border-slate-700/50 shadow-2xl">
        {typeof window !== 'undefined' && (
          <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            {/* Dark Mode Tile Layer */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />
            
            {/* Render Riders */}
            {state?.riders.map(rider => (
              <Marker key={rider.id} position={[rider.location.lat, rider.location.lng]} icon={riderIcon}>
                <Popup className="dark-popup">
                  <div className="text-slate-900 font-semibold text-xs">Rider: {rider.id}</div>
                  <div className="text-slate-600 font-medium text-[10px]">Status: {rider.status}</div>
                </Popup>
              </Marker>
            ))}

            {/* Render Active Routes */}
            {state?.riders.filter(r => r.active_route?.length > 0).map((rider, i) => {
              const color = COLORS[i % COLORS.length];
              const positions: [number, number][] = [
                [rider.location.lat, rider.location.lng],
                ...rider.active_route.map(pos => [pos.location.lat, pos.location.lng] as [number, number])
              ];

              return (
                <Polyline 
                  key={`route-${rider.id}`} 
                  positions={positions} 
                  pathOptions={{ color, weight: 3, opacity: 0.8, dashArray: '6, 6' }} 
                />
              );
            })}

            {/* Render Orders (Pending & Batched) */}
            {state?.orders.filter(o => o.status !== 'delivered').map((order) => (
              <div key={`order-${order.id}`}>
                <Marker position={[order.pickup.lat, order.pickup.lng]} icon={pickupIcon} />
                <Marker position={[order.dropoff.lat, order.dropoff.lng]} icon={dropoffIcon} />
                {/* Connecting line between pickup and dropoff for visualizing order */}
                <Polyline 
                  positions={[[order.pickup.lat, order.pickup.lng], [order.dropoff.lat, order.dropoff.lng]]} 
                  pathOptions={{ color: '#475569', weight: 1, opacity: 0.3 }} 
                />
              </div>
            ))}
          </MapContainer>
        )}
        
        {/* Status indicator */}
        <div className="absolute top-4 right-4 z-[400] bg-slate-900/80 backdrop-blur pb-px pt-0.5 px-3 rounded-full border border-slate-700 shadow-lg flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}></div>
          <span className="text-xs font-semibold tracking-wide text-slate-300">
            {connected ? 'LIVE' : 'DISCONNECTED'}
          </span>
        </div>
      </div>
    </div>
  );
}
