import { useState } from "react";

export default function RegisterForm({ onSubmit, loading }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit({ name, email, password });
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <input
        placeholder="Tên"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        placeholder="Mật khẩu"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? "Đang xử lý..." : "Tạo tài khoản"}
      </button>
    </form>
  );
}
