import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const Web3CXIModule = buildModule("Web3CXIModule", (m) => {
  const Web3CXI = m.contract("Web3CXI");
  return { Web3CXI };
});

export default Web3CXIModule;
