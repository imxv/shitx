const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // 读取合作方部署信息
  const deploymentsPath = path.join(__dirname, "../partner-deployments.json");
  
  if (!fs.existsSync(deploymentsPath)) {
    console.error("No partner deployments found. Run deployPartnerNFT.js first.");
    return;
  }

  const deployments = JSON.parse(fs.readFileSync(deploymentsPath, "utf8"));
  const [owner] = await hre.ethers.getSigners();
  
  console.log("Minting partner NFTs to owner:", owner.address);
  console.log(`Found ${deployments.length} partner NFT deployments\n`);

  for (const deployment of deployments) {
    console.log(`\nProcessing ${deployment.nftName}...`);
    console.log(`Contract: ${deployment.contractAddress}`);
    console.log(`Total supply to mint: ${deployment.totalSupply}`);

    try {
      // 连接到合约
      const nft = await hre.ethers.getContractAt(
        "ShitNFT",
        deployment.contractAddress,
        owner
      );

      // 检查当前供应量
      const currentSupply = await nft.totalSupply();
      console.log(`Current supply: ${currentSupply}`);

      if (currentSupply >= deployment.totalSupply) {
        console.log(`✅ Already minted ${currentSupply} NFTs`);
        continue;
      }

      // 批量铸造 NFT
      const batchSize = 100;
      const totalToMint = deployment.totalSupply - Number(currentSupply);
      const batches = Math.ceil(totalToMint / batchSize);

      console.log(`Minting ${totalToMint} NFTs in ${batches} batches...`);

      for (let i = 0; i < batches; i++) {
        const startId = Number(currentSupply) + (i * batchSize) + 1;
        const endId = Math.min(
          startId + batchSize - 1,
          deployment.totalSupply
        );
        const count = endId - startId + 1;

        console.log(`Minting batch: ${startId} to ${endId} (${count} NFTs)`);
        
        const tx = await nft.mintBatch(owner.address, count);
        const receipt = await tx.wait();
        
        console.log(`Batch minted! TX: ${receipt.hash}`);
        
        // 等待一下避免 RPC 限制
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      console.log(`✅ Successfully minted all ${deployment.totalSupply} NFTs for ${deployment.nftName}`);

    } catch (error) {
      console.error(`❌ Error minting ${deployment.nftName}:`, error.message);
    }
  }

  console.log("\n✅ All partner NFT minting complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });