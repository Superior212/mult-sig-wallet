import { ethers } from "hardhat";
import { Signer } from "ethers";
import { IERC20, IMultisigFactory, IMultisig } from "../typechain-types";

async function main() {
  // ERC20 token address
  const tokenAddress: string = "0x1ACd45858f8cDe81868C66975Bdcac076Af636F5";
  const token: IERC20 = await ethers.getContractAt("IERC20", tokenAddress) as IERC20;

  // 18 decimals for the token
  const TOKEN_DECIMALS: number = 18;

  // Address of the MultisigFactory contract
  const MultisigFactoryAddress: string = "0x3905df1BA5053D6Ec6a2bAEf6176aF7D39586e3d";
  const MultisigFactory: IMultisigFactory = await ethers.getContractAt(
    "IMultisigFactory",
    MultisigFactoryAddress
  ) as IMultisigFactory;

  // Step 1: Create a multi-sig wallet
  const [signer1, signer2, signer3] = await ethers.getSigners();
  const owners: string[] = [
    await signer1.getAddress(),
    await signer2.getAddress(),
    await signer3.getAddress(),
  ];
  const initialQuorum: number = 2;
  const createWalletTx = await MultisigFactory.createMultisigWallet(
    initialQuorum,
    owners
  );
  const createWalletReceipt = await createWalletTx.wait();
  console.log("Create Wallet Transaction Receipt:", createWalletReceipt);

  // Step 2: Get the created wallet address
  const multisigClones: string[] = await MultisigFactory.getMultiSigClones();
  const newMultisigAddress: string = multisigClones[multisigClones.length - 1];
  console.log("New Multi-Sig Address:", newMultisigAddress);

  // Step 3: Interact with the new multi-sig wallet
  const multisig: IMultisig = await ethers.getContractAt(
    "IMultisig",
    newMultisigAddress
  ) as IMultisig;
  console.log("Initial Multi-sig quorum:", await multisig.quorum());

  // Step 4: Update the quorum
  const newQuorum: number = 3;
  const newValidSigners: string[] = [
    await signer1.getAddress(),
    await signer2.getAddress(),
    await signer3.getAddress(),
  ];

  try {
    // Propose the quorum update
    const updateQuorumTx = await multisig
      .connect(signer1)
      .updateQuorum(newQuorum, newValidSigners);
    const updateQuorumReceipt = await updateQuorumTx.wait();
    console.log("Quorum update proposed");
    console.log("Update Quorum Transaction Receipt:", updateQuorumReceipt);

    // Get the update transaction ID
    const updateTxId = await multisig.updateQuorumTxId();
    console.log("Quorum update Transaction ID:", updateTxId);

    // Approve the update with multiple signers
    for (const signer of [signer1, signer2, signer3]) {
      const approveTx = await multisig
        .connect(signer)
        .approveUpdate(updateTxId);
      const approveReceipt = await approveTx.wait();
      console.log(`Quorum update approved by ${await signer.getAddress()}`);
      console.log(
        `Approve Update Transaction Receipt for ${await signer.getAddress()}:`,
        approveReceipt
      );
    }

    // Verify the new quorum
    const updatedQuorum = await multisig.quorum();
    console.log("Updated Multi-sig quorum:", updatedQuorum);

    // Note: noOfValidSigners() is not in our IMultisig interface, so we'll skip this check
  } catch (error) {
    console.error("Error during quorum update:", (error as Error).message);
  }

  // Step 5: Transfer ERC20 tokens to the multi-sig wallet
  const transferAmount = ethers.parseUnits("10", TOKEN_DECIMALS);

  try {
    // Approve the transfer
    const approveTx = await token
      .connect(signer1)
      .approve(newMultisigAddress, transferAmount);
    const approveReceipt = await approveTx.wait();
    console.log("Transfer approved");
    console.log("Approve Transfer Transaction Receipt:", approveReceipt);

    // Transfer the tokens
    const transferTx = await token
      .connect(signer1)
      .transfer(newMultisigAddress, transferAmount);
    const transferReceipt = await transferTx.wait();
    console.log(
      `Transferred ${ethers.formatUnits(
        transferAmount,
        TOKEN_DECIMALS
      )} tokens to ${newMultisigAddress}`
    );
    console.log("Transfer Transaction Receipt:", transferReceipt);

    // Verify the transfer by checking the multisig wallet's balance
    const multisigBalance = await token.balanceOf(newMultisigAddress);
    console.log(
      `Multisig token balance: ${ethers.formatUnits(
        multisigBalance,
        TOKEN_DECIMALS
      )} tokens`
    );
  } catch (error) {
    console.error("Error during token transfer:", (error as Error).message);
  }

  // Step 6: Execute the transfer from the multi-sig wallet
  try {
    // Initiate the transfer
    const initiateTransferTx = await multisig
      .connect(signer1)
      .transfer(transferAmount, await signer1.getAddress(), tokenAddress);
    const initiateTransferReceipt = await initiateTransferTx.wait();
    console.log("Transfer initiated");
    console.log(
      "Initiate Transfer Transaction Receipt:",
      initiateTransferReceipt
    );

    // Get the transaction ID
    const txId = await multisig.txCount();
    console.log("Transaction ID:", txId);

    // Approve the transaction with two more signers (due to new quorum of 3)
    for (const signer of [signer2, signer3]) {
      const approveTx = await multisig.connect(signer).approveTx(txId);
      const approveReceipt = await approveTx.wait();
      console.log(`Transaction approved by ${await signer.getAddress()}`);
      console.log(
        `Approve Transaction Receipt for ${await signer.getAddress()}:`,
        approveReceipt
      );
    }

    // Check if the transaction is completed
    const isCompleted = await multisig.transactions(txId);
    if (isCompleted) {
      console.log(
        `Transferred ${ethers.formatUnits(
          transferAmount,
          TOKEN_DECIMALS
        )} tokens from multisig wallet to ${await signer1.getAddress()}`
      );
    } else {
      console.log("Transaction not yet completed. May require more approvals.");
    }

    // Verify the transfer
    const finalBalance = await token.balanceOf(await signer1.getAddress());
    console.log(
      `Signer1 final balance: ${ethers.formatUnits(
        finalBalance,
        TOKEN_DECIMALS
      )} tokens`
    );
  } catch (error) {
    console.error(
      "Error during transfer from multisig:",
      (error as Error).message
    );
  }
}

// Execute the main function and handle any errors
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});