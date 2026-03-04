import axios from "axios";
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE });

export const login = (email, password) => api.post("/user/login", { email, password });
export const register = (name, email, password) => api.post("/user/register", { name, email, password });
export const listProducts = () => api.get("/products");
export const createOrder = (payload) => api.post("/purchase/create-order", payload);
export const createBill = (payload) => api.post("/purchase/create-bill", payload);
