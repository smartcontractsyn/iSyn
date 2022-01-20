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

testcase_Dirs = [["0", "1", "2", "3", "4", "4", "5"], // PA
                ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"], // SPA
                ["0", "1", "2", "3"], // SECPA
                ["0", "1"]]; // SA

// testcase_Dirs = [[], // PA
//                 ["0", "1", "2", "3", "4", "5", "6"], // SPA
//                 ["0", "1"], // SECPA
//                 ["0", "1"]]; // SA

groundTruthNamePatterns = ["PurchaseAgreementGroundTruth_", "StockPurchaseAgreementGroundTruth_", "SecurityPurchaseAgreementGroundTruth_", "SecurityAgreementGroundTruth_"];
generatedNamePatterns = ["PurchaseAgreementGenerated_", "StockPurchaseAgreementGenerated_", "SecurityPurchaseAgreementGenerated_", "SecurityAgreementGenerated_"];
dirNamePatterns = ["PA", "SPA", "SECPA", "SA"];

// get AST of template contract
var template_text = utils.readContract(
    appRoot + "/test/StockPurchaseAgreementTemplate_Test.sol"
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

for (var i=0; i<dirNamePatterns.length; i++) {
    for (var j=0; j<testcase_Dirs[i].length; ++j) {
        // var IR = JSON.parse(s.readFileSync(appRoot + "/test/test_case/" + dirNamePatterns[i] + "/" + contractNamePatterns[i] + testcase_Dirs[j] + ".sol"));
        var IR = JSON.parse(fs.readFileSync(appRoot + "/test/test_case/" + dirNamePatterns[i] + testcase_Dirs[i][j] + "/IR.json"));
        template_ast = transformer.cloneNode(template_ast_backup);
        sample_args.contractName = IR.ContractCategory + "_" + testcase_Dirs[i][j] + "_" + "sythesized";
        contractGenerator.extractIR(IR, template_ast, sample_args);
        parser.setDepthAndID(template_ast, true, true);
        generator.run(template_ast);
        utils.writeContract(
            generator.text,
            appRoot +
                "/test/test_case/" + dirNamePatterns[i] + testcase_Dirs[i][j] + "/" + generatedNamePatterns[i] + testcase_Dirs[i][j] + ".sol"
            );
    }
}

