import React, { useEffect, useState } from "react";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

import "./App.css";
import "leaflet/dist/leaflet.css";
import UserTracksMap from "./Map/UserTracksMap";

function App() {
  const [items, setItems] = useState([]);

  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [interval, setInterval] = useState("");
  const [isRecording, setIsRecording] = useState(true);
  const [storedPassword, setStoredPassword] = useState("");
  const [sessionTime, setSessionTime] = useState(30); // default: 30 minutes

  const [originalConfig, setOriginalConfig] = useState({
    timeStart: "",
    timeEnd: "",
    interval: "",
    isRecording: true,
    password: "",
    sessionTime: 30
  });

  const [inputPassword, setInputPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  // Check session on load
  useEffect(() => {
    const authStatus = sessionStorage.getItem("authenticated");
    const expiry = sessionStorage.getItem("authExpiry");

    if (authStatus === "true" && expiry && Date.now() < Number(expiry)) {
      setAuthenticated(true);
    } else {
      sessionStorage.removeItem("authenticated");
      sessionStorage.removeItem("authExpiry");
    }
  }, []);

  // Fetch user data
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(data);
    }, (error) => {
      console.error("Error fetching user data: ", error);
    });

    return () => unsubscribe();
  }, []);

  // Fetch remote config
  useEffect(() => {
    const configRef = doc(db, "settings", "config");

    const unsubscribe = onSnapshot(configRef, (configSnap) => {
      if (configSnap.exists()) {
        const configData = configSnap.data();
        setTimeStart(configData.timeStart || "");
        setTimeEnd(configData.timeEnd || "");
        setInterval(configData.interval || "");
        setIsRecording(configData.isRecording ?? true);
        setStoredPassword(configData.password || "");
        setSessionTime(configData.sessionTime ?? 30);

        setOriginalConfig({
          timeStart: configData.timeStart || "",
          timeEnd: configData.timeEnd || "",
          interval: configData.interval || "",
          isRecording: configData.isRecording ?? true,
          password: configData.password || "",
          sessionTime: configData.sessionTime ?? 30
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
    interval !== originalConfig.interval ||
    isRecording !== originalConfig.isRecording;

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
        isRecording,
        password: storedPassword,
        sessionTime,
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
      const expireTime = Date.now() + sessionTime * 60 * 1000;
      sessionStorage.setItem("authenticated", "true");
      sessionStorage.setItem("authExpiry", expireTime.toString());
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
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px"
        }}>
          <h2 style={{ margin: 0 }}>Time Settings</h2>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem("authenticated");
              sessionStorage.removeItem("authExpiry");
              window.location.reload();
            }}
            style={{
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Logout
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: "20px",
            alignItems: "flex-end",
            marginBottom: "20px",
            width: "100%",
            flexWrap: "wrap"
          }}
        >
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
              step="0.01"
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div style={{ flex: 1, minWidth: "150px" }}>
            <label>Enable Recording:</label><br />
            <label className="switch" style={{ marginTop: "4px", display: "inline-block" }}>
              <input
                type="checkbox"
                checked={isRecording}
                onChange={(e) => setIsRecording(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>

          <button type="submit" disabled={!hasChanges}>
            Save Config
          </button>
        </div>
      </form>

      {items && <UserTracksMap data={items} />}
    </div>
  );
}

export default App;
