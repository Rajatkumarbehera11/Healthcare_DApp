import { useEffect, useState } from "react";

let web3Modal;

const getWeb3Modal = async () => {
  if (!web3Modal) {
    const Web3Modal = (await import("web3modal")).default;
    const providerOptions = {
      // Add provider options here if needed
    };
    web3Modal = new Web3Modal({
      network: "mainnet", // optional
      cacheProvider: true, // optional
      providerOptions, // required
    });
  }
  return web3Modal;
};

export default getWeb3Modal;
