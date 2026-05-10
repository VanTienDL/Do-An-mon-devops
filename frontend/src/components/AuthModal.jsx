import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

export default function AuthModal({
  mode,           // 'login' | 'register'
  loading,
  onClose,
  onLogin,
  onRegister,
  switchMode,     // (mode) => void
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{mode === "login" ? "Đăng nhập" : "Đăng ký"}</h3>
          <button className="ghost-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {mode === "login" ? (
          <LoginForm onSubmit={onLogin} loading={loading} />
        ) : (
          <RegisterForm onSubmit={onRegister} loading={loading} />
        )}

        <div className="modal-footer">
          {mode === "login" ? (
            <>
              <span>Chưa có tài khoản?</span>
              <button className="link-btn" onClick={() => switchMode("register")}>
                Tạo tài khoản
              </button>
            </>
          ) : (
            <>
              <span>Đã có tài khoản?</span>
              <button className="link-btn" onClick={() => switchMode("login")}>
                Đăng nhập
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
