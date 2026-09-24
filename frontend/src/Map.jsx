import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

const markerIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapMover({ latitude, longitude }) {
  const map = useMap();

  useEffect(() => {
    if (
      latitude !== undefined &&
      longitude !== undefined
    ) {
      map.setView(
        [Number(latitude), Number(longitude)],
        11
      );
    }
  }, [latitude, longitude, map]);

  return null;
}

function Map({
  latitude,
  longitude,
  hotspots = []
}) {
  const centerLat = Number(latitude) || 12.9716;
  const centerLon = Number(longitude) || 77.5946;

  return (
    <div
      style={{
        width: "100%",
        height: "500px",
        borderRadius: "12px",
        overflow: "hidden"
      }}
    >
      <MapContainer
        center={[centerLat, centerLon]}
        zoom={11}
        style={{
          height: "100%",
          width: "100%"
        }}
      >
        <MapMover
          latitude={centerLat}
          longitude={centerLon}
        />

        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* SELECTED LOCATION */}
        <Marker
          position={[centerLat, centerLon]}
          icon={markerIcon}
        >
          <Popup>
            <strong>📍 Selected Location</strong>
            <br />
            Latitude: {centerLat.toFixed(5)}
            <br />
            Longitude: {centerLon.toFixed(5)}
          </Popup>
        </Marker>

        {/* POLLUTION HOTSPOTS */}
        {hotspots.map((spot, index) => (
          <Marker
            key={`${spot.name}-${index}`}
            position={[
              Number(spot.latitude),
              Number(spot.longitude)
            ]}
            icon={markerIcon}
          >
            <Popup>
              <strong>{spot.name}</strong>

              <br />

              AQI: {spot.aqi ?? "--"}

              <br />

              Status: {spot.status ?? "--"}

              <br />

              PM2.5: {spot.pm25 ?? "--"}

              <br />

              PM10: {spot.pm10 ?? "--"}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default Map;