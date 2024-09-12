import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";

// Helper function to compare string representations of numbers
function compareStringNumbers(a: string, b: string): number {
  if (a.length !== b.length) {
    return a.length - b.length;
  }
  return a.localeCompare(b);
}

async function main() {
  // ERC20 token address
  const tokenAddress: string = "0x1ACd45858f8cDe81868C66975Bdcac076Af636F5";
  const token: Contract = await ethers.getContractAt("IERC20", tokenAddress);

  //  18 decimals for the token
  const TOKEN_DECIMALS: number = 18;

  // Address of the MultisigFactory contract
  const MultisigFactoryAddress: string =
    "0x3905df1BA5053D6Ec6a2bAEf6176aF7D39586e3d";
  const MultisigFactory: Contract = await ethers.getContractAt(
    "IMultisigFactory",
    MultisigFactoryAddress
  );

  // Step 1: Create a multi-sig wallet
  const owners: string[] = [
    "0xB871b7757D9BeadF401216A1151A0bB63aCf5B8b",
    "0xd82a905C6BBb96842Ca7FF09D8884d6DD7824142",
    "0x29bb5e4702fdB02298BB62B17ad893a89CF6DdbD",
  ];
  const quorum: number = 2;
  const createWalletTx = await MultisigFactory.createMultisigWallet(
    quorum,
    owners
  );
  await createWalletTx.wait();

  // Step 2: Get the created wallet address
  const multisigClones: string[] = await MultisigFactory.getMultiSigClones();
  const newMultisigAddress: string = multisigClones[multisigClones.length - 1];
  console.log("New Multi-Sig Address:", newMultisigAddress);

  // Step 3: Interact with the new multi-sig wallet
  const multisig: Contract = await ethers.getContractAt(
    "Multisig",
    newMultisigAddress
  );
  console.log("Multi-sig quorum:", await multisig.quorum());

  // Step 4: Transfer ERC20 tokens to the multi-sig wallet
  const [signer]: Signer[] = await ethers.getSigners();
  const signerAddress: string = await signer.getAddress();

  // Check token balance of the signer
  const balance = await token.balanceOf(signerAddress);
  console.log(`Signer address: ${signerAddress}`);
  console.log(
    `Token balance: ${ethers.formatUnits(balance, TOKEN_DECIMALS)} tokens`
  );

  // Amount to transfer (e.g., 100 tokens)
  const transferAmount = ethers.parseUnits("100", TOKEN_DECIMALS);

  // Check if signer has sufficient balance
  if (compareStringNumbers(balance.toString(), transferAmount.toString()) < 0) {
    console.log("Insufficient token balance to make the transfer");
    return;
  }

  try {
    // Approve the transfer
    const approveTx = await token
      .connect(signer)
      .approve(newMultisigAddress, transferAmount);
    await approveTx.wait();
    console.log("Transfer approved");

    // Transfer the tokens
    const transferTx = await token
      .connect(signer)
      .transfer(newMultisigAddress, transferAmount);
    await transferTx.wait();
    console.log(
      `Transferred ${ethers.formatUnits(
        transferAmount,
        TOKEN_DECIMALS
      )} tokens to ${newMultisigAddress}`
    );

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
}

// Execute the main function and handle any errors
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
