import { run, ethers } from "hardhat";

async function main() {
  const BSC_CONTRACTS = {
    token: {
      address: "0x47f014E644A6382b9fee21EF3c27e577A2b94E51",
      constructorArguments: [ethers.parseEther("1000000")] // INITIAL_SUPPLY
    },
    pool: {
      address: "0x42bD9c9b6369e2ad7F63b1185922f30f6697986D",
      constructorArguments: ["0x47f014E644A6382b9fee21EF3c27e577A2b94E51"] // token address
    },
    receiver: {
      address: "0x4366640FDDbF4AD0B9231c3F0ecB9FD6709472D0",
      constructorArguments: [
        "0x6EDCE65403992e310A62460808c4b910D972f10f", // BSC endpoint
        "0x42bD9c9b6369e2ad7F63b1185922f30f6697986D", // pool address
        "0x9af79E5cCE523d1e7D1b8F7b9Fd20C9e862A582f"  // owner address
      ]
    },
    router: {
      address: "0xC073627c244f30a97239FEac7aF7687deEAe3e4C",
      constructorArguments: [
        "0x47f014E644A6382b9fee21EF3c27e577A2b94E51", // token address
        "0x42bD9c9b6369e2ad7F63b1185922f30f6697986D", // pool address
        "0x6EDCE65403992e310A62460808c4b910D972f10f", // BSC endpoint
        "0x9af79E5cCE523d1e7D1b8F7b9Fd20C9e862A582f"  // owner address
      ]
    }
  };

  const SEPOLIA_CONTRACTS = {
    token: {
      address: "0x0a055F157e71Bff70232e7558e82465f94aEe0Bd",
      constructorArguments: [ethers.parseEther("1000000")] // INITIAL_SUPPLY
    },
    pool: {
      address: "0x302152fec8924f2735d4643e9456BBBA4624c352",
      constructorArguments: ["0x0a055F157e71Bff70232e7558e82465f94aEe0Bd"] // token address
    },
    receiver: {
      address: "0xFC1e45F8ce1828140DBBA53A83798352AA5f873e",
      constructorArguments: [
        "0x6EDCE65403992e310A62460808c4b910D972f10f", // Sepolia endpoint
        "0x302152fec8924f2735d4643e9456BBBA4624c352", // pool address
        "0x9af79E5cCE523d1e7D1b8F7b9Fd20C9e862A582f"  // owner address
      ]
    },
    router: {
      address: "0xD7A757e06CF7358499975aA699FcE6C8e9b3093f",
      constructorArguments: [
        "0x0a055F157e71Bff70232e7558e82465f94aEe0Bd", // token address
        "0x302152fec8924f2735d4643e9456BBBA4624c352", // pool address
        "0x6EDCE65403992e310A62460808c4b910D972f10f", // Sepolia endpoint
        "0x9af79E5cCE523d1e7D1b8F7b9Fd20C9e862A582f"  // owner address
      ]
    }
  };

  const network = process.env.NETWORK || "bscTestnet";
  const contracts = network === "bscTestnet" ? BSC_CONTRACTS : SEPOLIA_CONTRACTS;

  console.log(`Verifying contracts on ${network}...`);

  for (const [name, contract] of Object.entries(contracts)) {
    console.log(`\nVerifying ${name}...`);
    try {
      await run("verify:verify", {
        address: contract.address,
        constructorArguments: contract.constructorArguments
      });
      console.log(`${name} verified successfully`);
    } catch (error) {
      console.error(`Error verifying ${name}:`, error);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 