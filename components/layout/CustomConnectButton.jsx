"use client";

import React from "react";
import { useAccount, useDisconnect, useChainId, useChains, useConnect } from "wagmi";
import toast from "react-hot-toast";

const CustomConnectButton = () => {
  const { address, isConnected, isConnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();
  const chainId = useChainId();
  const chains = useChains();
  const chain = chains.find(c => c.id === chainId);

  const handleConnect = async () => {
    try {
      // Use the first available connector (injected)
      const connector = connectors[0];
      if (connector) {
        connect({ connector });
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast.error("Failed to connect wallet");
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast.success("Wallet disconnected successfully");
  };

  if (isConnecting) {
    return (
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
        disabled
      >
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        <span>Connecting...</span>
      </button>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={handleConnect}
        type="button"
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 sm:px-6 sm:py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>Connect Wallet</span>
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Chain Info */}
      <div className="bg-gray-700 text-white px-3 py-2 rounded-lg font-medium flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        <span className="hidden sm:inline">{chain?.name || "Unknown"}</span>
      </div>

      {/* Account Info */}
      <button
        onClick={handleConnect}
        type="button"
        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
      >
        <span className="hidden sm:inline">
          {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Account"}
        </span>
        <span className="sm:hidden">
          {address ? `${address.slice(0, 4)}...${address.slice(-4)}` : "Account"}
        </span>
      </button>

      {/* Disconnect Button */}
      <button
        onClick={handleDisconnect}
        type="button"
        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg font-medium transition-colors flex items-center"
        title="Disconnect Wallet"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      </button>
    </div>
  );
};

export default CustomConnectButton;
