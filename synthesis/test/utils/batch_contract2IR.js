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
    "registration_right": "RegistrationRightAgreement"
};

var category_dirs = fs.readdirSync('./test_case/');
var cnt = 0;
for (var i=0; i<category_dirs.length; i++) {
    // console.log(category_dirs[i]);
    if (category_dirs[i] == "selected") continue;
    category_dir_path = './test_case/' + category_dirs[i] + '/';
    var contract_dirs = fs.readdirSync(category_dir_path);
    contract_dirs.sort()
    for (var j=0; j<contract_dirs.length; j++) {
        // console.log(contract_dirs[j]);
        contract_dir_path = category_dir_path + contract_dirs[j] + '/';
        var files = fs.readdirSync(contract_dir_path);
        for (var k=0; k<files.length; k++) {
            if (files[k].includes("GroundTruth") && !files[k].includes("backup")) {
                cnt += 1;
                console.log(files[k]);
                // break;
                var IR_template = JSON.parse(fs.readFileSync(appRoot + "/test/IR_template.json"));
                var gt_contract_text = utils.readContract(contract_dir_path + files[k]);
                var gt_ast = parser.parse(gt_contract_text);
                contractGenerator.ast2IR(gt_ast, IR_template);
                IR_template.ContractCategory = contractNameDict[category_dirs[i]];
                printObjectToFile(IR_template, contract_dir_path + "IR_ground_truth.json"); 
                break;               
            }
        }
    }
    // for (var j=0; j<contract_dirs.length; j++) {
    //     // console.log(contract_dirs[j]);
    //     if (!contract_dirs[j].includes("-") || contract_dirs[j].includes("multi")) {
    //         continue;
    //     }
    //     console.log(contract_dirs[j]);
    //     cnt += 1;
    //     // continue;
    //     contract_dir_path = category_dir_path + contract_dirs[j] + '/';
    //     var IR_template = JSON.parse(fs.readFileSync(appRoot + "/test/IR_template.json"));
    //     var gt_contract_text = utils.readContract(contract_dir_path + "ground_truth.sol");
    //     var gt_ast = parser.parse(gt_contract_text);
    //     contractGenerator.ast2IR(gt_ast, IR_template);
    //     IR_template.ContractCategory = contractNameDict[category_dirs[i]];
    //     printObjectToFile(IR_template, contract_dir_path + "IR_ground_truth.json");                
    // }
}

console.log(cnt);

function printObjectToFile(obj, filepath) {
    str = JSON.stringify(obj, null, 4);
    fs.writeFile(filepath, str, "utf-8", function(err) {
        if (err) throw err;
        console.log("Json File saved!");
    });
}