import { useEffect, useState } from "react";
import { listProducts } from "./api";

export default function App() {
  const [products, setProducts] = useState([]);
  useEffect(() => { listProducts().then(r => setProducts(r.data)); }, []);
  return (
    <div>
      <h1>Products</h1>
      <ul>{products.map(p => <li key={p.id || p._id}>{p.name} - {p.price}</li>)}</ul>
    </div>
  );
}
