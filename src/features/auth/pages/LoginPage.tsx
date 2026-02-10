import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/types";
import { signInWithEmail, signUpWithEmail } from "@/services/authService";
import { useAuthStore } from "@/features/auth/stores/useAuthStore";
import "@/styles/login.css";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Maneja el login/registro por email y contraseña
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = isSignUp
        ? await signUpWithEmail(email, password, username)
        : await signInWithEmail(email, password);

      if (result.error) {
        setError(result.error.message);
        setLoading(false);
        return;
      }

      // Crea el objeto usuario a partir de la respuesta de autenticación
      if (result.data?.user) {
        // Determina si es admin por metadata o por credenciales de prueba
        const isAdminUser =
          result.data.user.user_metadata?.isAdmin ||
          (email.toLowerCase() === "admin" && password === "admin");

        const user: User = {
          id: result.data.user.id,
          username:
            result.data.user.user_metadata?.username ||
            username ||
            result.data.user.email?.split("@")[0] ||
            "Usuario",
          essence: isAdminUser ? 10000 : 0, // Asigna más esencia a admin
          rank: isAdminUser ? "Semidiós" : "Iniciado",
          inventory: isAdminUser ? ["admin-badge"] : [],
          created_at: new Date().toISOString(),
          isAdmin: isAdminUser,
          avatar_url: (result.data.user.user_metadata as any)?.avatar_url,
        };

        setUser(user);
        navigate("/app/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Estilos en línea para el contenedor principal de la pantalla de login */}
      <style>{`
                .login-container {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background: #111;
                    width: 100%;
                    overflow: hidden;
                    position: fixed;
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
          <h2>{isSignUp ? "Registro" : "Iniciar Sesión"}</h2>

          {/* Muestra error si existe */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Hint de credenciales admin solo para desarrollo */}
          {import.meta.env.DEV && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-500 text-xs">
              <strong>Modo Desarrollo:</strong> Usa{" "}
              <code className="bg-black/30 px-1 rounded">admin</code> /{" "}
              <code className="bg-black/30 px-1 rounded">admin</code> para
              pruebas rápidas
            </div>
          )}

          <form
            className="w-full flex flex-col gap-5"
            onSubmit={handleEmailAuth}
          >
            {isSignUp && (
              <div className="inputBx">
                <input
                  type="text"
                  placeholder="Nombre de Usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={isSignUp}
                />
              </div>
            )}
            <div className="inputBx">
              <input
                type="text"
                placeholder={isSignUp ? "Email" : "Email o Usuario (admin)"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="inputBx">
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={5}
              />
            </div>
            <div className="inputBx">
              <input
                type="submit"
                value={
                  loading
                    ? "Cargando..."
                    : isSignUp
                      ? "Registrarse"
                      : "Iniciar Sesión"
                }
                disabled={loading}
              />
            </div>
          </form>
          <div className="flex flex-row gap-2">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault(); /* TODO: Reset password */
              }}
            >
              Olvidé mi contraseña
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setIsSignUp(!isSignUp);
              }}
            >
              {isSignUp ? "Ya tengo cuenta" : "Crear cuenta"}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
