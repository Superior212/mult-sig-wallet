import { ethers } from "hardhat";

async function main() {
  const web3CXITokenAddress = "0xd5e0816207DDf7EAd8dC1Bc9e43C23F7a501a197";
  const web3CXI = await ethers.getContractAt("IERC20", web3CXITokenAddress);

  // Get an instance of the contract for the ERC20 token
  const MultisigContractAddress = "0x17920d9087A91A95020d4C3e38194B8DDF285Cf8";

  // Get an instance of the contract for the Multisig
  const Multisig = await ethers.getContractAt(
    "Multisig",
    MultisigContractAddress
  );

  console.log("Contracts loaded successfully");

  // Approve savings contract to spend token
  const approvalAmount = ethers.parseUnits("1000", 18);

  const approveTx = await web3CXI.approve(Multisig, approvalAmount);
  approveTx.wait();

  // Get the provider from Hardhat
  const provider = ethers.provider;

  // Get the list of accounts
  const [signer] = await ethers.getSigners();

  // Get the address of the signer
  const addressToCheck = await signer.getAddress();

  // Get the balance of the address
  const balanceWei = await provider.getBalance(addressToCheck);

  // Convert the balance from wei to ether
  const balanceEther = ethers.utils.formatEther(balanceWei);

  // Print the balance
  console.log(`Balance of address ${addressToCheck}: ${balanceEther} ETH`);

  // const contractBalanceBeforeDeposit = await Multisig.getContractBalance();
  // console.log("Contract balance before :::", contractBalanceBeforeDeposit);

  // const depositAmount = ethers.parseUnits("150", 18);
  // const depositTx = await saveERC20.deposit(depositAmount);

  // console.log(depositTx);

  // depositTx.wait();

  // const contractBalanceAfterDeposit = await saveERC20.getContractBalance();

  // console.log("Contract balance after :::", contractBalanceAfterDeposit);

  // Withdrawal Interaction

  // const withdrawalAmount = ethers.parseUnits("50", 18);

  // console.log("Withdrawing tokens...");
  // const withdrawTx = await saveERC20.withdraw(withdrawalAmount);
  // await withdrawTx.wait();
  // console.log(withdrawTx);
  // console.log("Withdrawal transaction completed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
