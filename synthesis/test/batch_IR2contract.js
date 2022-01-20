const appRoot = require("app-root-path");
const transformer = require(appRoot + "/src/ast-transformer");
const advancedTransformer = require(appRoot + "/src/advancedtransformer");
const parser = require(appRoot + "/src/solidity-parser-antlr/src/index");
const fs = require("fs");
const utils = require(appRoot + "/src/utils");
const generator = require(appRoot + "/src/solidity-generator");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const web3 = require("web3")
const contractGenerator = require(appRoot + "/src/smart_gen");

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
    "credit_contract": "CreditAgreement"
};

// get AST of template contract
var template_text = utils.readContract(
    appRoot + "/test/ContractTemplate.sol"
);
// var template_ast = parser.parse(template_text, {loc: true, range: true});
var template_ast = parser.parse(template_text);
parser.setDepthAndID(template_ast, true, true);

var template_ast_backup = transformer.cloneNode(template_ast);

var sample_args = {
    EffectiveTime : "1000",
    CloseTime : "1000",
    OutSideClosingDate : "1000",
    SellerAddress : 0,
    BuyerAddresses : [0],
    needPriceConversion: false,
    contractName: ""
};

var category_dirs = fs.readdirSync('./test_case/');
for (var i=0; i<category_dirs.length; i++) {
    // console.log(category_dirs[i]);
    if (category_dirs[i] == "selected") continue;
    category_dir_path = './test_case/' + category_dirs[i] + '/';
    var contract_dirs = fs.readdirSync(category_dir_path);
    contract_dirs.sort()
    for (var j=0; j<contract_dirs.length; j++) {
        // if (contract_dirs[j].includes("-") || contract_dirs[j].includes("multi")) {
        //     continue;
        // }
        if (contract_dirs[j].includes("multi")) {
            continue;
        }

        console.log(contract_dirs[j]);
        contract_dir_path = category_dir_path + contract_dirs[j] + '/';
        var IR = JSON.parse(fs.readFileSync(contract_dir_path + "IR_ground_truth.json"));
        template_ast = transformer.cloneNode(template_ast_backup);
        sample_args.contractName = contractNameDict[category_dirs[i]] + j.toString() + "_" + "ground_truth";
        contractGenerator.extractIR(IR, template_ast, sample_args);
        parser.setDepthAndID(template_ast, true, true);
        generator.run(template_ast);
        utils.writeContract(
            generator.text,
            contract_dir_path + "ground_truth.sol"
        );       
    }
}