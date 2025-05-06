import { Routes, Route, useLocation } from "react-router-dom";
import Dashboard from "./Pages/Dashboard/Dashboard";
import Sidebar, { sectionNestedItems } from "./Components/Layout/Sidebar";
import Inventory from "./Pages/Inventory/Inventory";
import Analytics from "./Pages/Analytics/Analytics";
import Authentication from "./Pages/Authentication/Authentication";

function App() {
  const location = useLocation();
  const isAuthPage =
    location.pathname === "/" || location.pathname === "/login";

  return (
    <div className="flex h-screen w-full flex-row">
      {!isAuthPage && (
        <Sidebar defaultSelectedKey="home" items={sectionNestedItems} />
      )}

      <Routes>
        <Route path="/" element={<Authentication />} />
        <Route path="/login" element={<Authentication />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </div>
  );
}

export default App;
