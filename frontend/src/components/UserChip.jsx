export default function UserChip({ user, onLogout }) {
  if (!user) return null;

  return (
    <div className="user-chip">
      <span className="user-name">{user.name}</span>
      <button className="ghost-btn" onClick={onLogout}>
        Đăng xuất
      </button>
    </div>
  );
}
