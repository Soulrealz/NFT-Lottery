const { ethers, upgrades } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account: ", deployer.address);

    const balance = await deployer.getBalance();
    console.log("Account balance: ", balance.toString());

    const Ticket = await ethers.getContractFactory("Ticket");
    const tkt = await Ticket.deploy();
    console.log("Ticket address: ", tkt.address);

    const Factory = await ethers.getContractFactory("Factory");
    const factory = await Factory.deploy();
    console.log("Factory deployed to: ", factory.address);

    const bytecode = await factory.getByteCode(deployer.address);
    const address = await factory.getAddress(bytecode, 777);
    await factory.deploy(777);    
    console.log("Proxy deployed to: ", address);
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });