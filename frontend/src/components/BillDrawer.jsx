export default function BillDrawer({ open, onClose, bills = [] }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ width: "min(520px, 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>Hóa đơn</h3>
          <button className="ghost-btn" onClick={onClose}>
            xc
          </button>
        </div>
        <div className="list">
          {bills.length === 0 && <div className="muted">Chưa có hóa đơn.</div>}
          {bills.map((b) => (
            <div
              key={b._id || b.id}
              className="card"
              style={{ boxShadow: "none", padding: "12px" }}
            >
              <div className="title-row">
                <strong>Bill #{b._id || b.id}</strong>
                <span className="badge">
                  {Array.isArray(b.orderIDs) ? b.orderIDs.length : 0} orders
                </span>
              </div>
              <div className="muted" style={{ marginBottom: 4 }}>
                Tổng: <strong>₫{Number(b.total || 0).toLocaleString()}</strong>
              </div>
              <div className="muted" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span>Địa chỉ: {b.address || "N/A"}</span>
                <span>Phone: {b.phone || "N/A"}</span>
              </div>
              {Array.isArray(b.orderIDs) && b.orderIDs.length > 0 && (
                <div className="muted" style={{ marginTop: 6, fontSize: 13 }}>
                  Order IDs: {b.orderIDs.join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
