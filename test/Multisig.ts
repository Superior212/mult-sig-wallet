import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Multisig", function () {
  async function deployMultisigFixture() {
    const [owner, signer1, signer2, signer3, recipient] =
      await ethers.getSigners();

    const Web3CXI = await ethers.getContractFactory("Web3CXI");
    const web3CXI = await Web3CXI.deploy();

    const quorum = 2;
    const validSigners = [owner.address, signer1.address, signer2.address];

    const Multisig = await ethers.getContractFactory("Multisig");
    const multisig = await Multisig.deploy(quorum, validSigners);

    // Transfer some tokens to the multisig contract
    await web3CXI.transfer(multisig.target, ethers.parseUnits("1000", 18));

    return {
      multisig,
      web3CXI,
      owner,
      signer1,
      signer2,
      signer3,
      recipient,
      quorum,
    };
  }

  describe("Deployment", function () {
    it("Should set the correct quorum and valid signers", async function () {
      const { multisig, quorum, owner, signer1, signer2 } = await loadFixture(
        deployMultisigFixture
      );

      expect(await multisig.quorum()).to.equal(quorum);
      expect(await multisig.noOfValidSigners()).to.equal(3);

      expect(await multisig.isValidSigner(await owner.getAddress())).to.be.true;
      expect(await multisig.isValidSigner(await signer1.getAddress())).to.be
        .true;
      expect(await multisig.isValidSigner(await signer2.getAddress())).to.be
        .true;
    });
  });

  describe("Transfer", function () {
    // require(msg.sender != address(0), "address zero found");

    it("Should revert if a zero address is provided as a valid signer", async function () {
      const [owner, signer1] = await ethers.getSigners();
      const quorum = 2;
      const invalidSigners = [
        owner.address,
        signer1.address,
        ethers.ZeroAddress,
      ];

      const Multisig = await ethers.getContractFactory("Multisig");

      await expect(Multisig.deploy(quorum, invalidSigners)).to.be.revertedWith(
        "zero address not allowed"
      );
    });

    // require(isValidSigner[msg.sender], "invalid signer");

    it("Should revert if sender is not a valid signer", async function () {
      const { multisig, web3CXI, signer3, recipient } = await loadFixture(
        deployMultisigFixture
      );

      await expect(
        multisig
          .connect(signer3)
          .transfer(100, recipient.address, web3CXI.target)
      ).to.be.revertedWith("invalid signer");
    });

    //  require(_amount > 0, "can't send zero amount");

    it("Should revert on zero amount", async function () {
      const { multisig, web3CXI, signer1, recipient } = await loadFixture(
        deployMultisigFixture
      );

      const amount = ethers.parseUnits("0", 18);

      await expect(
        multisig
          .connect(signer1)
          .transfer(amount, web3CXI.target, recipient.address)
      ).to.be.revertedWith("can't send zero amount");
    });

    // require(_recipient != address(0), "address zero found");

    it("Should revert if the recipient is address zero", async function () {
      const { multisig, web3CXI, signer2 } = await loadFixture(
        deployMultisigFixture
      );

      await expect(
        multisig
          .connect(signer2)
          .transfer(100, ethers.ZeroAddress, web3CXI.target)
      ).to.be.revertedWith("address zero found");
    });

    // require(IERC20(_tokenAddress).balanceOf(address(this)) >= _amount, "insufficient funds");

    it("Should revert if amount is greater than balance (simple method)", async function () {
      const { multisig, web3CXI, signer1, recipient } = await loadFixture(
        deployMultisigFixture
      );

      // Get the current balance of the multisig contract
      const contractBalance = await web3CXI.balanceOf(multisig.target);

      // Create an amount slightly larger than the contract balance
      const excessiveAmount = contractBalance + ethers.parseUnits("1", 18);

      // Prepare the transaction data
      const transferTx = await expect(
        multisig
          .connect(signer1)
          .transfer(excessiveAmount, recipient.address, web3CXI.target)
      ).to.be.revertedWith("insufficient funds");

      // Verify that the contract balance remains unchanged
      expect(await web3CXI.balanceOf(multisig.target)).to.equal(
        contractBalance
      );
    });

    // require(IERC20(_tokenAddress).balanceOf(address(this)) >= _amount, "insufficient funds");

    it("Should revert if amount is greater than balance (alternative version)", async function () {
      const { multisig, web3CXI, signer1, recipient } = await loadFixture(
        deployMultisigFixture
      );

      // Get the current balance of the multisig contract
      const contractBalance = await web3CXI.balanceOf(multisig.target);

      // Try to transfer an amount greater than the contract balance
      const excessiveAmount = contractBalance + BigInt(1);

      // Attempt to initiate a transfer with an excessive amount
      await expect(
        multisig
          .connect(signer1)
          .transfer(excessiveAmount, recipient.address, web3CXI.target)
      ).to.be.revertedWith("insufficient funds");

      // Verify that the contract balance remains unchanged
      expect(await web3CXI.balanceOf(multisig.target)).to.equal(
        contractBalance
      );
    });

    // require(IERC20(_tokenAddress).balanceOf(address(this)) >= _amount, "insufficient funds");

    it("Should create a new transaction", async function () {
      const { multisig, web3CXI, owner, recipient } = await loadFixture(
        deployMultisigFixture
      );

      const amount = ethers.parseEther("100");
      await multisig.transfer(amount, recipient.address, web3CXI.target);

      const tx = await multisig.transactions(1);
      expect(tx.id).to.equal(1);
      expect(tx.amount).to.equal(amount);
      expect(tx.recipient).to.equal(recipient.address);
      expect(tx.sender).to.equal(owner.address);
      expect(tx.isCompleted).to.be.false;
      expect(tx.noOfApproval).to.equal(1);
      expect(tx.tokenAddress).to.equal(web3CXI.target);
    });
  });

  describe("Update Quorum", function () {
    it("Should propose and approve quorum update", async function () {
      const { multisig, owner, signer1, signer2, signer3 } = await loadFixture(
        deployMultisigFixture
      );

      // Propose a quorum update
      const newQuorum = 3;
      const newSigners = [
        owner.address,
        signer1.address,
        signer2.address,
        signer3.address,
      ];
      await multisig.connect(owner).updateQuorum(newQuorum, newSigners);

      // Approve the quorum update
      await multisig.connect(owner).approveUpdate(1); // Assuming tx ID 1
      await multisig.connect(signer1).approveUpdate(1);
      await multisig.connect(signer2).approveUpdate(1);

      // Check if the quorum is updated
      expect(await multisig.quorum()).to.equal(newQuorum);
      expect(await multisig.noOfValidSigners()).to.equal(newSigners.length);

      for (const signer of newSigners) {
        expect(await multisig.isValidSigner(signer)).to.be.true;
      }
    });
  });
});
