import axios from "axios";
const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE });

export const login = (email, password) => api.post("/user/login", { email, password });
export const register = (name, email, password) => api.post("/user/register", { name, email, password });
export const listProducts = () => api.get("/products");
export const buyProducts = (items) => api.post("/products/buy", items);
export const fetchOrders = (userID) => api.get("/purchase/order", { params: { userID } });
export const fetchBills = (userID) => api.get("/purchase/bill", { params: { userID } });
export const createOrder = (payload) => api.post("/purchase/create-order", payload);
export const createBill = (payload) => api.post("/purchase/create-bill", payload);
