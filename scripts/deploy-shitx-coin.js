const { ethers } = require("hardhat");

async function main() {
  console.log("部署 ShitX Coin 合约...");
  
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("部署账户:", deployer.address);
  
  // 获取账户余额
  const balance = await deployer.getBalance();
  console.log("账户余额:", ethers.utils.formatEther(balance), "INJ");
  
  // 部署合约
  const ShitXCoin = await ethers.getContractFactory("ShitXCoin");
  const shitXCoin = await ShitXCoin.deploy();
  
  await shitXCoin.deployed();
  
  console.log("ShitX Coin 合约已部署到:", shitXCoin.address);
  console.log("代币名称: ShitX Coin");
  console.log("代币符号: SHIT");
  console.log("总供应量: 100,000,000 SHIT");
  
  // 等待几个区块确认
  console.log("等待区块确认...");
  await shitXCoin.deployTransaction.wait(5);
  
  console.log("部署完成！");
  console.log("\n请将以下地址添加到 .env 文件:");
  console.log(`NEXT_PUBLIC_SHITX_COIN_CONTRACT=${shitXCoin.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });