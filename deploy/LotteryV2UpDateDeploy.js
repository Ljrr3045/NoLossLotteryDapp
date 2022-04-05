const CONTRACT_NAME = "LotteryV2";

module.exports = async ({ getNamedAccounts, deployments }) => {

  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const vrfCoordinator = "0xf0d54349aDdcf704F77AE15b96510dEA15cb7952";

  const ramdomNumber = await deploy('RamdomNumber', {
    from: deployer,
    args: [vrfCoordinator],
    log: true,
  });

  const lotteryV1 = await deploy("LotteryV1", {
    from: deployer,
    proxy: {
      owner: deployer,
      execute: {
        init: {
          methodName: "initContract",
          args: [ramdomNumber.address, vrfCoordinator],
        },
      },
    },
  });

  const lotteryV2 = await deploy("LotteryV1", {
    from: deployer,
    contract: "LotteryV2",
    proxy: {
      owner: deployer,
    },
  });

  console.log("- Proxy UpDate address is: ", lotteryV2.address);
};

module.exports.tags = [CONTRACT_NAME];