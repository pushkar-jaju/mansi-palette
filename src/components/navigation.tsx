"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, useCart } from "./providers";
import { ShoppingBag, Menu, X, Sparkles, User, Shield } from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { href: "/gallery", label: "Gallery" },
    { href: "/commissions", label: "Commissions" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full h-14 bg-canvas/80 backdrop-blur-md border-b border-hairline transition-colors">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2 text-ink font-semibold tracking-tight text-lg">
            <span className="flex items-center justify-center w-7 h-7 rounded-sm bg-primary border border-hairline">
              <Sparkles className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
            </span>
            <span>
              Mansi's <span className="text-primary font-semibold">Palette</span>
            </span>
          </Link>
        </div>

        {/* Center: Main Navigation (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors ${
                  isActive ? "text-ink" : "text-ink-subtle hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              className={`flex items-center gap-1 transition-colors ${
                pathname === "/admin" ? "text-primary-hover" : "text-primary hover:text-primary-hover"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin Dashboard
            </Link>
          )}
        </nav>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-4">
          {/* Cart Icon */}
          <Link
            href="/cart"
            className="relative p-2 text-ink-subtle hover:text-ink transition-colors rounded-sm hover:bg-surface-1"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full border border-canvas">
                {cartCount}
              </span>
            )}
          </Link>
 
          {/* User Section */}
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm text-ink-muted">
                <User className="w-4 h-4 text-ink-subtle" />
                <span className="max-w-[100px] truncate">{user.name.split(" ")[0]}</span>
              </div>
              <button
                onClick={logout}
                className="text-xs font-medium px-3 py-1.5 rounded-sm bg-surface-1 hover:bg-surface-2 border border-hairline text-ink transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="text-xs font-medium text-ink-subtle hover:text-ink px-3 py-1.5 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="text-xs font-medium text-primary-foreground bg-primary hover:bg-primary-hover px-3 py-1.5 rounded-sm border border-primary-focus transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Hamburger (Mobile) */}
        <div className="flex items-center gap-4 md:hidden">
          <Link
            href="/cart"
            className="relative p-2 text-ink-subtle hover:text-ink transition-colors rounded-sm"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full border border-canvas">
                {cartCount}
              </span>
            )}
          </Link>
 
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-ink-subtle hover:text-ink transition-colors rounded-sm"
            aria-label={mobileMenuOpen ? "Close Menu" : "Open Menu"}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden w-full bg-surface-1 border-b border-hairline px-4 py-4 flex flex-col gap-3 animate-in slide-in-from-top duration-200">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-ink-muted hover:text-ink py-2"
            >
              {link.label}
            </Link>
          ))}
          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-primary hover:text-primary-hover py-2 flex items-center gap-1.5"
            >
              <Shield className="w-4 h-4" />
              Admin Dashboard
            </Link>
          )}
          <hr className="border-hairline my-1" />
          {user ? (
            <div className="flex flex-col gap-2 pt-2">
              <div className="text-xs text-ink-subtle flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>Signed in as {user.name}</span>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full text-center text-xs font-medium py-2 rounded-sm bg-surface-2 hover:bg-surface-3 border border-hairline text-ink"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center text-xs font-medium py-2 rounded-sm border border-hairline text-ink"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center text-xs font-medium py-2 rounded-sm bg-primary hover:bg-primary-hover text-primary-foreground"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="w-full bg-canvas border-t border-hairline text-ink-subtle text-xs py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <Link href="/" className="flex items-center gap-2 text-ink font-semibold tracking-tight text-sm">
            <span className="flex items-center justify-center w-5 h-5 rounded-sm bg-primary border border-hairline">
              <Sparkles className="w-3 h-3 text-primary-foreground" aria-hidden="true" />
            </span>
            <span>Mansi's Palette</span>
          </Link>
          <p className="text-[11px] text-ink-tertiary text-center md:text-left">
            Original hand-painted artworks &amp; custom commissions.
          </p>
        </div>

        {/* Links */}
        <div className="flex items-center gap-8 text-[11px] font-medium">
          <Link href="/gallery" className="hover:text-ink transition-colors">
            Gallery
          </Link>
          <Link href="/commissions" className="hover:text-ink transition-colors">
            Commissions
          </Link>
          <Link href="/auth/login" className="hover:text-ink transition-colors">
            Artist Portal
          </Link>
        </div>

        {/* Copy */}
        <div className="text-[10px] text-ink-tertiary text-center md:text-right">
          &copy; {new Date().getFullYear()} Mansi's Palette. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
