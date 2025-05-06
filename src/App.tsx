import { Routes, Route } from "react-router-dom";
import Login from "./Pages/Login/Login";
import Dashboard from "./Pages/Dashboard/Dashboard";
import Sidebar, { sectionNestedItems } from "./Components/Layout/Sidebar";
import Inventory from "./Pages/Inventory/Inventory";
import Analytics from "./Pages/Analytics/Analytics";
function App() {
  return (
    <div className="flex h-full h-screen w-full">
      <Sidebar defaultSelectedKey="home" items={sectionNestedItems} />
      <div className="w-full flex-1">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
