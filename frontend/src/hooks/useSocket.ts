import { useState, useEffect } from 'react';

export interface Location {
    lat: number;
    lng: number;
}

export interface RouteAction {
    order_id: string;
    action: 'pickup' | 'dropoff';
    location: Location;
}

export interface Rider {
    id: string;
    location: Location;
    status: 'idle' | 'enroute' | 'delivering';
    capacity: number;
    active_route: RouteAction[];
}

export interface Order {
    id: string;
    pickup: Location;
    dropoff: Location;
    timestamp: string;
    status: 'pending' | 'batched' | 'enroute' | 'delivered';
}

export interface State {
    riders: Rider[];
    orders: Order[];
}

export function useSocket(url: string) {
    const [state, setState] = useState<State | null>(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const ws = new WebSocket(url);

        ws.onopen = () => {
            console.log("WebSocket Connected");
            setConnected(true);
        };

        ws.onclose = () => {
            console.log("WebSocket Disconnected");
            setConnected(false);
        };

        ws.onerror = (event) => {
            // Next.js StrictMode can abort the WS connection instantly during double-invoke, causing an empty event error.
            // We ignore empty socket errors to prevent the dev overlay from popping up.
            if (ws.readyState === WebSocket.OPEN) {
                console.error("WebSocket Error:", event);
            }
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as State;
                setState(data);
            } catch (err) {
                console.error("Failed to parse message:", err);
            }
        };

        return () => {
            ws.close();
        };
    }, [url]);

    return { state, connected };
}
