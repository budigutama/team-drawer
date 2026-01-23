import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "/api";

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.success) {
        sessionStorage.setItem("authenticated", "true");
        navigate("/");
      } else {
        setError("Username atau password salah!");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Gagal menghubungi server.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Team Drawer</h2>
        <p>Masukkan username dan password untuk melanjutkan</p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
            placeholder="Username"
            autoFocus
          />
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="Password"
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="primary-action">
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
