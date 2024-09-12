import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const MultisigFactoryModule = buildModule("MultisigModule", (m) => {


  const MultisigFactory = m.contract("MultisigFactory", [], {});

  return { MultisigFactory };
});

export default MultisigFactoryModule;


