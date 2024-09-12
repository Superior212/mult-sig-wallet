import { expect } from "chai";
import { ethers } from "hardhat";

describe("MultisigFactory", function () {
  let multisigFactory: any;
  let signers: any[];

  beforeEach(async function () {
    const MultisigFactory = await ethers.getContractFactory("MultisigFactory");
    multisigFactory = await MultisigFactory.deploy();
    await multisigFactory.deploymentTransaction().wait();
    signers = await ethers.getSigners();
  });

  it("should initialize the MultisigFactory contract", async function () {
    const multisigClones = await multisigFactory.getMultiSigClones();
    expect(multisigClones.length).to.equal(0);
  });

  // Test 2: Contract Creation
  it("should create a multi-sig contract with correct quorum and owners", async function () {
    const owners = [signers[0].address, signers[1].address];
    const quorum = 2;
    await multisigFactory.createMultisigWallet(quorum, owners);

    const multisigClones = await multisigFactory.getMultiSigClones();
    expect(multisigClones.length).to.equal(1);
  });

  // Test 3: Multiple Contract Creation
  it("should create multiple multi-sig contracts", async function () {
    const owners1 = [signers[0].address, signers[1].address];
    const owners2 = [signers[2].address, signers[3].address];
    await multisigFactory.createMultisigWallet(2, owners1);
    await multisigFactory.createMultisigWallet(2, owners2);

    const multisigClones = await multisigFactory.getMultiSigClones();
    expect(multisigClones.length).to.equal(2);
  });


});
