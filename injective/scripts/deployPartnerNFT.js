const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // 读取合作方配置
  const partnersPath = path.join(__dirname, "../../src/config/partners.ts");
  const partnersContent = fs.readFileSync(partnersPath, "utf8");
  
  // 简单解析 partners 数组
  const partnersMatch = partnersContent.match(/export const partners.*?=\s*\[([\s\S]*?)\];/);
  if (!partnersMatch) {
    console.error("Failed to parse partners config");
    return;
  }

  // 提取未部署的合作方
  const undeployedRegex = /{\s*id:\s*['"]([^'"]+)['"][\s\S]*?name:\s*['"]([^'"]+)['"][\s\S]*?nftName:\s*['"]([^'"]+)['"][\s\S]*?totalSupply:\s*(\d+)[\s\S]*?deployed:\s*false/g;
  const undeployedPartners = [];
  let match;
  
  while ((match = undeployedRegex.exec(partnersContent)) !== null) {
    undeployedPartners.push({
      id: match[1],
      name: match[2],
      nftName: match[3],
      totalSupply: parseInt(match[4])
    });
  }

  if (undeployedPartners.length === 0) {
    console.log("No undeployed partner NFTs found.");
    return;
  }

  console.log(`Found ${undeployedPartners.length} undeployed partner NFTs:`);
  undeployedPartners.forEach(p => {
    console.log(`- ${p.nftName} (${p.totalSupply} supply)`);
  });

  const [deployer] = await hre.ethers.getSigners();
  console.log("\nDeploying with account:", deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "INJ\n");

  // 部署每个合作方 NFT
  const deploymentResults = [];
  
  for (const partner of undeployedPartners) {
    console.log(`\nDeploying ${partner.nftName}...`);
    
    try {
      const ShitNFT = await hre.ethers.getContractFactory("ShitNFT");
      const nft = await ShitNFT.deploy(
        partner.nftName,
        `SHIT_${partner.id.toUpperCase()}`,
        `https://shitx.top/api/partner-nft-metadata/${partner.id}/`
      );

      await nft.waitForDeployment();
      const contractAddress = await nft.getAddress();

      console.log(`${partner.nftName} deployed to:`, contractAddress);

      // 保存部署信息
      deploymentResults.push({
        partnerId: partner.id,
        partnerName: partner.name,
        nftName: partner.nftName,
        contractAddress: contractAddress,
        totalSupply: partner.totalSupply,
        deployedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error(`Failed to deploy ${partner.nftName}:`, error.message);
    }
  }

  // 保存部署结果
  if (deploymentResults.length > 0) {
    const resultsPath = path.join(__dirname, "../partner-deployments.json");
    let existingDeployments = [];
    
    if (fs.existsSync(resultsPath)) {
      existingDeployments = JSON.parse(fs.readFileSync(resultsPath, "utf8"));
    }
    
    const allDeployments = [...existingDeployments, ...deploymentResults];
    fs.writeFileSync(resultsPath, JSON.stringify(allDeployments, null, 2));
    
    console.log("\n✅ Deployment results saved to partner-deployments.json");
    console.log("\n📝 Next steps:");
    console.log("1. Update src/config/partners.ts with the deployed contract addresses");
    console.log("2. Run 'npm run mint-partner-nfts' to mint NFTs to admin wallet");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });