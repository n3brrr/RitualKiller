import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../types";
import "../styles/login.css";

interface LoginPageProps {
  onAuth: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onAuth }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mock authentication logic
    if (username && password) {
      const user: User = {
        id: "demo-" + Math.random().toString(36).substr(2, 9),
        username: username,
        essence: 0,
        rank: "Unkindled",
        inventory: [],
        created_at: new Date().toISOString(),
      };

      onAuth(user);
      navigate("/app/dashboard");
    }
  };

  return (
    <div className="login-container">
      <style>{`
                .login-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background: #111;
                    width: 100%;
                    overflow: hidden;
                    position: fixed; /* Ensure it covers everything */
                    top: 0;
                    left: 0;
                    z-index: 100;
                }
             `}</style>

      <div className="login-ring">
        <i style={{ "--clr": "#00ff0a" } as React.CSSProperties}></i>
        <i style={{ "--clr": "#ff0057" } as React.CSSProperties}></i>
        <i style={{ "--clr": "#fffd44" } as React.CSSProperties}></i>

        <div className="login">
          <h2>Login</h2>
          <form className="w-full flex flex-col gap-5" onSubmit={handleSubmit}>
            <div className="inputBx">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="inputBx">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="inputBx">
              <input type="submit" value="Sign in" />
            </div>
          </form>
          <div className="links">
            <a href="#">Forget Password</a>
            <a href="#">Signup</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
