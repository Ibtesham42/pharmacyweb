"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, X, Search, Pill, ChevronDown, Heart, UserRound, LogOut, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/public/search-bar";
import { ThemeToggle } from "@/components/public/theme-toggle";
import { NotificationBell } from "@/components/public/notification-bell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type HeaderCategory = { id: string; name: string; slug: string };

const NAV = [
  { href: "/jobs", label: "Jobs" },
  { href: "/articles", label: "Articles" },
  { href: "/news", label: "News" },
  { href: "/store", label: "Store" },
  { href: "/library", label: "Library" },
  { href: "/exam-prep", label: "Exam Prep" },
  { href: "/membership", label: "PREMIUM" },
  { href: "/ai", label: "AI Assistant" },
  { href: "/copilot", label: "Career Copilot" },
];

const NAV_AFTER = [{ href: "/about", label: "About" }];

export function SiteHeader({
  categories = [],
  donateEnabled = false,
  authed = false,
  isAdmin = false,
}: {
  categories?: HeaderCategory[];
  donateEnabled?: boolean;
  authed?: boolean;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const linkCls = (href: string) =>
    cn(
      "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
      pathname.startsWith(href) && "text-primary",
    );

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold" aria-label={siteConfig.name}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Pill className="h-5 w-5" />
          </span>
          <span className="text-lg">{siteConfig.name}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={linkCls(item.href)}>
              {item.label}
            </Link>
          ))}

          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring",
                pathname.startsWith("/categories") && "text-primary",
              )}
            >
              Categories <ChevronDown className="h-4 w-4 opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
              {categories.map((c) => (
                <DropdownMenuItem key={c.id} asChild>
                  <Link href={`/categories/${c.slug}`}>{c.name}</Link>
                </DropdownMenuItem>
              ))}
              {categories.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem asChild>
                <Link href="/categories" className="font-medium text-primary">
                  View all
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {NAV_AFTER.map((item) => (
            <Link key={item.href} href={item.href} className={linkCls(item.href)}>
              {item.label}
            </Link>
          ))}
        </nav>

        <SearchBar compact className="hidden w-64 lg:block" placeholder="Search…" />

        <div className="flex items-center gap-1">
          {donateEnabled && (
            <Button asChild size="sm" className="px-2.5 sm:px-3">
              <Link href="/donate?src=nav" aria-label="Donate">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Donate</span>
              </Link>
            </Button>
          )}
          {authed && (
            <div className="hidden md:block">
              <NotificationBell />
            </div>
          )}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          <div className="hidden md:block">
            {authed ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Account"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <UserRound className="h-5 w-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/account">My account</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">Admin dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/" })}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" variant="outline">
                <Link href="/login">Sign in</Link>
              </Button>
            )}
          </div>
          <Link
            href="/search"
            aria-label="Search"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent lg:hidden"
          >
            <Search className="h-5 w-5" />
          </Link>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t md:hidden" aria-label="Mobile">
          <div className="container flex flex-col py-2">
            {donateEnabled && (
              <Link
                href="/donate?src=nav"
                onClick={() => setOpen(false)}
                className="mb-1 flex items-center gap-2 rounded-md bg-primary px-3 py-3 text-base font-medium text-primary-foreground"
              >
                <Heart className="h-4 w-4" /> Donate
              </Link>
            )}
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-base font-medium hover:bg-accent"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/categories"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-3 text-base font-medium hover:bg-accent"
            >
              Categories
            </Link>
            {categories.length > 0 && (
              <div className="mb-1 flex flex-col border-l pl-3">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/categories/${c.slug}`}
                    onClick={() => setOpen(false)}
                    className="rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            )}
            {NAV_AFTER.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-base font-medium hover:bg-accent"
              >
                {item.label}
              </Link>
            ))}

            <div className="mt-1 border-t pt-1">
              {authed ? (
                <>
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-3 text-base font-medium hover:bg-accent"
                  >
                    <UserRound className="h-4 w-4" /> My account
                  </Link>
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 rounded-md px-3 py-3 text-base font-medium hover:bg-accent"
                  >
                    <Bell className="h-4 w-4" /> Notifications
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="rounded-md px-3 py-3 text-base font-medium hover:bg-accent"
                    >
                      Admin dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-3 text-left text-base font-medium hover:bg-accent"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-3 text-base font-medium hover:bg-accent"
                >
                  <UserRound className="h-4 w-4" /> Sign in
                </Link>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
