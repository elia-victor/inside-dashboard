import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Use a custom marker icon from the web (this always works)
const lastPositionIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // You can replace this with any other marker URL
  iconSize: [25, 25],
  iconAnchor: [12, 15],
  popupAnchor: [1, -34],
});

export default function UserTracksMap({ data }) {
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  return (
    <MapContainer center={[-6.195, 106.509]} zoom={15} style={{ height: "80vh", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {data.map((user, idx) => {
        const positions = user.location.map(loc => [loc.lat, loc.long]);
        const lastPosition = positions[positions.length - 1];

        return (
          <div key={idx}>
            {/* Draw the user's path */}
            <Polyline
              positions={positions}
              color={getColor(idx)}
              weight={5}
              opacity={0.9} 
            />

            {/* Show only the last position marker */}
            {lastPosition && (
              <Marker position={lastPosition} icon={lastPositionIcon}>
                <Popup>
                  <div>
                    <strong>{user.name}</strong><br />
                    Last Updated: {new Date(user.location[user.location.length - 1].timestamp).toLocaleString()}
                  </div>
                </Popup>
              </Marker>
            )}
          </div>
        );
      })}
    </MapContainer>
  );
}

// Function to give each user a different color
function getColor(index) {
  const colors = ["yellow", "blue", "green", "purple", "orange"];
  return colors[index % colors.length];
}
