import { useState } from "react";
import { Plus, Home as HomeIcon, BarChart2 } from "lucide-react";
import Home from "./pages/Home";
import Overview from "./pages/Overview";
import AddTransaction from "./pages/AddTransaction";
import "./App.css";

function App() {
  const [activeScreen, setActiveScreen] = useState("home");

  return (
    <div className="app-container">
      {/* AREA HALAMAN */}
      <div className="main-content">
        {activeScreen === "home" && <Home />}
        {activeScreen === "overview" && <Overview />}

        {/* Pass parameter onClose agar form bisa kembali ke home */}
        {activeScreen === "add" && (
          <AddTransaction onClose={() => setActiveScreen("home")} />
        )}
      </div>

      {/* BOTTOM NAVIGATION (Disembunyikan saat activeScreen === 'add') */}
      {activeScreen !== "add" && (
        <nav className="bottom-nav">
          <div className="nav-container">
            <div
              className="nav-item"
              onClick={() => setActiveScreen("home")}
              style={{
                backgroundColor:
                  activeScreen === "home" ? "white" : "transparent",
                color: activeScreen === "home" ? "black" : "white",
              }}
            >
              <HomeIcon size={28} />
            </div>
            <div
              className="nav-item"
              onClick={() => setActiveScreen("add")}
              style={{
                backgroundColor:
                  activeScreen === "add" ? "white" : "transparent",
                color: activeScreen === "add" ? "black" : "white",
              }}
            >
              <Plus size={32} />
            </div>
            <div
              className="nav-item"
              onClick={() => setActiveScreen("overview")}
              style={{
                backgroundColor:
                  activeScreen === "overview" ? "white" : "transparent",
                color: activeScreen === "overview" ? "black" : "white",
              }}
            >
              <BarChart2 size={28} />
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}

export default App;
