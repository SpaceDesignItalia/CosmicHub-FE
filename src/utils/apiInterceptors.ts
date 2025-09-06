import axios, { AxiosResponse } from "axios";

// Evita di registrare più volte l'interceptor in HMR
const GLOBAL_FLAG = "__AXIOS_INTERCEPTORS_INSTALLED__" as const;
// @ts-ignore
if (!(window as any)[GLOBAL_FLAG]) {
  // @ts-ignore
  (window as any)[GLOBAL_FLAG] = true;

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const config = error?.config;
      const response = error?.response as AxiosResponse | undefined;
      const url = String(config?.url || "");

      // Intercetta 404 per endpoint non ancora implementati e ritorna mock
      if (response && response.status === 404) {
        // Low stock products: ritorna array vuoto
        if (url.includes("/Product/GET/GetLowStockProducts")) {
          const mock: AxiosResponse = {
            data: [],
            status: 200,
            statusText: "OK",
            headers: {},
            config,
          };
          return Promise.resolve(mock);
        }

        // Employees without vehicle: ritorna array vuoto
        if (
          url.includes("/Employee/GET/GetEmployeesWithoutVehicle") ||
          url.includes("/Employee/GET/GetEmplyeesWithoutVehicle")
        ) {
          const mock: AxiosResponse = {
            data: [],
            status: 200,
            statusText: "OK",
            headers: {},
            config,
          };
          return Promise.resolve(mock);
        }
      }

      return Promise.reject(error);
    }
  );
}


