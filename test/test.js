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
        console.log("Check: both name and symbol have expected values.")
        expect(await ticket.name()).to.equal("Ticket")
        expect(await ticket.symbol()).to.equal("TKT");
    })

    it('should mint', async () => {
        let isMintEnabled = await ticket.isMintEnabled();
        if (!isMintEnabled) {
            console.log("Check: contract properly doesnt pass when minting is not enabled.");
            await expect(ticket.mintTicket()).to.be.revertedWith("Minting is not enabled.");

            console.log("Check: changing mint mode.")
            await ticket.toggleMinting();
            let newMintingState = await ticket.isMintEnabled();            
            expect(newMintingState).to.equal(!isMintEnabled);
        }
        

        console.log("Check: starting balance of contract is 0.")
        const provider = waffle.provider;
        expect(await provider.getBalance(ticket.address)).to.equal(0);


        console.log("Check: address is eligible for ticket.")
        expect(await ticket.connect(addr1).canGetTicket()).to.equal(true);


        console.log("Check: sent value is incorrect.")
        await expect(ticket.connect(addr1).mintTicket({
            value: ethers.utils.parseEther("0.01"),
        })).to.be.revertedWith("Incorrect mint value");


        console.log("Check: mint and update contract balance.")
        await ticket.connect(addr1).mintTicket({
            value: ethers.utils.parseEther("0.05"),
        })
        expect(ethers.utils.formatEther(await provider.getBalance(ticket.address))).to.equal("0.05");


        console.log("Check: address is no longer eligible for ticket.")
        expect(await ticket.connect(addr1).canGetTicket()).to.equal(false);


        console.log("Check: attempt to buy second ticket and fail.")
        await expect(ticket.connect(addr1).mintTicket({
            value: ethers.utils.parseEther("0.05"),
        })).to.be.revertedWith("Cannot get more than 1 ticket per account");
        

        console.log("Check: attempt to change maxSupply from not owner.")
        await expect(ticket.connect(addr1).setMaxSupply(123)).to.be.revertedWith("Ownable: caller is not the owner");


        console.log("Check: setMaxSupply to 1.")
        await ticket.setMaxSupply(1);
        expect(await ticket.maxSupply()).to.equal(1);


        console.log("Check: attempt to buy ticket and go over maxSupply.")
        await expect(ticket.connect(addr2).mintTicket({
            value:ethers.utils.parseEther("0.05"),
        })).to.be.revertedWith("Sold out");
    })
})