pragma solidity 0.8.9;

import "../node_modules/@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
//import "../node_modules/@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "../node_modules/hardhat/console.sol";

contract Ticket is ERC721, Ownable {
    mapping(address => mapping(uint => bool)) public mintedWallets;
    uint public constant mintPrice = 0.05 ether;
    uint public totalSupply;
    uint public maxSupply;

    address payable[] public players;
    uint public lotteryId;
    uint public duration = 6 hours;
    mapping(uint => uint) public lotteryExpiration;
    mapping(uint => address) public winnerHistory;

    event MintedSuccessfully(address receiver, uint totalMinted);
    event ExtendLottery(uint extendedTo);
    
    constructor() ERC721("Ticket", "TKT") {
        maxSupply = 100_000_000;
        lotteryId = 1;
        lotteryExpiration[lotteryId] = block.timestamp + duration;   
    }

    function mintTicket() external payable {
        require(mintedWallets[msg.sender][lotteryId] == false, "Cannot get more than 1 ticket per account");
        require(msg.value == mintPrice, "Incorrect mint value");
        require(maxSupply > totalSupply, "Sold out");

        mintedWallets[msg.sender][lotteryId] = true;
        players.push(payable(msg.sender));
        _safeMint(msg.sender, ++totalSupply);

        emit MintedSuccessfully(msg.sender, totalSupply);
    }

    function setMaxSupply(uint _maxSupply) external onlyOwner {
        maxSupply = _maxSupply;
    }

    function canGetTicket() public view returns (bool) {
        return mintedWallets[msg.sender][lotteryId] == false;
    }

    function getPreviousWinner(uint _lotteryId) public view returns (address oldWinner) {
        require(_lotteryId < lotteryId, "This lottery is yet to be performed.");
        oldWinner = winnerHistory[_lotteryId];
    }

    function getRandomNumber() public view onlyOwner returns (uint) {
        return uint(keccak256(abi.encodePacked(msg.sender, block.timestamp)));
    }

    function pickWinner() public onlyOwner {
        require(lotteryExpiration[lotteryId] < block.timestamp, "This lottery is still ongoing.");
        
        if(players.length == 0) {
            lotteryExpiration[lotteryId] = block.timestamp + duration;
            emit ExtendLottery(lotteryExpiration[lotteryId]);
        }
        else {
            uint index = getRandomNumber() % players.length;
            players[index].transfer(address(this).balance);
            winnerHistory[lotteryId++] = players[index];

            //reset state
            players = new address payable[](0);
            lotteryExpiration[++lotteryId] = block.timestamp + duration;
        }
    }
}