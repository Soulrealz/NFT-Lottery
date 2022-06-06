pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
//import "../node_modules/@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract Ticket is ERC721Upgradeable {
    address public owner;
    mapping(address => mapping(uint => bool)) public mintedWallets;
    uint public constant mintPrice = 0.05 ether;
    uint public totalSupply;
    uint public maxSupply = 100_000_000;

    address payable[] public players;
    uint public lotteryId;
    uint public duration = 6 hours;
    mapping(uint => uint) public lotteryExpiration;
    mapping(uint => address) public winnerHistory;
    mapping(uint => address) private __owners;

    bool private initialized;

    event MintedSuccessfully(address receiver, uint totalMinted);
    event ExtendLottery(uint extendedTo);
    event SurpriseWinner(address receiver);

    modifier onlyOwner {
        require(msg.sender == owner, "Only owner can perform this.");
        _;
    }
    
    function initialize() public {
        require(!initialized, "Already initialized");
        __ERC721_init("Ticket", "TKT");
        lotteryId = 1;
        lotteryExpiration[lotteryId] = block.timestamp + 6 hours;
        owner = msg.sender;
        maxSupply = 100_000_000;
    }

    function getMax() public view returns (uint) {
        return maxSupply;
    }
    function getName() public view returns (string memory) {
        return name();
    }
    function getSymbol() public view returns (string memory) {
        return symbol();
    }
    function getExpiration() public view returns (uint) {
        return lotteryExpiration[lotteryId];
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

    function surpriseWinner() public onlyOwner {
        require(players.length > 0, "No participants to choose a surprise winner from.");
        uint index = getRandomNumber() % players.length;
        players[index].transfer(address(this).balance / 2);

        emit SurpriseWinner(players[index]);
    }
}