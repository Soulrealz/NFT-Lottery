pragma solidity 0.8.9;

import "../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

import "../node_modules/hardhat/console.sol";

contract Ticket is ERC721, Ownable {
    bool public isMintEnabled;
    mapping(address => uint) public mintedWallets;
    uint public constant mintPrice = 0.05 ether;
    uint public totalSupply;
    uint public maxSupply;

    event MintedSuccessfully(address receiver, uint totalMinted);
    event MintModeChanged(bool newMode);
    
    constructor() ERC721("Ticket", "TKT") {
        maxSupply = 10_000;
    }

    function mintTicket() external payable {
        require(isMintEnabled, "Minting is not enabled.");
        require(mintedWallets[msg.sender] < 1, "Cannot get more than 1 ticket per account");
        require(msg.value == mintPrice, "Incorrect mint value");
        require(maxSupply > totalSupply, "Sold out");

        ++mintedWallets[msg.sender];
        _safeMint(msg.sender, ++totalSupply);

        emit MintedSuccessfully(msg.sender, totalSupply);
    }

    function toggleMinting() external onlyOwner {
        isMintEnabled = !isMintEnabled;
        
        emit MintModeChanged(isMintEnabled);
    }

    function setMaxSupply(uint _maxSupply) external onlyOwner {
        maxSupply = _maxSupply;
    }

    function canGetTicket() public view returns (bool) {
        return mintedWallets[msg.sender] == 0;
    }

    function distributeReward() external onlyOwner {
        
    }
}