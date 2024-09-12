// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.24;

interface IMultisigFactory {
    function createMultisigWallet(uint256 _quorum, address[] memory _validSigners) external returns (address);
    function getMultiSigClones() external view returns (address[] memory);
}

interface IMultisig {
    function quorum() external view returns (uint256);
    function getOwners() external view returns (address[] memory);
}
