import { GoogleMap, LoadScript, Polyline, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100vh'
};

const center = {
  lat: -6.195,
  lng: 106.509
};

export default function UserTracksMapGMaps({ data }) {
  const API_KEY = process.env.REACT_APP_GMAPS_API_KEY;

  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  return (
    <LoadScript googleMapsApiKey={API_KEY}>
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={15}>

        {data.map((user, idx) => {
          const path = user.location.map(loc => ({ lat: loc.lat, lng: loc.long }));
          const lastPos = path[path.length - 1];

          return (
            <div key={idx}>
              <Polyline
                path={path}
                options={{
                  strokeColor: getColor(idx),
                  strokeOpacity: 0.8,
                  strokeWeight: 5
                }}
              />

              {lastPos && (
                <Marker
                  position={lastPos}
                  title={`${user.name} - Last Position`}
                />
              )}
            </div>
          );
        })}

      </GoogleMap>
    </LoadScript>
  );
}

function getColor(index) {
  const colors = ["red", "blue", "green", "purple", "orange"];
  return colors[index % colors.length];
}
