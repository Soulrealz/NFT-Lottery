pragma solidity 0.8.9;

contract Proxy {
    bytes32 private constant _IMPL_SLOT =
        bytes32(uint256(keccak256("eip1967.proxy.ticketContract")) - 1);
    address public ticketContract;

    function setTicketContract(address _ticketContract) public {
        ticketContract = _ticketContract;
        // assembly {
        //     sstore(_IMPL_SLOT, _ticketContract)
        // }
    }

    function getTicketContract() public view returns (address) {
        return ticketContract;
        // assembly {
        //     a := sload(_IMPL_SLOT)
        // }
    }

    fallback() external payable {
        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, 0, calldatasize())

            let result := delegatecall(
            gas(),
            sload(ticketContract.slot),
            ptr,
            calldatasize(),
            0,
            0
            )

            let size := returndatasize()
            returndatacopy(ptr, 0, size)

            switch result
            case 0 {
            revert(ptr, size)
            }
            default {
            return(ptr, size)
            }
        }
    }

    receive() external payable {}
}