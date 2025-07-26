const hre = require("hardhat");
const fs = require('fs');

async function main() {
  // Read deployment info
  const deploymentInfo = JSON.parse(fs.readFileSync('./deployment-info.json', 'utf8'));
  const contractAddress = deploymentInfo.contractAddress;

  console.log("Minting all NFTs to owner...");
  console.log("Contract address:", contractAddress);

  const [owner] = await hre.ethers.getSigners();
  console.log("Owner address:", owner.address);

  // Get contract instance
  const ShitNFT = await hre.ethers.getContractFactory("ShitNFT");
  const shitNFT = ShitNFT.attach(contractAddress);

  // Check current supply
  const currentSupply = await shitNFT.totalSupply();
  console.log("Current supply:", currentSupply.toString());

  // Mint in batches to avoid gas limit
  const BATCH_SIZE = 100;
  const MAX_SUPPLY = await shitNFT.MAX_SUPPLY();
  const remaining = Number(MAX_SUPPLY) - Number(currentSupply);

  if (remaining === 0) {
    console.log("All NFTs already minted!");
    return;
  }

  console.log(`Minting ${remaining} NFTs in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < remaining; i += BATCH_SIZE) {
    const batchAmount = Math.min(BATCH_SIZE, remaining - i);
    console.log(`Minting batch: ${i + 1} to ${i + batchAmount}`);
    
    const tx = await shitNFT.batchMint(owner.address, batchAmount);
    await tx.wait();
    
    console.log(`Batch minted! TX: ${tx.hash}`);
  }

  // Verify final supply
  const finalSupply = await shitNFT.totalSupply();
  const ownerBalance = await shitNFT.balanceOf(owner.address);

  console.log("\n✅ Minting complete!");
  console.log("Total supply:", finalSupply.toString());
  console.log("Owner balance:", ownerBalance.toString());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });