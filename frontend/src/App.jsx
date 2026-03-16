import { useEffect, useState, useCallback } from "react";
import {
  listProducts,
  login,
  register,
  buyProducts,
  fetchOrders,
  fetchBills,
  createBill,
} from "./api";
import AuthModal from "./components/AuthModal";
import UserChip from "./components/UserChip";
import ProductCard from "./components/ProductCard";
import CartDrawer from "./components/CartDrawer";
import BillDrawer from "./components/BillDrawer";
import "./App.css";
import "./components/Topbar.css";

export default function App() {
  const [products, setProducts] = useState([]);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("");
  const [qty, setQty] = useState({});
  const [orders, setOrders] = useState([]);
  const [selectedOrderIDs, setSelectedOrderIDs] = useState([]);
  const [bills, setBills] = useState([]);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [authModal, setAuthModal] = useState(null); // 'login' | 'register' | null
  const [cartOpen, setCartOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await listProducts();
      setProducts(res.data);
    } catch {
      setStatus("Không tải được danh sách sản phẩm.");
    }
  };

  const loadOrders = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetchOrders(user.id);
      const list = res.data || [];
      setOrders(list);
      setSelectedOrderIDs(list.map((o) => o._id || o.id));
    } catch {
      setStatus("Không tải được đơn hàng.");
    }
  }, [user]);

  const loadBills = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetchBills(user.id);
      setBills(res.data || []);
    } catch {
      setStatus("Không tải được hóa đơn.");
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setBills([]);
      return;
    }
    loadOrders();
    loadBills();
  }, [user, loadBills, loadOrders]);

  const handleLogin = async ({ email, password }) => {
    setLoading(true);
    setStatus("");
    try {
      const res = await login(email, password);
      if (!res.data) {
        setStatus("Sai email hoặc mật khẩu.");
      } else {
        setUser(res.data);
        setStatus(`Xin chào ${res.data.name}!`);
      }
    } catch {
      setStatus("Không đăng nhập được.");
    } finally {
      setLoading(false);
      setAuthModal(null);
    }
  };

  const handleRegister = async ({ name, email, password }) => {
    setLoading(true);
    setStatus("");
    try {
      const res = await register(name, email, password);
      setUser(res.data);
      setStatus("Hello " + res.data.name + ", tài khoản đã được tạo!");
    } catch {
      setStatus("Không đăng ký được.");
    } finally {
      setLoading(false);
      setAuthModal(null);
    }
  };

  const handleBuy = async (p) => {
    if (!user) {
      setAuthModal("login");
      setStatus("Hãy đăng nhập để mua hàng.");
      return;
    }
    const count = Number(qty[p.id] || 1);
    if (count <= 0) {
      setStatus("Số lượng phải lớn hơn 0.");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      await buyProducts([{ userID: String(user.id), itemID: p.id, count }]);
      setStatus(`Đã mua ${count} x ${p.name}.`);
      await Promise.all([loadProducts(), loadOrders(), loadBills()]);
    } catch (err) {
      setStatus(err?.response?.data?.message || "Không mua được sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBill = async () => {
    if (!user) {
      setAuthModal("login");
      setStatus("Đăng nhập để tạo hóa đơn.");
      return;
    }
    if (!orders.length) {
      setStatus("Không có đơn hàng để tạo hóa đơn.");
      return;
    }
    if (!selectedOrderIDs.length) {
      setStatus("Chọn ít nhất một đơn để tạo hóa đơn.");
      return;
    }
    if (!address || !phone) {
      setStatus("Nhập địa chỉ và số điện thoại.");
      return;
    }
    setLoading(true);
    setStatus("");
    try {
      await createBill({
        userID: String(user.id),
        orderIDs: selectedOrderIDs,
        address,
        phone,
      });
      setStatus("Đã tạo hóa đơn.");
      await Promise.all([loadBills(), loadOrders()]);
      setBillOpen(true);
    } catch (err) {
      setStatus(err?.response?.data?.error || "Không tạo được hóa đơn.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span className="brand-name">Flower Shop Demo</span>
        </div>
        <nav className="topbar-actions">
          {user ? (
            <>
              <button className="icon-btn" onClick={() => setBillOpen(true)} title="Hóa đơn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2h12v20l-3-2-3 2-3-2-3 2z" />
                  <path d="M9 6h6M9 10h6M9 14h4" />
                </svg>
                <span>{bills.length}</span>
              </button>
          <button className="icon-btn" onClick={() => setCartOpen(true)} title="Giỏ hàng">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6h15l-1.5 9h-12z" />
              <circle cx="9" cy="20" r="1.2" />
              <circle cx="18" cy="20" r="1.2" />
                  <path d="M6 6l-1-2H3" />
                </svg>
                <span>{orders.length}</span>
              </button>
              <UserChip
                user={user}
                onLogout={() => {
                  setUser(null);
                  setStatus("Đã đăng xuất.");
                }}
              />
            </>
          ) : (
            <>
              <button
                className="icon-btn"
                onClick={() => {
                  setAuthModal("login");
                  setStatus("Đăng nhập để xem hóa đơn.");
                }}
                title="Hóa đơn"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2h12v20l-3-2-3 2-3-2-3 2z" />
                  <path d="M9 6h6M9 10h6M9 14h4" />
                </svg>
              </button>
              <button
                className="icon-btn"
                onClick={() => {
                  setAuthModal("login");
                  setStatus("Đăng nhập để xem giỏ.");
                }}
                title="Giỏ hàng"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6h15l-1.5 9h-12z" />
                  <circle cx="9" cy="20" r="1.2" />
                  <circle cx="18" cy="20" r="1.2" />
                  <path d="M6 6l-1-2H3" />
                </svg>
              </button>
              <button className="ghost-btn" onClick={() => setAuthModal("login")}>
                Đăng nhập
              </button>
              <button className="ghost-btn" onClick={() => setAuthModal("register")}>
                Đăng ký
              </button>
            </>
          )}
        </nav>
      </header>
      <div className="page-content">
  

      {status && <div className="status">{status}</div>}

      <section className="card">
        <div className="section-header">
          <h2>Sản phẩm</h2>
          <span className="muted">Chọn số lượng và bấm “Mua”</span>
        </div>
        <div className="grid product-grid">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              qty={qty[p.id] ?? 1}
              onQtyChange={(val) => setQty({ ...qty, [p.id]: val })}
              onBuy={() => handleBuy(p)}
              loading={loading}
            />
          ))}
          {products.length === 0 && (
            <div className="muted">Không có sản phẩm.</div>
          )}
        </div>
      </section>

  
      </div>

      {authModal && (
        <AuthModal
          mode={authModal}
          loading={loading}
          onClose={() => setAuthModal(null)}
          onLogin={handleLogin}
          onRegister={handleRegister}
          switchMode={setAuthModal}
        />
      )}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        orders={orders}
        products={products}
        address={address}
        phone={phone}
        setAddress={setAddress}
        setPhone={setPhone}
        onCreateBill={handleCreateBill}
        loading={loading}
        selectedOrderIDs={selectedOrderIDs}
        toggleOrder={(id) =>
          setSelectedOrderIDs((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
          )
        }
        toggleAll={() =>
          setSelectedOrderIDs((prev) =>
            prev.length === orders.length ? [] : orders.map((o) => o._id || o.id)
          )
        }
      />
      <BillDrawer open={billOpen} onClose={() => setBillOpen(false)} bills={bills} />
    </div>
  );
}
