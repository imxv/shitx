const hre = require("hardhat");

async function main() {
  console.log("Deploying ShitNFT to Injective Testnet...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "INJ");

  // Deploy contract
  const ShitNFT = await hre.ethers.getContractFactory("ShitNFT");
  const shitNFT = await ShitNFT.deploy(
    "Shit NFT",                              // Name
    "SHIT",                                   // Symbol
    "https://shitx.top/api/nft-metadata/"    // Base URI
  );

  await shitNFT.waitForDeployment();
  const contractAddress = await shitNFT.getAddress();

  console.log("ShitNFT deployed to:", contractAddress);
  console.log("Max supply:", await shitNFT.MAX_SUPPLY());

  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    network: "injective-testnet",
    chainId: 1439,
    contractAddress: contractAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    maxSupply: 8000
  };

  fs.writeFileSync(
    './deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\nDeployment info saved to deployment-info.json");
  console.log("\nNext steps:");
  console.log("1. Add this to your .env.local:");
  console.log(`   NEXT_PUBLIC_NFT_CONTRACT=${contractAddress}`);
  console.log("2. Run 'npm run mint-all' to mint all NFTs to your address");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });