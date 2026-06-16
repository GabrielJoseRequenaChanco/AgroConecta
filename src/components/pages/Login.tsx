import { useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useAppStore } from "@/context/useAppStore";

export default function Login() {
  const authSignIn = useAppStore((s) => s.authSignIn);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Por favor completa todos los campos.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const profile = await authSignIn(email, password);
      if (!profile) {
        setError("Credenciales inválidas o usuario no encontrado.");
        return;
      }
      router.navigate({ to: "/" as any });
    } catch (err) {
      console.error("Login error:", err);
      setError("Ocurrió un error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h2 className="text-xl font-bold mb-4">Iniciar sesión</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Ingresa con tu correo y contraseña
      </p>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tucorreo@ejemplo.com"
        type="email"
        autoComplete="email"
        className="w-full border px-3 py-2 mb-3 rounded"
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Contraseña"
        type="password"
        autoComplete="current-password"
        className="w-full border px-3 py-2 mb-3 rounded"
      />
      {error && <div className="text-sm text-destructive mb-2">{error}</div>}
      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={loading}
          className="bg-primary text-primary-foreground px-4 py-2 rounded disabled:opacity-60"
        >
          {loading ? "Ingresando…" : "Ingresar"}
        </button>
        <Link to="/registro" className="px-4 py-2 rounded border">
          Crear cuenta
        </Link>
      </div>
    </div>
  );
}
