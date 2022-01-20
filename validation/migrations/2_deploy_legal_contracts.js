const PurchaseAgreement = artifacts.require("PurchaseAgreement");
const OracleTest = artifacts.require("OracleTest");

module.exports = async function(deployer) {
    await deployer.deploy(OracleTest);
    const a = await OracleTest.deployed();
    await deployer.deploy(PurchaseAgreement);
    const b = await PurchaseAgreement.deployed();
    // await b.setOracleAddress(a);
};