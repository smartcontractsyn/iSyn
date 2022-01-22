const fs = require("fs");
const exec = require('child_process').exec;
// const singleContractValidate = require("./singleValidate.js");
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
        var IR_ground_truth = JSON.parse(fs.readFileSync(contract_dir_path + "IR_ground_truth.json"));
        var IR = JSON.parse(fs.readFileSync(contract_dir_path + "/IR.json"));
        // var IR_ground_truth = JSON.parse()

        [gt_validation_cases, gt_operation_constraints] = validationCase.getValidationCase(IR_ground_truth);
        [validation_cases, operation_constraints] = validationCase.getValidationCase(IR);
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
    }
}

fs.writeFileSync("./validation_case_num.txt", output_str, "utf-8", function(err) {
    // console.log("validation_case_num saved!");
    if (err) throw err;
    // console.log("test_conf saved!");
});

