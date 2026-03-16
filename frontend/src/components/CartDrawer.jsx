export default function CartDrawer({
  open,
  onClose,
  orders = [],
  products = [],
  address,
  phone,
  setAddress,
  setPhone,
  onCreateBill,
  loading,
  selectedOrderIDs = [],
  toggleOrder,
  toggleAll,
}) {
  if (!open) return null;

  const productMap = Object.fromEntries(
    products.map((p) => [String(p.id), p])
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ width: "min(520px, 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Giỏ hàng</h3>
          <button className="ghost-btn" onClick={onClose}>
            x
          </button>
        </div>
        {orders.length > 0 && (
          <div className="title-row" style={{ marginBottom: 8 }}>
            <label className="muted" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                checked={selectedOrderIDs.length === orders.length}
                onChange={toggleAll}
              />
              Chọn tất cả ({selectedOrderIDs.length}/{orders.length})
            </label>
          </div>
        )}
        <div className="list">
          {orders.length === 0 && <div className="muted">Chưa có đơn nào.</div>}
          {orders.map((o) => (
            <div
              key={o._id || o.id}
              className="card"
              style={{ boxShadow: "none", padding: "12px", borderRadius: 14 }}
            >
              <div className="title-row" style={{ alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <input
                    type="checkbox"
                    checked={selectedOrderIDs.includes(o._id || o.id)}
                    onChange={() => toggleOrder(o._id || o.id)}
                  />
                  <strong>Order #{o._id || o.id}</strong>
                </div>
                <span className="badge">{o.num} sản phẩm</span>
              </div>
              <div className="muted" style={{ marginBottom: 4 }}>
                {productMap[String(o.productID)]?.name || `productID: ${o.productID}`}
              </div>
              <div className="muted" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <span>Đơn giá: ₫{Number(o.price).toLocaleString()}</span>
                <span>SL: {o.num}</span>
                <span>Tổng: <strong>₫{Number(o.total || o.price * o.num).toLocaleString()}</strong></span>
              </div>
            </div>
          ))}
        </div>

        {orders.length > 0 && (
          <div className="form" style={{ marginTop: 14 }}>
            <input
              type="text"
              placeholder="Địa chỉ giao hàng"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            <input
              type="text"
              placeholder="Số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <button onClick={onCreateBill} disabled={loading}>
              Thanh toán (tạo hóa đơn)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
