import axios from "axios";

export const API_URL =
  import.meta.env.VITE_API_URL?.trim() || "http://localhost:3000/api";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("farmacia_access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as
      | (typeof error.config & { _retry?: boolean })
      | undefined;

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !String(original.url ?? "").includes("/auth/login") &&
      !String(original.url ?? "").includes("/auth/refresh")
    ) {
      const refreshToken = localStorage.getItem("farmacia_refresh_token");

      if (refreshToken) {
        original._retry = true;

        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const accessToken = data.accessToken as string;

          localStorage.setItem("farmacia_access_token", accessToken);

          original.headers = {
            ...(original.headers ?? {}),
            Authorization: `Bearer ${accessToken}`,
          };

          return axios(original);
        } catch {
          localStorage.removeItem("farmacia_access_token");
          localStorage.removeItem("farmacia_refresh_token");
          localStorage.removeItem("farmacia_user");
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  },
);

export const getApiErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      "No fue posible completar la solicitud"
    );
  }

  return error instanceof Error
    ? error.message
    : "No fue posible completar la solicitud";
};
