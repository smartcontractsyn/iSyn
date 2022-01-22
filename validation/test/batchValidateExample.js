const fs = require("fs");
const exec = require('child_process').exec;
const singleContractValidate = require("../src/validate.js");
const validationCase = require("../src/validationCase.js");

var sample_args = {
    EffectiveTime : 1000,
    CloseTime : 1000,
    OutSideClosingDate : 1000,
    SellerAddress : 0,
    BuyerAddresses : [0],
    needPriceConversion: false,
};

// child = exec('cat *.js bad_file | wc -l',
//     function (error, stdout, stderr) {
//         console.log('stdout: ' + stdout);
//         console.log('stderr: ' + stderr);
//         if (error !== null) {
//              console.log('exec error: ' + error);
//         }
//     });
// child();

let test_config = {
    effectiveTime: 1619366400,
    closeTime: 1000000000,
    expireDate: 1627660800,
    price: 20000000,
    ETHPrice: 100
  };

let column_tags = ['Contract',
    "gen validation case",
    "gt validation case",
    "gen operation constraint",
    "gt operation constraint",
    "gen operation constraint bitvec",
    "gt operation constraint bitvec"
];

let all_constraints = [
    'EffectiveTimeCon',
    'PaymentRoleCon',
    'PaymentTimeCon',
    'PaymentPriceCon',
    'PaymentTransferCon',
    'ValidFileSignUploaderCon',
    'OtherTerminationCon',
    'OutOfDateTerminationCon',
    'TransferTerminationCon'
];

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

var category_dirs = fs.readdirSync('./test/test_case/');
var output_str = "";
output_str = "|" + column_tags.join("|") + "|" + "\n";
output_str = output_str + "|";
for (var i=0; i<column_tags.length; ++i)
    output_str = output_str + "----|";
output_str += "\n";

for (var i=0; i<category_dirs.length; i++) {
    // console.log(category_dirs[i]);
    if (category_dirs[i] != "stock_purchase_agreement") continue;
    category_dir_path = './test/test_case/' + category_dirs[i] + '/';
    var contract_dirs = fs.readdirSync(category_dir_path);
    contract_dirs.sort()
    for (var j=0; j<contract_dirs.length; j++) {
        if (contract_dirs[j].includes("multi")) {
            continue;
        }

        contract_dir_path = category_dir_path + contract_dirs[j] + '/';
        contract_files = fs.readdirSync(contract_dir_path);
        // console.log(contract_files);
        if (!contract_files.includes("IR.json")) continue;

        console.log(contract_dirs[j]);

        var IR = JSON.parse(fs.readFileSync(contract_dir_path + "/IR.json"));
        // var IR_ground_truth = JSON.parse()
        [validation_cases, operation_constraints] = validationCase.getValidationCase(IR);

        IR = validationCase.IR_preprocess(IR, sample_args);

        console.log(JSON.stringify(IR));

        // process.exit();

        // fs.writeFileSync("./contracts/test_case/" + category_dirs[i] + "/" + contract_dirs[j] + "/test_conf.json", JSON.stringify(IR, null, 4), "utf-8", function(err) {
        //     console.log("test_conf!");
        //     if (err) throw err;
        //     console.log("test_conf saved!");
        // });


        let contract_config = JSON.parse(JSON.stringify(IR));
        let contract_name = contractNameDict[category_dirs[i]] + "_" + j.toString();
        const cur_contract = artifacts.require(contract_name);

        // for (var k=0; k<validation_case_num; ++k) {
        //     singleContractValidate.single_contract_validate(contract_name, cur_contract, contract_config, validation_cases[k]);
        // }
        singleContractValidate.single_contract_validate(contract_name, cur_contract, contract_config, validation_cases[0]);
    }
}
