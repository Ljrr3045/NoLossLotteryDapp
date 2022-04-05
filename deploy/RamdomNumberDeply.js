const CONTRACT_NAME = "RamdomNumber";

module.exports = async ({getNamedAccounts, deployments}) => {

    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();

    const vrfCoordinator = "0xf0d54349aDdcf704F77AE15b96510dEA15cb7952";

    const ramdomNumber = await deploy('RamdomNumber', {
      from: deployer,
      args: [vrfCoordinator],
      log: true,
    });

    console.log("- Contract RamdomNumber address is: ", ramdomNumber.address);
};

module.exports.tags = [CONTRACT_NAME];
