// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ShitXCoin is ERC20, Ownable {
    // 记录已经领取过补贴的地址
    mapping(address => bool) public hasClaimedSubsidy;
    
    // 补贴金额范围
    uint256 public constant MIN_SUBSIDY = 1 * 10**18; // 1 token
    uint256 public constant MAX_SUBSIDY = 5000 * 10**18; // 5000 tokens
    
    // 用于生成随机数的 nonce
    uint256 private nonce;
    
    constructor() ERC20("ShitX Coin", "SHIT") Ownable(msg.sender) {
        // 初始铸造 1 亿个代币给合约拥有者
        _mint(msg.sender, 100000000 * 10**18);
        nonce = 0;
    }
    
    // 领取补贴
    function claimSubsidy() external {
        require(!hasClaimedSubsidy[msg.sender], "Already claimed subsidy");
        
        // 生成随机补贴金额
        uint256 randomAmount = _generateRandomSubsidy(msg.sender);
        
        // 标记已领取
        hasClaimedSubsidy[msg.sender] = true;
        
        // 从 owner 转账给领取者
        _transfer(owner(), msg.sender, randomAmount);
        
        emit SubsidyClaimed(msg.sender, randomAmount);
    }
    
    // 生成随机补贴金额（1-5000）
    function _generateRandomSubsidy(address user) private returns (uint256) {
        nonce++;
        uint256 random = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            user,
            nonce
        ))) % 5000;
        
        // 返回 1-5000 之间的随机数
        return (random + 1) * 10**18;
    }
    
    // 检查是否已领取补贴
    function hasClaimedSubsidyFor(address user) external view returns (bool) {
        return hasClaimedSubsidy[user];
    }
    
    // 批量发放补贴（owner only）
    function batchDistributeSubsidy(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(!hasClaimedSubsidy[recipients[i]], "Recipient already claimed");
            hasClaimedSubsidy[recipients[i]] = true;
            _transfer(owner(), recipients[i], amounts[i]);
            emit SubsidyClaimed(recipients[i], amounts[i]);
        }
    }
    
    // 事件
    event SubsidyClaimed(address indexed recipient, uint256 amount);
}