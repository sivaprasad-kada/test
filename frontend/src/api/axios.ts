import axios from "axios";

const isProduction = import.meta.env.PROD;

export const baseURL = isProduction
  ? "https://api.shortly.sivaprasadkada.tech/api"
  : (import.meta.env.VITE_API_URL || "http://localhost:5000/api");

export const backendBase = baseURL.replace(/\/api$/, "");

const api = axios.create({
  baseURL,
  withCredentials: true, // send session cookies on every request
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
