Thank you for the clarification! Below is a README for your **Multisig Factory Contract** assuming it's not using the EIP-1167 minimal proxy pattern but instead deploying full instances of the `Multisig` contract for each request.

---

# Multisig Factory Contract

## Overview

The **Multisig Factory Contract** allows users to deploy new instances of a **Multisig Wallet** contract. Each deployed wallet can have multiple signers, enabling decentralized transaction management with a requirement for multiple approvals before execution.

This contract simplifies the creation of multiple independent multisig wallets by allowing users to specify signers and deploy fully independent contracts for each wallet.

## Features

- Deploy multiple independent **Multisig Wallet** contracts via the factory.
- Each wallet can have multiple signers with configurable permissions.
- Supports full ownership and initialization of wallets with multiple signers.
- Each deployed wallet is fully independent and not reliant on a proxy pattern.
- Easy-to-use factory interface for creating multiple wallets.

## Installation

To deploy and interact with the Multisig Factory Contract, you'll need the following prerequisites:

### Prerequisites

- **Node.js** (v14+)
- **NPM** or **Yarn**
- **Solidity** (v0.8+)
- **Hardhat** or **Truffle** for local development

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/Superior212/mult-sig-wallet
   cd multisig-factory
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

   or

   ```bash
   yarn install
   ```

3. Compile the contracts:

   ```bash
   npx hardhat compile
   ```

4. (Optional) Run unit tests:
   ```bash
   npx hardhat test
   ```

## Contracts

### 1. **Multisig.sol**

This contract allows multiple signers to jointly manage transactions. Signers can submit, confirm, and execute transactions. Each transaction requires a predefined number of confirmations to be executed.

#### Key Functions:

- **`constructor(address[] memory _signers)`**: Initializes the multisig wallet with the provided list of signers.
- **`submitTransaction(address destination, uint value, bytes memory data)`**: Allows a signer to submit a new transaction.
- **`confirmTransaction(uint txId)`**: Allows a signer to confirm a submitted transaction.
- **`executeTransaction(uint txId)`**: Executes the transaction once the required number of confirmations is reached.

#### Key Variables:

- **`signers[]`**: Array storing the wallet's signers.
- **`isSigner[]`**: A mapping to track whether an address is a valid signer.
- **`requiredConfirmations`**: The number of confirmations required for a transaction to be executed.

### 2. **MultisigFactory.sol**

The **MultisigFactory** contract facilitates the creation of fully independent Multisig Wallet instances. Each wallet is deployed and initialized with a unique set of signers.

#### Key Functions:

- **`createMultisig(address[] memory _signers)`**: Deploys a new instance of the `Multisig` contract and initializes it with the provided list of signers.
- **`getMultisigs()`**: Returns an array of all deployed multisig wallet addresses.

#### Events:

- **`MultisigCreated(address multisigAddress)`**: Emitted when a new Multisig wallet is deployed.

## Usage

### 1. Deploy the Factory Contract

The factory contract must be deployed first, allowing users to subsequently create new multisig wallets.

Example deployment using Hardhat:

```javascript
const MultisigFactory = await ethers.getContractFactory("MultisigFactory");
const multisigFactory = await MultisigFactory.deploy();
await multisigFactory.deployed();
console.log("Multisig Factory deployed at:", multisigFactory.address);
```

### 2. Create a New Multisig Wallet

To create a new Multisig wallet, you call the `createMultisig` function on the factory contract with an array of addresses (signers):

```javascript
const tx = await multisigFactory.createMultisig([signer1, signer2, signer3]);
const receipt = await tx.wait();

console.log(
  "New Multisig Wallet deployed at:",
  receipt.events[0].args.multisigAddress
);
```

This will deploy a completely new instance of the `Multisig` contract, which can be interacted with independently.

### 3. Interact with the Multisig Wallet

Once deployed, you can interact with the newly created Multisig wallet by calling its methods to submit, confirm, and execute transactions:

```javascript
const multisigContract = new ethers.Contract(
  multisigAddress,
  multisigAbi,
  signer
);
await multisigContract.submitTransaction(destinationAddress, value, data);
await multisigContract.confirmTransaction(txId);
await multisigContract.executeTransaction(txId);
```

### Example Workflow

1. Deploy the **MultisigFactory**.
2. Use the factory to create a new **Multisig** wallet by providing an array of signers.
3. Interact with the new **Multisig** wallet (submit transactions, confirm, and execute).

## Testing

To test the functionality of the contracts, use the built-in Hardhat test suite:

1. Run the tests:

```bash
npx hardhat test
```

The test scripts cover scenarios such as:

- Successful creation of a new **Multisig Wallet**.
- Transaction submission and confirmation by multiple signers.
- Successful execution of a transaction once the required number of confirmations is met.

## Gas Efficiency

Each multisig wallet is deployed as a fully independent contract instance. While this approach is more gas-intensive than using a proxy pattern, it ensures that each deployed contract is independent and fully customizable.

## Deployment on Mainnet/Testnet

After testing the contract locally, you can deploy the contracts on a public network such as Ethereum, Goerli, or Polygon by configuring your `hardhat.config.js` with the appropriate network details.

Example configuration for Goerli:

```javascript
module.exports = {
  solidity: "0.8.0",
  networks: {
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/your-api-key`,
      accounts: [`0x${privateKey}`],
    },
  },
};
```

To deploy on Goerli:

```bash
npx hardhat run scripts/deploy.js --network goerli
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Feel free to reach out if you encounter any issues or need additional support. Happy coding!
