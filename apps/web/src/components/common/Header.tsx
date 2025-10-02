"use client";

import Link from "next/link";
import { Button } from "../ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useEffect, useState } from "react";
// import { MobileNav } from "./MobileNav";

export function Header() {
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    fetch("/api/auth/me").then(async (r) => {
      const data = await r.json();
      setLoggedIn(Boolean(data?.user));
    });
  }, []);
  return (
    <header className="fixed top-0 w-full bg-white/10 dark:bg-black/30 backdrop-blur-sm z-50">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className=" sm:inline-block font-semibold text-xl">
            Beyond Syllabus
          </span>
        </Link>

        {/* student login and logout buttons */}
        <div className="hidden md:flex items-center" />

        <div className="flex items-center gap-2 ">
          {/* student login and logout buttons moved next to light mode, darkmode toggle */}
          {loggedIn ? (
            <>
              <Link href="/student">
                <Button variant="secondary" size="sm">Dashboard</Button>
              </Link>
              <form action="/api/auth/logout" method="post">
                <Button size="sm" variant="ghost" className="hover:text-red-600">
                  Logout
                </Button>
              </form>
            </>
          ) : (
            <Link href="/auth">
              <Button size="sm">Login/Register</Button>
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
