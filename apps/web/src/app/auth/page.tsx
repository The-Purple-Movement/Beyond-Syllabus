"use client";

import { useState } from "react";
import { Header } from "@/components/common/Header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [isSignIn, setIsSignIn] = useState(true);
  const { toast } = useToast();

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const toggleMode = () => setIsSignIn((v) => !v);

  const onRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: registerName, email: registerEmail, password: registerPassword }),
    });
    if (res.status === 501) {
      toast({ title: "Not implemented", description: "Registration is not enabled yet." });
      return;
    }
    if (!res.ok) {
      toast({ title: "Error", description: "Registration failed" });
      return;
    }
    toast({ title: "Success", description: "Account created. Please sign in." });
    setIsSignIn(true);
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast({ title: "Login failed", description: data?.error || "Invalid credentials" });
      return;
    }
    window.location.href = "/student";
  };

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 bg-background">
        <div className="mx-auto max-w-6xl h-[70vh] relative overflow-hidden rounded-2xl border bg-card shadow-sm">
          {/* Sliding message panel */}
          <section
            className={`absolute inset-y-0 left-0 w-full md:w-1/2 transition-transform duration-700 ease-out flex text-center items-center justify-center px-8 
            bg-gradient-to-br from-purple-600 to-fuchsia-600 dark:from-purple-700 dark:to-fuchsia-700 
            ${isSignIn ? "translate-x-0" : "md:translate-x-full"}`}
          >
            <div className="hidden md:flex w-full items-center justify-between">
              <div className="flex-1 flex flex-col items-center gap-6">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white">
                    {isSignIn ? "Welcome back" : "Hello"}
                  </h1>
                  <p className="mt-3 text-white/90">
                    {isSignIn
                      ? "To keep connected with us please login with your personal info"
                      : "Enter your personal details and start your journey with us"}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  className="rounded-full px-8"
                  onClick={toggleMode}
                >
                  {isSignIn ? "Sign up" : "Sign in"}
                </Button>
              </div>
            </div>
          </section>

          {/* Forms container */}
          <section
            className={`absolute inset-y-0 w-full md:w-1/2 h-full bg-card transition-all duration-700 
            ${isSignIn ? "md:left-1/2" : "md:left-0"}`}
          >
            {/* Register */}
            <div
              className={`absolute inset-0 p-8 md:p-12 transition-all duration-700 ${
                isSignIn ? "opacity-0 pointer-events-none translate-x-8" : "opacity-100 translate-x-0"
              }`}
            >
              <header className="flex flex-col items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold text-primary">Create account</h2>
                <p className="text-sm text-muted-foreground">or use your email for registration</p>
              </header>
              <form onSubmit={onRegister} className="grid gap-4 max-w-md mx-auto">
                <div className="grid gap-1">
                  <label className="text-sm">Name</label>
                  <Input value={registerName} onChange={(e) => setRegisterName(e.target.value)} required />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm">Email</label>
                  <Input type="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} required />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm">Password</label>
                  <Input type="password" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="rounded-full mt-2">Sign up</Button>
                <Button type="button" variant="ghost" onClick={toggleMode} className="md:hidden">Have an account? Sign in</Button>
              </form>
            </div>

            {/* Login */}
            <div
              className={`absolute inset-0 p-8 md:p-12 transition-all duration-700 ${
                isSignIn ? "opacity-100 translate-x-0" : "opacity-0 pointer-events-none -translate-x-8"
              }`}
            >
              <header className="flex flex-col items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold text-primary">Sign in to App</h2>
                <p className="text-sm text-muted-foreground">or use your email account</p>
              </header>
              <form onSubmit={onLogin} className="grid gap-4 max-w-md mx-auto">
                <div className="grid gap-1">
                  <label className="text-sm">Email</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm">Password</label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="grid place-items-center">
                  <a className="text-sm text-primary" href="#">forgot your password ?</a>
                </div>
                <Button type="submit" className="rounded-full mt-2">Sign in</Button>
                <Button type="button" variant="ghost" onClick={toggleMode} className="md:hidden">New here? Create account</Button>
              </form>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}


