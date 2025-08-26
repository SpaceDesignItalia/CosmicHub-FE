import axios from "axios";
import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./Components/Layout/AppLayout";
import Analytics from "./Pages/Analytics/Analytics";
import Authentication from "./Pages/Authentication/Authentication";
import Dashboard from "./Pages/Dashboard/Dashboard";
import Products from "./Pages/Inventory/Products";
import GlobalProductSearch from "./Pages/Inventory/GlobalProductSearch";
import Settings from "./Pages/Settings/Settings";
import AddWarehouse from "./Pages/Inventory/AddWarehouse";
import EditWarehouse from "./Pages/Inventory/EditWarehouse";
import WarehouseDetail from "./Pages/Warehouses/WarehouseDetail";
import ProductAdd from "./Pages/Inventory/ProductAdd";
import ProductEdit from "./Pages/Inventory/ProductEdit";
import Categories from "./Pages/Inventory/Categories";
import CategoryAdd from "./Pages/Inventory/CategoryAdd";
import AddVehicle from "./Pages/Inventory/AddVehicle";
import EditVehicle from "./Pages/Inventory/EditVehicle";
import Vehicles from "./Pages/Inventory/Vehicles";
import Suppliers from "./Pages/Suppliers/Suppliers";
import WarehouseMovement from "./Pages/Inventory/WarehouseMovement";
import Team from "./Pages/Team/Team";
import DDTManagement from "./Pages/Inventory/DDTManagement";
import VehicleDocuments from "./Pages/Documents/VehicleDocuments";
import CompanyDocuments from "./Pages/Documents/CompanyDocuments";
import EmployeeDocuments from "./Pages/Documents/EmployeeDocuments";
import DocumentReminders from "./Pages/Documents/DocumentReminders";
import Customers from "./Pages/Customers/Customers";
import AddCustomer from "./Pages/Customers/AddCustomer";
import CustomerDetail from "./Pages/Customers/CustomerDetail";
// Interventions imports
import InterventionsList from "./Pages/Interventions/InterventionsList";
import InterventionsMap from "./Pages/Interventions/InterventionsMap";
import AddIntervention from "./Pages/Interventions/AddIntervention";
// RIMOSSO: import InterventionAssign
import InterventionDetail from "./Pages/Interventions/InterventionDetail";
import InterventionEdit from "./Pages/Interventions/InterventionEdit";
import InterventionStart from "./Pages/Interventions/InterventionStart";
import InterventionComplete from "./Pages/Interventions/InterventionComplete";
import InterventionReassign from "./Pages/Interventions/InterventionReassign";
// CalendarAurora system imports
import CalendarAurora from "./Pages/CalendarAurora/Calendar";
import { SidebarProvider } from "./providers/SidebarProvider";

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

  return (
    <SidebarProvider>
      <Routes>
        {!isAuth ? (
          <>
            <Route path="/login" element={<Authentication />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/calendar" element={<CalendarAurora />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:customerId" element={<CustomerDetail />} />
            <Route path="/customers/add" element={<AddCustomer />} />
            {/* Interventions routes */}
            <Route path="/interventions" element={<InterventionsList />} />
            <Route path="/interventions/map" element={<InterventionsMap />} />
            <Route path="/interventions/add" element={<AddIntervention />} />
            {/* RIMOZIONE: pagina di assegnazione interventi non più usata */}
            <Route path="/interventions/:id" element={<InterventionDetail />} />
            <Route
              path="/interventions/edit/:id"
              element={<InterventionEdit />}
            />
            <Route
              path="/interventions/start/:id"
              element={<InterventionStart />}
            />
            <Route
              path="/interventions/complete/:id"
              element={<InterventionComplete />}
            />
            <Route
              path="/interventions/reassign/:id"
              element={<InterventionReassign />}
            />
            <Route path="/inventory/products" element={<Products />} />
            <Route
              path="/inventory/products/search"
              element={<GlobalProductSearch />}
            />
            <Route path="/inventory/products/add" element={<ProductAdd />} />
            <Route
              path="/inventory/products/edit/:id"
              element={<ProductEdit />}
            />
            <Route path="/inventory/categories" element={<Categories />} />
            <Route path="/inventory/categories/add" element={<CategoryAdd />} />
            <Route path="/inventory/vehicles" element={<Vehicles />} />
            <Route path="/inventory/vehicles/add" element={<AddVehicle />} />
            <Route
              path="/inventory/vehicles/edit/:id"
              element={<EditVehicle />}
            />
            <Route
              path="/inventory/warehouses/add"
              element={<AddWarehouse />}
            />
            <Route
              path="/inventory/warehouses/edit/:id"
              element={<EditWarehouse />}
            />
            <Route
              path="/inventory/movements"
              element={<WarehouseMovement />}
            />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/team" element={<Team />} />
            <Route path="/documents/ddt" element={<DDTManagement />} />
            <Route path="/documents/vehicles" element={<VehicleDocuments />} />
            <Route path="/documents/company" element={<CompanyDocuments />} />
            <Route
              path="/documents/employees"
              element={<EmployeeDocuments />}
            />
            <Route
              path="/documents/reminders"
              element={<DocumentReminders />}
            />
            <Route path="/warehouses/:id" element={<WarehouseDetail />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        )}
      </Routes>
    </SidebarProvider>
  );
}

export default App;
