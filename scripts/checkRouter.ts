import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Checking router with the account:", deployer.address);

  const network = await ethers.provider.getNetwork();
  console.log("Network:", network.name);
  console.log("Chain ID:", Number(network.chainId));

  // Pool 컨트랙트 주소 (BSC Testnet)
  const POOL_ADDRESS = "0x8a322a7CaE547AcD43b1E7019768cea3461485A8";
  
  // Pool 컨트랙트 인스턴스 생성
  const Pool = await ethers.getContractFactory("EDUSwapPool");
  const pool = Pool.attach(POOL_ADDRESS);

  // Router 주소 확인
  const routerAddress = await pool.router();
  console.log("Current Router address:", routerAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 