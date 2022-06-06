const { ethers, upgrades } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account: ", deployer.address);

    const balance = await deployer.getBalance();
    console.log("Account balance: ", balance.toString());

    const Ticket = await ethers.getContractFactory("Ticket");
    const tkt = await Ticket.deploy();
    console.log("Ticket address: ", tkt.address);

    const Proxy = await ethers.getContractFactory("Proxy");
    const proxy = await upgrades.deployProxy(Proxy);
    await proxy.deployed();
    console.log("Proxy deployed to:", proxy.address);
}

main();