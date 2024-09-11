import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MultisigModule = buildModule("MultisigModule", (m) => {
  const quorum = 2;
  const validSigners = [
    "0xB871b7757D9BeadF401216A1151A0bB63aCf5B8b",
    "0xd82a905C6BBb96842Ca7FF09D8884d6DD7824142",
    "0x29bb5e4702fdB02298BB62B17ad893a89CF6DdbD",
  ];

  const lock = m.contract("Multisig", [quorum, validSigners], {});

  return { lock };
});

export default MultisigModule;
