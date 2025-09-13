"use client";

import React from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import CustomConnectButton from "./CustomConnectButton";
import { useRouter } from "next/router";

const Header = () => {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  const isHomePage = router.pathname === "/";

  return (
    <header className="bg-dark shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <div className="flex-shrink-0">
          <Link href="/" className="text-lg sm:text-xl font-bold text-teal">
            Healthcare DApp
          </Link>
        </div>
        <nav className="hidden md:flex space-x-8">
          <Link href="/" className="text-gray-300 hover:text-teal transition-colors duration-300">
            Home
          </Link>
          <Link href="/patient/register" className="text-gray-300 hover:text-teal transition-colors duration-300">
            Patient Register
          </Link>
          <Link href="/doctor/register" className="text-gray-300 hover:text-teal transition-colors duration-300">
            Doctor Register
          </Link>
          <Link href="/admin/dashboard" className="text-gray-300 hover:text-teal transition-colors duration-300">
            Admin Dashboard
          </Link>
        </nav>
        <div className="flex items-center space-x-4">
          {isConnected ? (
            <CustomConnectButton />
          ) : isHomePage ? (
            <Link
              href="/admin/dashboard"
               className="btn-teal text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:scale-105"
            >
              Launch App
            </Link>
          ) : (
            <CustomConnectButton />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
