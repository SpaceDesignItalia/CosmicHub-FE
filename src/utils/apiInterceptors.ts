import axios from 'axios';

// Simulazione di un database locale per i prodotti
let localProductsCache: any[] = [];

// Interceptor per simulare gli endpoint mancanti
axios.interceptors.request.use(
  (config) => {
    // Intercetta le chiamate agli endpoint di aggiornamento quantità
    if (config.url?.includes('/Product/PUT/UpdateProductQuantity/') || 
        config.url?.includes('/Product/PUT/UpdateProduct/')) {
      
      console.log('🔄 Intercepting product update request:', config.url, config.data);
      
      // Simula una risposta di successo
      return Promise.reject({
        isIntercepted: true,
        response: {
          status: 200,
          data: { success: true, message: 'Quantità aggiornata con successo' }
        }
      });
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor per gestire le risposte simulate
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // Se è un errore intercettato (simulato), restituisci una risposta di successo
    if (error.isIntercepted) {
      console.log('✅ Simulated API response:', error.response);
      return Promise.resolve(error.response);
    }
    
    return Promise.reject(error);
  }
);

export default axios; 