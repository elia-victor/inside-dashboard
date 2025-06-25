// src/App.js
import React, { useEffect, useState } from "react";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

import "leaflet/dist/leaflet.css";
import UserTracksMap from "./Map/UserTracksMap";
// import UserTracksGmaps from "./Map/UserTracksGmaps";

function App() {
  const [items, setItems] = useState([]);
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [interval, setInterval] = useState("");
  const [storedPassword, setStoredPassword] = useState("");

  const [originalConfig, setOriginalConfig] = useState({
    timeStart: "",
    timeEnd: "",
    interval: "",
    password: ""
  });

  const [inputPassword, setInputPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(data);
    }, (error) => {
      console.error("Error fetching user data: ", error);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const configRef = doc(db, "settings", "config");

    const unsubscribe = onSnapshot(configRef, (configSnap) => {
      if (configSnap.exists()) {
        const configData = configSnap.data();
        setTimeStart(configData.timeStart || "");
        setTimeEnd(configData.timeEnd || "");
        setInterval(configData.interval || "");
        setStoredPassword(configData.password || "");

        setOriginalConfig({
          timeStart: configData.timeStart || "",
          timeEnd: configData.timeEnd || "",
          interval: configData.interval || "",
          password: configData.password || ""
        });
      }
    }, (error) => {
      console.error("Error fetching config:", error);
    });

    return () => unsubscribe();
  }, []);

  const hasChanges =
    timeStart !== originalConfig.timeStart ||
    timeEnd !== originalConfig.timeEnd ||
    interval !== originalConfig.interval;

  const handleSaveConfig = async (e) => {
    e.preventDefault();

    if (!timeStart || !timeEnd || !interval) {
      alert("All fields are required");
      return;
    }

    const [startHours, startMinutes] = timeStart.split(":").map(Number);
    const [endHours, endMinutes] = timeEnd.split(":").map(Number);

    const totalStartMinutes = startHours * 60 + startMinutes;
    const totalEndMinutes = endHours * 60 + endMinutes;

    if (totalStartMinutes >= totalEndMinutes) {
      alert("Time Start must be earlier than Time End");
      return;
    }

    try {
      await setDoc(doc(db, "settings", "config"), {
        timeStart,
        timeEnd,
        interval,
        password: storedPassword,
        updatedAt: new Date().toISOString()
      });
      alert("Config saved to Firestore!");
    } catch (error) {
      console.error("Error saving config: ", error);
      alert("Failed to save config");
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (inputPassword === storedPassword) {
      setAuthenticated(true);
    } else {
      alert("Incorrect Password");
    }
  };

  if (!authenticated) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Enter Password to Access Settings</h2>
        <form onSubmit={handlePasswordSubmit}>
          <input
            type="password"
            placeholder="Enter Password"
            value={inputPassword}
            onChange={(e) => setInputPassword(e.target.value)}
          />
          <button type="submit" style={{ marginLeft: "10px" }}>
            Enter
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <form onSubmit={handleSaveConfig} style={{ marginBottom: 20 }}>
        <h2>Time Settings</h2>

        <div style={{
          display: "flex",
          gap: "20px",
          alignItems: "flex-end",
          marginBottom: "20px",
          width: "100%",
          flexWrap: "wrap"
        }}>
          <div style={{ flex: 1, minWidth: "150px" }}>
            <label>Time Start:</label><br />
            <input
              type="time"
              value={timeStart}
              onChange={(e) => setTimeStart(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ flex: 1, minWidth: "150px" }}>
            <label>Time End:</label><br />
            <input
              type="time"
              value={timeEnd}
              onChange={(e) => setTimeEnd(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ flex: 1, minWidth: "150px" }}>
            <label>Interval (Minutes):</label><br />
            <input
              type="number"
              min="0.01"
              step="0.01" // Allows decimal input
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <button type="submit" disabled={!hasChanges}>
            Save Config
          </button>
        </div>
      </form>

      {items && <UserTracksMap data={items} />}
      {/* {items && <UserTracksGmaps data={items} />} */}
    </div>
  );
}

export default App;
