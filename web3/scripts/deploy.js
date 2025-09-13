const hre = require("hardhat");

async function main() {
  const Healthcare = await hre.ethers.getContractFactory("Healthcare");
  // Deploy to testnet (e.g., sepolia)
  const healthcare = await Healthcare.deploy();

  await healthcare.deployed();

  console.log("Healthcare contract deployed to:", healthcare.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
