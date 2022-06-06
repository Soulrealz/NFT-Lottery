const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('Ticket Contract', () => {
    let Ticket, ticket, owner, addr1, addr2;

    beforeEach(async () => {
        Ticket = await ethers.getContractFactory('Ticket');
        [owner, addr1, addr2] = await ethers.getSigners();

        ticket =  await Ticket.deploy();
    })

    it('should have name and symbol', async () => {
        expect(await ticket.name()).to.equal("Ticket")
        expect(await ticket.symbol()).to.equal("TKT");
    })

    it('should mint', async () => {     
        const provider = waffle.provider;
        expect(await provider.getBalance(ticket.address)).to.equal(0);


        expect(await ticket.connect(addr1).canGetTicket()).to.equal(true);


        await expect(ticket.connect(addr1).mintTicket({
            value: ethers.utils.parseEther("0.01"),
        })).to.be.revertedWith("Incorrect mint value");


        await ticket.connect(addr1).mintTicket({
            value: ethers.utils.parseEther("0.05"),
        })
        expect(ethers.utils.formatEther(await provider.getBalance(ticket.address))).to.equal("0.05");


        expect(await ticket.connect(addr1).canGetTicket()).to.equal(false);


        await expect(ticket.connect(addr1).mintTicket({
            value: ethers.utils.parseEther("0.05"),
        })).to.be.revertedWith("Cannot get more than 1 ticket per account");
        

        await expect(ticket.connect(addr1).setMaxSupply(123)).to.be.revertedWith("Ownable: caller is not the owner");


        await ticket.setMaxSupply(1);
        expect(await ticket.maxSupply()).to.equal(1);


        await expect(ticket.connect(addr2).mintTicket({
            value:ethers.utils.parseEther("0.05"),
        })).to.be.revertedWith("Sold out");
    })

    it('should pick winner', async () => {
        const advanceBlockTimeBy6Hours = 21600;
        const provider = waffle.provider;

        await expect(ticket.getPreviousWinner(2)).to.be.revertedWith("This lottery is yet to be performed.");
        expect(ticket.getPreviousWinner(-1)).to.be.revertedWith("This lottery is yet to be performed.");

        await expect(ticket.pickWinner()).to.be.revertedWith("This lottery is still ongoing.");        
        await provider.send("evm_increaseTime", [advanceBlockTimeBy6Hours]);
        await provider.send("evm_mine");        
        await expect(ticket.pickWinner()).to.emit(ticket, "ExtendLottery");
        

        await ticket.connect(addr1).mintTicket({
            value: ethers.utils.parseEther("0.05"),
        })
        expect(ethers.utils.formatEther(await provider.getBalance(ticket.address))).to.equal("0.05");
        await provider.send("evm_increaseTime", [advanceBlockTimeBy6Hours]);
        await provider.send("evm_mine");
        
        await ticket.pickWinner();
        expect(ethers.utils.formatEther(await provider.getBalance(ticket.address))).to.equal("0.0");

        expect(await ticket.getPreviousWinner(1)).to.equal(addr1.address);
    })
})