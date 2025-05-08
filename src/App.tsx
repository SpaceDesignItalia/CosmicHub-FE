import axios from "axios";
import { useEffect, useState } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Sidebar, { sectionNestedItems } from "./Components/Layout/Sidebar";
import Analytics from "./Pages/Analytics/Analytics";
import Authentication from "./Pages/Authentication/Authentication";
import Dashboard from "./Pages/Dashboard/Dashboard";
import Products from "./Pages/Inventory/Products";
import Vehicles from "./Pages/Inventory/Vehicles";
import Settings from "./Pages/Settings/Settings";
import AddVehicle from "./Pages/Inventory/AddVehicle";
import EditVehicle from "./Pages/Inventory/EditVehicle";

function App() {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL;
  axios.defaults.withCredentials = true;

  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkSession = async () => {
    try {
      const res = await axios.get("/Authentication/GET/CheckSession", {
        withCredentials: true,
      });

      if (res.status === 200 && res.data) {
        setIsAuth(true);
      } else {
        setIsAuth(false);
      }
    } catch (error) {
      console.error("Errore durante il controllo della sessione:", error);
      setIsAuth(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await checkSession();
    };

    fetchData();

    // Check session every 10 minutes
    const sessionInterval = setInterval(() => {
      checkSession();
    }, 10 * 60 * 1000);

    return () => clearInterval(sessionInterval);
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  console.log(isAuth);

  const EmployeeProtectedRoutes: React.FC = () => {
    return (
      <Routes>
        <Route element={<Outlet />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory/products" element={<Products />} />
          <Route path="/inventory/vehicles" element={<Vehicles />} />
          <Route
            path="/inventory/vehicles/add-vehicle"
            element={<AddVehicle />}
          />
          <Route
            path="/inventory/vehicles/edit/:id"
            element={<EditVehicle />}
          />
          <Route path="/analytics" element={<Analytics />} />
        </Route>
      </Routes>
    );
  };

  return (
    <div className="flex h-screen w-full flex-row">
      {isAuth && (
        <Sidebar defaultSelectedKey="home" items={sectionNestedItems} />
      )}

      <Routes>
        {!isAuth && (
          <>
            <Route path="/" element={<Authentication />} />
            <Route path="/login" element={<Authentication />} />
          </>
        )}
        <Route
          path="/"
          element={
            isAuth ? <Navigate to="/dashboard" replace /> : <Authentication />
          }
        />
        <Route
          path="/login"
          element={
            isAuth ? <Navigate to="/dashboard" replace /> : <Authentication />
          }
        />
        <Route
          path="/*"
          element={
            isAuth ? (
              <EmployeeProtectedRoutes />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}

export default App;
