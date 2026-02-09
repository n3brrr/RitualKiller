import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "../types";
import { signInWithGoogle, signInWithGitHub, signInWithEmail, signUpWithEmail } from "../services/authService";
import { Github, Mail } from "lucide-react";
import "../styles/login.css";

interface LoginPageProps {
  onAuth: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onAuth }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = isSignUp
        ? await signUpWithEmail(email, password)
        : await signInWithEmail(email, password);

      if (result.error) {
        setError(result.error.message);
        setLoading(false);
        return;
      }

      // Create user object from auth result
      if (result.data?.user) {
        const isAdmin = result.data.user.user_metadata?.isAdmin || 
                       (email.toLowerCase() === 'admin' && password === 'admin');
        
        const user: User = {
          id: result.data.user.id,
          username: result.data.user.user_metadata?.username || 
                   result.data.user.email?.split("@")[0] || 
                   "Usuario",
          essence: isAdmin ? 10000 : 0, // Admin empieza con más esencia
          rank: isAdmin ? "Semidiós" : "Iniciado",
          inventory: isAdmin ? ['admin-badge'] : [],
          created_at: new Date().toISOString(),
          isAdmin: isAdmin,
        };

        onAuth(user);
        navigate("/app/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    const result = await signInWithGoogle();
    if (result.error) {
      setError(result.error.message);
    }
  };

  const handleGitHubAuth = async () => {
    setError(null);
    const result = await signInWithGitHub();
    if (result.error) {
      setError(result.error.message);
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
          <h2>{isSignUp ? "Registro" : "Iniciar Sesión"}</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Admin credentials hint for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-500 text-xs">
              <strong>Modo Desarrollo:</strong> Usa <code className="bg-black/30 px-1 rounded">admin</code> / <code className="bg-black/30 px-1 rounded">admin</code> para iniciar sesión como administrador
            </div>
          )}

          <form className="w-full flex flex-col gap-5" onSubmit={handleEmailAuth}>
            <div className="inputBx">
              <input
                type="text"
                placeholder="Email o Usuario (admin para pruebas)"
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
                minLength={6}
              />
            </div>
            <div className="inputBx">
              <input 
                type="submit" 
                value={loading ? "Cargando..." : (isSignUp ? "Registrarse" : "Iniciar Sesión")}
                disabled={loading}
              />
            </div>
          </form>

          <div className="w-full flex flex-col gap-3 mt-4">
            <button
              onClick={handleGoogleAuth}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-bold hover:bg-gray-200 transition-colors"
            >
              <Mail size={18} />
              Continuar con Google
            </button>
            <button
              onClick={handleGitHubAuth}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 text-white rounded-lg font-bold hover:bg-zinc-700 transition-colors border border-zinc-700"
            >
              <Github size={18} />
              Continuar con GitHub
            </button>
          </div>

          <div className="links">
            <a href="#" onClick={(e) => { e.preventDefault(); /* TODO: Reset password */ }}>
              Olvidé mi contraseña
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); setIsSignUp(!isSignUp); }}>
              {isSignUp ? "Ya tengo cuenta" : "Crear cuenta"}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
