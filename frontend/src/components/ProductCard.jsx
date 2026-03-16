import "./ProductCard.css";

export default function ProductCard({
  product,
  qty,
  onQtyChange,
  onBuy,
  loading,
}) {
  return (
    <div className="product-card">
      <div className="product-img">
        {product.image ? (
          <img src={product.image} alt={product.name} />
        ) : (
          <div className="img-fallback">No image</div>
        )}
      </div>
      <div className="product-info">
        <div className="title-row">
          <h4>{product.name}</h4>
          <span className="badge">{product.num} còn</span>
        </div>
        <div className="price">₫{Number(product.price).toLocaleString()}</div>
        <div className="buy-row">
          <input
            type="number"
            min="1"
            value={qty}
            onChange={(e) => onQtyChange(Number(e.target.value))}
          />
          <button onClick={onBuy} disabled={loading || product.num === 0}>
            Mua
          </button>
        </div>
      </div>
    </div>
  );
}
