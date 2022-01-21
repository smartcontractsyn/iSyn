const fs = require("fs");

contractNameDict = {
    "security_agreement" : "SecurityAgreement",
    "employ_agreememt" : "EmployAgreement",
    "security_purchase" : "SecurityPurchaseAgreement",
    "underwriting_agreement": "UnderWritingAgeement",
    "purchase_agreement": "PurchaseAgreement",
    "registration_right": "RegistrationRightAgreement",
    "agreement": "MiscAgreement",
    "indenture_contract": "IndentureAgreement",
    "plan_and_merger": "PlanAndMergerAgreement",
    "trust_agreement": "TrustAgreement",
    "underwriting_agreement": "UnderwritingAgreement",
    "credit_contract": "CreditAgreement",
    "stock_purchase_agreement": "StockPurchaseAgreement"
};

module.exports = async function(deployer) {
    var category_dirs = fs.readdirSync('./contracts/test_case/');
    for (var i=0; i<category_dirs.length; i++) {
        if (category_dirs[i] == "selected") continue;
        category_dir_path = './contracts/test_case/' + category_dirs[i] + '/';
        var contract_dirs = fs.readdirSync(category_dir_path);
        contract_dirs.sort()
        for (var j=0; j<contract_dirs.length; j++) {
            let contract_name = contractNameDict[category_dirs[i]] + "_" + j.toString();
            const cur_contract = artifacts.require(contract_name);
            await deployer.deploy(cur_contract);
            const a = await cur_contract.deployed();
        }
    }
}
