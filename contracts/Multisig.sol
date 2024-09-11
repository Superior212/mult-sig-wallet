// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Multisig {
    uint256 public quorum; // Minimum number of signatures required to approve a transaction
    uint256 public noOfValidSigners; // Number of valid signers (owners) of the multisig wallet
    uint256 public txCount; // Counter for the total number of transactions

    // Structure to define a transaction
    struct Transaction {
        uint256 id; // Unique identifier for the transaction
        uint256 amount; // Amount of tokens to be transferred
        address sender; // Address of the entity proposing the transaction
        address recipient; // Address of the recipient of the tokens
        bool isCompleted; // Flag indicating whether the transaction has been executed
        uint256 timestamp; // Timestamp when the transaction was created
        uint256 noOfApproval; // Number of approvals received for this transaction
        address tokenAddress; // Address of the ERC20 token to be used in the transaction
        address[] transactionSigners; // List of signers who have approved the transaction
    }

    // Mappings to manage signers and transactions
    mapping(address => bool) public isValidSigner; // Address -> whether it's a valid signer
    mapping(uint => Transaction) public transactions; // txId -> Transaction details
    mapping(address => mapping(uint256 => bool)) public hasSigned; // Signer -> txId -> whether the signer has approved the transaction

    // Variables for updating quorum and signers
    uint256 public updateQuorumTxId; // Transaction ID for quorum update
    uint256 public newQuorum; // Proposed new quorum value
    address[] public newValidSigners; // Proposed new list of valid signers
    mapping(uint256 => mapping(address => bool)) public hasApprovedUpdate; // Update txId -> signer -> whether the signer has approved the update

    // Constructor to initialize the contract with valid signers and quorum
    constructor(uint256 _quorum, address[] memory _validSigners) {
        require(_validSigners.length > 1, "few valid signers"); // Ensure there is more than one valid signer
        require(_quorum > 1, "quorum is too small"); // Ensure quorum is greater than 1

        for (uint256 i = 0; i < _validSigners.length; i++) {
            require(_validSigners[i] != address(0), "zero address not allowed"); // Ensure no zero addresses
            require(!isValidSigner[_validSigners[i]], "signer already exist"); // Ensure no duplicate signers

            isValidSigner[_validSigners[i]] = true; // Register valid signer
        }

        noOfValidSigners = _validSigners.length; // Set number of valid signers

        if (!isValidSigner[msg.sender]) {
            isValidSigner[msg.sender] = true;
            noOfValidSigners += 1;
        }

        require(
            _quorum <= noOfValidSigners,
            "quorum greater than valid signers"
        );
        quorum = _quorum; // Set the quorum
    }

    // Function to transfer
    function transfer(
        uint256 _amount,
        address _recipient,
        address _tokenAddress
    ) external {
        require(msg.sender != address(0), "address zero found");
        require(isValidSigner[msg.sender], "invalid signer");

        require(_amount > 0, "can't send zero amount");
        require(_recipient != address(0), "address zero found");
        require(_tokenAddress != address(0), "address zero found");

        require(
            IERC20(_tokenAddress).balanceOf(address(this)) >= _amount,
            "insufficient funds"
        );

        uint256 _txId = txCount + 1;
        Transaction storage trx = transactions[_txId];

        trx.id = _txId;
        trx.amount = _amount;
        trx.recipient = _recipient;
        trx.sender = msg.sender;
        trx.timestamp = block.timestamp;
        trx.tokenAddress = _tokenAddress;
        trx.noOfApproval += 1;
        trx.transactionSigners.push(msg.sender);
        hasSigned[msg.sender][_txId] = true;

        txCount += 1;
    }

    function approveTx(uint256 _txId) external {
        Transaction storage trx = transactions[_txId];

        require(trx.id != 0, "invalid tx id");

        require(
            IERC20(trx.tokenAddress).balanceOf(address(this)) >= trx.amount,
            "insufficient funds"
        );
        require(!trx.isCompleted, "transaction already completed");
        require(trx.noOfApproval < quorum, "approvals already reached");

        // for(uint256 i = 0; i < trx.transactionSigners.length; i++) {
        //     if(trx.transactionSigners[i] == msg.sender) {
        //         revert("can't sign twice");
        //     }
        // }

        require(isValidSigner[msg.sender], "not a valid signer");
        require(!hasSigned[msg.sender][_txId], "can't sign twice");

        hasSigned[msg.sender][_txId] = true;
        trx.noOfApproval += 1;
        trx.transactionSigners.push(msg.sender);

        if (trx.noOfApproval == quorum) {
            trx.isCompleted = true;
            IERC20(trx.tokenAddress).transfer(trx.recipient, trx.amount);
        }
    }

    function updateQuorum(
        uint256 _newQuorum,
        address[] memory _newValidSigners
    ) public {
        require(isValidSigner[msg.sender], "Not a valid signer");
        require(
            _newValidSigners.length > 1,
            "New signers must be more than one"
        );
        require(
            _newQuorum <= _newValidSigners.length,
            "New quorum is too high"
        );

        updateQuorumTxId += 1;

        newQuorum = _newQuorum;
        newValidSigners = _newValidSigners;

        for (uint256 i = 0; i < _newValidSigners.length; i++) {
            hasApprovedUpdate[updateQuorumTxId][_newValidSigners[i]] = false;
        }
    }

    function approveUpdate(uint256 _updateTxId) public {
        require(isValidSigner[msg.sender], "Not a valid signer");
        require(
            _updateTxId == updateQuorumTxId,
            "Invalid update transaction ID"
        );
        require(
            !hasApprovedUpdate[_updateTxId][msg.sender],
            "Already approved"
        );

        hasApprovedUpdate[_updateTxId][msg.sender] = true;

        uint8 approvals = 0;
        for (uint256 i = 0; i < newValidSigners.length; i++) {
            if (hasApprovedUpdate[_updateTxId][newValidSigners[i]]) {
                approvals += 1;
            }
        }

        if (approvals >= newQuorum) {
            quorum = newQuorum;
            noOfValidSigners = uint8(newValidSigners.length);

            // Update the valid signers
            for (uint256 i = 0; i < newValidSigners.length; i++) {
                isValidSigner[newValidSigners[i]] = true;
            }
        }
    }
}
