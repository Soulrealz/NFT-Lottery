pragma solidity 0.8.9;

import "./Proxy.sol";

contract Factory {
    event Deploy(address addr);

    function deploy(uint _salt) external {
        Proxy proxy = new Proxy { salt: bytes32(_salt) }(msg.sender);

        emit Deploy(address(proxy));
    }

    function getAddress(bytes memory bytecode, uint _salt) public view returns (address) {
        bytes32 hs = keccak256(abi.encodePacked(bytes1(0xff), address(this), _salt, keccak256(bytecode)));
        //last 20bytes
        return address(uint160(uint(hs)));
    }

    function getByteCode(address _owner) public pure returns (bytes memory) {
        bytes memory bytecode = type(Proxy).creationCode;
        return abi.encodePacked(bytecode, abi.encode(_owner));
    }
}