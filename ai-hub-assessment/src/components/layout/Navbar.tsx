'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

const NAV_LINKS = [
  { label: 'Assessment', href: '/assessment' },
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'About', href: '/about' },
  { label: 'Feedback', href: '/feedback' },
];

export const Navbar = () => {
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`fixed top-1 w-full z-50 h-[72px] transition-all duration-300 flex items-center ${
        scrolled ? 'bg-white dark:bg-[#161616] shadow-[0_1px_0_rgba(0,0,0,0.08)]' : 'bg-white dark:bg-[#161616]'
      }`}>
        <div className="max-w-[1400px] w-full mx-auto px-6 flex items-center justify-between">
          {/* Official Novartis logo: Brand Symbol + wordmark SVG, Warm Black, left-aligned */}
          <Link href="/" className="flex items-center">
            <Image
              src="/novartis-logo.svg"
              alt="Novartis"
              width={120}
              height={18}
              className="dark:invert"
              priority
            />
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className="nav-link">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-6">
            <ThemeToggle />
            {status === 'authenticated' ? (
              <>
                <Link href="/profile" className="text-base text-muted-foreground hover:text-foreground transition-colors">
                  {session.user?.name}
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="text-base font-medium text-muted-foreground hover:text-[#ff4e00] transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-base text-muted-foreground hover:text-foreground transition-colors">
                  Sign in
                </Link>
                <Link href="/login" className="btn-started">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button 
            className="lg:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Image src="/icons/Burger-menu.svg" alt="" width={24} height={24} className="dark:invert" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-[60] bg-background transition-transform duration-300 lg:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center justify-between h-8 mb-12">
            <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center">
              <Image
                src="/novartis-logo.svg"
                alt="Novartis"
                width={107}
                height={16}
                className="dark:invert"
              />
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button 
                className="p-2 text-foreground"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {NAV_LINKS.map((link) => (
              <Link 
                key={link.label} 
                href={link.href} 
                className="text-2xl font-medium text-foreground hover:text-[#ff4e00] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="h-px bg-border my-4" />
            {status === 'authenticated' ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut({ callbackUrl: '/login' });
                }}
                className="text-2xl font-medium text-foreground hover:text-[#ff4e00] transition-colors text-left"
              >
                Sign Out
              </button>
            ) : (
              <Link 
                href="/login" 
                className="text-2xl font-medium text-foreground hover:text-[#ff4e00] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
