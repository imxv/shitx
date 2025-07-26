const { ethers } = require("hardhat");

async function main() {
  const SHITX_COIN_ADDRESS = "0x1D413c9592E710b489c8E50f74de5d72b28ED499";
  
  console.log("测试 ShitX Coin 合约...");
  
  // 获取账户
  const [owner] = await ethers.getSigners();
  console.log("测试账户:", owner.address);
  
  // 连接到合约
  const ShitXCoin = await ethers.getContractFactory("ShitXCoin");
  const shitXCoin = ShitXCoin.attach(SHITX_COIN_ADDRESS);
  
  // 获取代币信息
  const name = await shitXCoin.name();
  const symbol = await shitXCoin.symbol();
  const decimals = await shitXCoin.decimals();
  const totalSupply = await shitXCoin.totalSupply();
  
  console.log("\n代币信息:");
  console.log("名称:", name);
  console.log("符号:", symbol);
  console.log("小数位数:", decimals);
  console.log("总供应量:", ethers.formatEther(totalSupply), symbol);
  
  // 检查 owner 余额
  const ownerBalance = await shitXCoin.balanceOf(owner.address);
  console.log("\nOwner 余额:", ethers.formatEther(ownerBalance), symbol);
  
  // 测试地址
  const testAddress = "0x1234567890123456789012345678901234567890";
  
  // 检查测试地址是否已领取补贴
  const hasClaimed = await shitXCoin.hasClaimedSubsidyFor(testAddress);
  console.log("\n测试地址是否已领取补贴:", hasClaimed);
  
  // 检查测试地址余额
  const testBalance = await shitXCoin.balanceOf(testAddress);
  console.log("测试地址余额:", ethers.formatEther(testBalance), symbol);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });