const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account: ", deployer.address);

    const balance = await deployer.getBalance();
    console.log("Account balance: ", balance.toString());

    const Ticket = await ethers.getContractFactory('Ticket');
    const tkt = await Ticket.deploy();
    console.log("Ticket address: ", tkt.address);
}

main().then(() => process.exit(0))
        .catch(error => {
            console.error(error);
            process.exit(1);
        })