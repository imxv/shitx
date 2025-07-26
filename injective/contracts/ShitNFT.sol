// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ShitNFT is ERC721, ERC721Enumerable, Ownable {
    uint256 private _nextTokenId;
    uint256 public constant MAX_SUPPLY = 8000;
    string public baseTokenURI;

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseTokenURI
    ) ERC721(_name, _symbol) Ownable(msg.sender) {
        baseTokenURI = _baseTokenURI;
        _nextTokenId = 1; // Start from 1
    }

    // Mint single NFT
    function mint(address to) public onlyOwner {
        require(_nextTokenId <= MAX_SUPPLY, "Max supply reached");
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
    }

    // Batch mint NFTs
    function batchMint(address to, uint256 amount) public onlyOwner {
        require(_nextTokenId + amount - 1 <= MAX_SUPPLY, "Would exceed max supply");
        
        for (uint256 i = 0; i < amount; i++) {
            uint256 tokenId = _nextTokenId++;
            _safeMint(to, tokenId);
        }
    }

    // Mint all remaining supply to owner
    function mintAllToOwner() public onlyOwner {
        uint256 remaining = MAX_SUPPLY - _nextTokenId + 1;
        batchMint(owner(), remaining);
    }

    // Update base URI
    function setBaseURI(string memory _baseTokenURI) public onlyOwner {
        baseTokenURI = _baseTokenURI;
    }

    // Override _baseURI
    function _baseURI() internal view override returns (string memory) {
        return baseTokenURI;
    }

    // Required overrides for ERC721Enumerable
    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}