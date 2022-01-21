const fs = require("fs");
const exec = require('child_process').exec;
// const singleContractValidate = require("./singleValidate.js");

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


var category_dirs = fs.readdirSync('./test_case/');
var output_str = "";
output_str = "|" + column_tags.join("|") + "|" + "\n";
output_str = output_str + "|";
for (var i=0; i<column_tags.length; ++i)
    output_str = output_str + "----|";
output_str += "\n";

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

        contract_dir_path = category_dir_path + contract_dirs[j] + '/';
        contract_files = fs.readdirSync(contract_dir_path);
        // console.log(contract_files);
        if (!contract_files.includes("IR.json")) continue;

        console.log(contract_dirs[j]);
        var IR_ground_truth = JSON.parse(fs.readFileSync(contract_dir_path + "IR_ground_truth_proofread.json"));
        var IR = JSON.parse(fs.readFileSync(contract_dir_path + "/IR.json"));
        // var IR_ground_truth = JSON.parse()

        [gt_validation_cases, gt_operation_constraints] = getValidationCase(IR_ground_truth);
        [validation_cases, operation_constraints] = getValidationCase(IR);
        console.log([validation_cases.length, gt_validation_cases.length]);

        operation_constraints_bit_vec = "";
        gt_operation_constraints_bit_vec = "";
        for (var k=0; k<all_constraints.length; ++k) {
            if (operation_constraints.includes(all_constraints[k])) operation_constraints_bit_vec += "1";
            else operation_constraints_bit_vec += "0";
            if (gt_operation_constraints.includes(all_constraints[k])) gt_operation_constraints_bit_vec += "1";
            else gt_operation_constraints_bit_vec += "0";
        }

        // output_str += contract_dirs[j] + " " + String(validation_cases.length) + " " + String(ground_truth_validation_cases.length) + "\n"
        output_str += "|" + contract_dirs[j] + "|" + String(validation_cases.length) + "|" + String(gt_validation_cases.length) + "|" 
                        + String(operation_constraints.length) + "|" + String(gt_operation_constraints.length) + "|"
                        + operation_constraints_bit_vec + "|" + gt_operation_constraints_bit_vec + "|"
                        + "\n";

        // Set EffectiveTime
        if (IR.EffectiveTime.length != 0 && IR.EffectiveTime[0] != "") {
            IR.EffectiveTime[0] = IR.EffectiveTime[0].replace(/,$/, '');
            // console.log(IR.EffectiveTime);
            if (!Number.isNaN(Date.parse(IR.EffectiveTime[0]))) {
                IR.EffectiveTime = [Date.parse(IR.EffectiveTime[0]) / 1000];
            } else {
                IR.EffectiveTime = [sample_args.EffectiveTime];
            }
        } else if (sample_args != undefined && sample_args.EffectiveTime != undefined) {
            // stmts.push(createNumberLiteralAssignment("EffectiveTime", Date.parse(args.EffectiveTime) / 1000));
            IR.EffectiveTime = [sample_args.EffectiveTime];
        }
        
        // Set CloseTime
        if (IR.CloseTime.length != 0 && IR.CloseTime[0] != "") {
            IR.CloseTime = IR.CloseTime[0].replace(/,$/, '');
            if (!Number.isNaN(Date.parse(IR.CloseTime[0]))) {
                IR.CloseTime = [Date.parse(IR.CloseTime[0]) / 1000];
            } else {
                IR.CloseTime = [sample_args.CloseTime];
            }
        } else if (sample_args != undefined && sample_args.CloseTime != undefined) {
            // stmts.push(createNumberLiteralAssignment("CloseTime", Date.parse(args.CloseTime) / 1000));
            IR.CloseTime = [sample_args.CloseTime];
        }

        // Set OutSideClosingDate
        if (IR.OutSideClosingDate.length != 0 && IR.OutSideClosingDate[0] != "") {
            // console.log(Date.parse(IR.OutSideClosingDate) / 1000);
            IR.OutSideClosingDate = IR.OutSideClosingDate[0].replace(/,$/, '');
            if (!Number.isNaN(Date.parse(IR.OutSideClosingDate[0]))) {
                IR.OutSideClosingDate = [Date.parse(IR.OutSideClosingDate[0]) / 1000];
            } else {
                IR.OutSideClosingDate = [sample_args.OutSideClosingDate];
            }
        } else if (sample_args != undefined && sample_args.OutSideClosingDate != undefined) {
            // stmts.push(createNumberLiteralAssignment("OutSideClosingDate", Date.parse(args.OutSideClosingDate) / 1000));
            IR.OutSideClosingDate = [sample_args.OutSideClosingDate];
        }
        
        for (var k=0; k<IR.Payments.length; ++k) {
            IR.Payments[k].From = [0];
            IR.Payments[k].To = [0];
            IR.Payments[k].PurchasePrice = Math.floor(parseFloat(IR.Payments[k].PurchasePrice));
        }

        // console.log(JSON.stringify(IR));

        // process.exit();
        
        // process.exit();

        // fs.writeFileSync("./test/test_case/" + dirNamePatterns[i] + testcase_Dirs[i][j] + "/test_conf.json", JSON.stringify(IR, null, 4), "utf-8", function(err) {
        //     console.log("test_conf!");
        //     if (err) throw err;
        //     console.log("test_conf saved!");
        // });


        // let contract_config = JSON.parse(JSON.stringify(IR));
        // let contract_name = IR.ContractCategory + "_" + testcase_Dirs[i][j] + "_" + "sythesized";
        // const cur_contract = artifacts.require(contract_name);

        // for (var k=0; k<validation_case_num; ++k) {
        //     singleContractTest.single_contract_test(contract_name, cur_contract, contract_config, validation_cases[k]);
        // }
        // singleContractEval.single_contract_eval(contract_name, cur_contract, contract_config);
    }
}

fs.writeFileSync("./validation_case_num.txt", output_str, "utf-8", function(err) {
    // console.log("validation_case_num saved!");
    if (err) throw err;
    // console.log("test_conf saved!");
});


function getValidationCase(IR) {
    // Extract condition entry
    condition_entries = {}
    if (IR.EffectiveTime.length != 0 && IR.EffectiveTime[0] != "") condition_entries["EffectiveTimeCon"] = true;
    // if (IR.CloseTime.length != 0 && IR.CloseTime[0] != "") condition_entries["CloseTimeCon"] = true;
    if (IR.Payments.length > 0) condition_entries["PaymentRoleCon"] = true;
    if (IR.Payments[0].TimeLimit != undefined) {
        condition_entries["PaymentTimeCon"] = true;
        condition_entries["PaymentPriceCon"] = true;
        if (IR.Payments[0].Transfer != undefined && IR.Payments[0].Transfer) condition_entries["PaymentTransferCon"] = true;
    }
    if (IR.Transfers) condition_entries["ValidFileSignUploaderCon"] = true;
    if (IR.Terminations.OtherTermination) condition_entries["OtherTerminationCon"] = true;
    if (IR.Terminations.OutOfDateTermination) condition_entries["OutOfDateTerminationCon"] = true;
    if (IR.Terminations.TransferTermination) condition_entries["TransferTerminationCon"] = true;

    // console.log(condition_entries);

    cur_validation_case = JSON.parse(JSON.stringify(condition_entries));
    condition_entries = Object.keys(condition_entries);
    console.log(condition_entries);
    condition_entry_num = condition_entries.length;
    validation_case_num = Math.pow(2, condition_entry_num);
    // console.log(validation_case_num);
    validation_cases = [];
    for (var k=0; k<validation_case_num; ++k) {
        var conf_array = k;
        // console.log(conf_array);
        for (var kk=0; kk<condition_entry_num; ++kk) {
            // console.log(conf_array, conf_array[kk], kk);
            cur_validation_case[condition_entries[kk]] = false;
            if ((conf_array >> kk) & 1) cur_validation_case[condition_entries[kk]] = true;
            else cur_validation_case[condition_entries[kk]] = false;
        }
        // console.log(cur_validation_case);
        validation_cases.push(cur_validation_case);
    }
    return [validation_cases, condition_entries];

}
