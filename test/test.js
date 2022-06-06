const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Ticket Contract', () => {
    let Ticket, ticket, Proxy, proxy;
    let owner, addr1, addr2;

    abi = [
        "function initialize() public",
        "function mintTicket() external payable",
        "function setMaxSupply(uint _maxSupply) external",
        "function canGetTicket() public view returns (bool)",
        "function getPreviousWinner(uint _lotteryId) public view returns (address oldWinner)",
        "function getRandomNumber() public view returns (uint)",
        "function pickWinner() public",
        "function getMax() public view returns (uint)",
        "function getName() public view returns (string memory)",
        "function getSymbol() public view returns (string memory)",
        "function getExpiration() public view returns (uint)"
    ]

    beforeEach(async () => {
        Ticket = await ethers.getContractFactory('Ticket');
        [owner, addr1, addr2] = await ethers.getSigners();

        ticket =  await Ticket.deploy();

        Proxy = await ethers.getContractFactory('Proxy');
        proxy = await Proxy.deploy();
        await proxy.setTicketContract(ticket.address);
    })

    it('points to ticket contract', async () => {
        expect(await proxy.getTicketContract()).to.equal(ticket.address);
    })

    it('should have name and symbol', async () => {
        const proxied = new ethers.Contract(proxy.address, abi, owner);
        await proxied.initialize();

        expect(await proxied.getName()).to.equal("Ticket")
        expect(await proxied.getSymbol()).to.equal("TKT");
    })

    it('should mint', async () => {     
        const proxied = new ethers.Contract(proxy.address, abi, owner);
        await proxied.initialize();

        const provider = waffle.provider;
        expect(await provider.getBalance(ticket.address)).to.equal(0);

        await expect(proxied.connect(addr1).mintTicket({
            value: ethers.utils.parseEther("0.01"),
        })).to.be.revertedWith("Incorrect mint value");

        await proxied.connect(addr1).mintTicket({
            value: ethers.utils.parseEther("0.05"),
        })
        expect(ethers.utils.formatEther(await provider.getBalance(proxied.address))).to.equal("0.05");

        expect(await proxied.connect(addr1).canGetTicket()).to.equal(false);        

        await expect(proxied.connect(addr1).mintTicket({
            value: ethers.utils.parseEther("0.05"),
        })).to.be.revertedWith("Cannot get more than 1 ticket per account");
        
        await expect(proxied.connect(addr1).setMaxSupply(123)).to.be.revertedWith("Only owner can perform this.");

        await proxied.connect(owner).setMaxSupply(1);
        expect(await proxied.getMax()).to.equal(1);
    })

    it('should pick winner', async () => {
        const proxied = new ethers.Contract(proxy.address, abi, owner);
        await proxied.initialize();

        const advanceBlockTimeBy6Hours = 21600;
        const provider = waffle.provider;

        await expect(proxied.getPreviousWinner(2)).to.be.revertedWith("This lottery is yet to be performed.");
        expect(proxied.getPreviousWinner(-1)).to.be.revertedWith("This lottery is yet to be performed.");
        await expect(proxied.pickWinner()).to.be.revertedWith("This lottery is still ongoing.");      
        await provider.send("evm_increaseTime", [advanceBlockTimeBy6Hours]);
        await provider.send("evm_mine");        

        await expect(proxied.pickWinner()).to.emit(proxied, "ExtendLottery");
        await proxied.pickWinner();
        await proxied.connect(addr1).mintTicket({
            value: ethers.utils.parseEther("0.05"),
            gasLimit: 230_000
        })
        expect(ethers.utils.formatEther(await provider.getBalance(proxied.address))).to.equal("0.05");
        await provider.send("evm_increaseTime", [advanceBlockTimeBy6Hours]);
        await provider.send("evm_mine");
        
        await proxied.connect(owner).pickWinner();
        expect(ethers.utils.formatEther(await provider.getBalance(proxied.address))).to.equal("0.0");

        expect(await proxied.getPreviousWinner(1)).to.equal(addr1.address);
    })
    
    
})