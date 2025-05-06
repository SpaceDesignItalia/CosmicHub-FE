import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./Pages/Login/Login";
import Dashboard from "./Pages/Dashboard/Dashboard";
import Sidebar, { sectionNestedItems } from "./Components/Layout/Sidebar";
import Inventory from "./Pages/Inventory/Inventory";
import Analytics from "./Pages/Analytics/Analytics";
import MobileNavBar from "./Components/Layout/MobileNavBar";
import { Icon } from "@iconify/react";
import { useLocation, useNavigate } from "react-router-dom";

// Array con le rotte principali per la navigazione
const mainRoutes = [
  { path: "/dashboard", title: "Dashboard" },
  { path: "/analytics", title: "Analytics" },
  { path: "/inventory", title: "Magazzino" },
  { path: "/clients", title: "Clienti" },
  { path: "/profile", title: "Profilo" }
];

// Funzione per ottenere il titolo della pagina in base al percorso
const getPageTitle = (pathname: string) => {
  const route = mainRoutes.find(route => route.path === pathname);
  return route?.title || "Dashboard";
};

function App() {
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = getPageTitle(location.pathname);
  
  // Gestione degli eventi touch per lo swipe
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isSwipingDirection, setIsSwipingDirection] = useState<'left' | 'right' | null>(null);
  const [swipeDistance, setSwipeDistance] = useState(0);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsSwipingDirection(null);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.targetTouches[0].clientX;
    setTouchEnd(currentX);
    
    const distance = touchStart - currentX;
    setSwipeDistance(Math.abs(distance));
    
    if (distance > 20) {
      setIsSwipingDirection('left');
    } else if (distance < -20) {
      setIsSwipingDirection('right');
    } else {
      setIsSwipingDirection(null);
    }
  };
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 100;
    const isRightSwipe = distance < -100;
    
    if (isLeftSwipe || isRightSwipe) {
      const currentIndex = mainRoutes.findIndex(route => route.path === location.pathname);
      if (currentIndex === -1) return;
      
      let newIndex;
      if (isLeftSwipe) {
        // Swipe a sinistra, vai alla pagina successiva
        newIndex = (currentIndex + 1) % mainRoutes.length;
      } else {
        // Swipe a destra, vai alla pagina precedente
        newIndex = (currentIndex - 1 + mainRoutes.length) % mainRoutes.length;
      }
      
      navigate(mainRoutes[newIndex].path);
    }
    
    // Reset
    setTouchStart(0);
    setTouchEnd(0);
    setIsSwipingDirection(null);
    setSwipeDistance(0);
  };

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Esegui controllo iniziale
    checkMobile();
    
    // Aggiungi event listener per il resize
    window.addEventListener("resize", checkMobile);
    
    // Cleanup
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="flex h-full h-screen w-full">
      {/* Mostra sidebar solo su desktop */}
      <div className="hidden md:block">
        <Sidebar defaultSelectedKey="home" items={sectionNestedItems} />
      </div>
      <div 
        className="w-full flex-1 pb-16 md:pb-0 overflow-auto relative"
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
        {/* Header mobile */}
        <div className="md:hidden sticky top-0 bg-content1 shadow-sm z-40 flex items-center px-4 py-3">
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold">{pageTitle}</h1>
          </div>
        </div>
        
        {/* Indicatori di swipe - si mostrano solo durante lo swipe */}
        {isSwipingDirection && swipeDistance > 50 && (
          <>
            <div 
              className={`fixed top-1/2 -translate-y-1/2 z-50 transition-opacity duration-300 ${
                isSwipingDirection === 'right' ? 'left-4 opacity-70' : 'left-4 opacity-0'
              }`}
            >
              <div className="bg-content1 rounded-full p-3 shadow-lg">
                <Icon icon="solar:arrow-right-linear" width={28} height={28} className="text-primary" />
              </div>
            </div>
            <div 
              className={`fixed top-1/2 -translate-y-1/2 z-50 transition-opacity duration-300 ${
                isSwipingDirection === 'left' ? 'right-4 opacity-70' : 'right-4 opacity-0'
              }`}
            >
              <div className="bg-content1 rounded-full p-3 shadow-lg">
                <Icon icon="solar:arrow-left-linear" width={28} height={28} className="text-primary" />
              </div>
            </div>
          </>
        )}
        
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
        
        {/* Barra di navigazione mobile */}
        <MobileNavBar />
      </div>
    </div>
  );
}

export default App;
