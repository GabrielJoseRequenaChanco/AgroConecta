import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useAppStore } from "@/context/useAppStore";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const authSignIn = useAppStore((s) => s.authSignIn);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const profile = await authSignIn(email, password);
    if (!profile) {
      setError("Credenciales inválidas o usuario no encontrado");
      return;
    }
    router.navigate({ to: "/" as any });
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      <h2 className="text-xl font-bold mb-4">Iniciar sesión</h2>
      <p className="text-sm text-muted-foreground mb-4">Ingresa con tu correo y contraseña</p>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@ejemplo.com" className="w-full border px-3 py-2 mb-3" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" type="password" className="w-full border px-3 py-2 mb-3" />
      {error && <div className="text-sm text-destructive mb-2">{error}</div>}
      <div className="flex gap-2">
        <button onClick={submit} className="bg-primary text-primary-foreground px-4 py-2 rounded">Ingresar</button>
        <Link to="/registro" className="px-4 py-2 rounded border">Crear cuenta</Link>
      </div>
    </div>
  );
}

export default Login;
