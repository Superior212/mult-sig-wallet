// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;


interface IMultisigFactory {
    function createMultisigWallet(uint256 _quorum, address[] memory _validSigners) external returns (address);
    function getMultiSigClones() external view returns (address[] memory);
}

interface IMultisig {
    function quorum() external view returns (uint256);
    function updateQuorumTxId() external view returns (uint256);
    function txCount() external view returns (uint256);
    function transactions(uint256 txId) external view returns (bool isCompleted);
    function updateQuorum(uint256 newQuorum, address[] memory newValidSigners) external;
    function approveUpdate(uint256 updateTxId) external;
    function transfer(uint256 amount, address recipient, address tokenAddress) external;
    function approveTx(uint256 txId) external;
}