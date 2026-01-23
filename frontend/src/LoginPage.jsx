import { useState } from "react";
import { useNavigate } from "react-router-dom";

const HARDCODED_PASSWORD = "sixam";

function LoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === HARDCODED_PASSWORD) {
      sessionStorage.setItem("authenticated", "true");
      navigate("/");
    } else {
      setError("Password salah!");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Team Drawer</h2>
        <p>Masukkan password untuk melanjutkan</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            placeholder="Password"
            autoFocus
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
