const fs = require("fs");
const exec = require('child_process').exec;
// const singleContractTest = require("./singleTest.js");

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
    "func num",
    "correct func num",
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

        IR_ground_truth = IR_preprocess(IR_ground_truth)
        IR = IR_preprocess(IR)
        // var IR_ground_truth = JSON.parse()

        let cur_func_num = 0;
        let cur_correct_num = 0;
        [cur_func_num, cur_correct_num] = getFuncNum(IR, IR_ground_truth);
        console.log([cur_func_num, cur_correct_num]);

        // output_str += contract_dirs[j] + " " + String(test_cases.length) + " " + String(ground_truth_test_cases.length) + "\n"
        output_str += "|" + contract_dirs[j] + "|" + String(cur_func_num) + "|" + String(cur_correct_num) + "|" 
                        + "\n";
    }
}

fs.writeFileSync("./evaluation-plot/data/func_num_proofread.txt", output_str, "utf-8", function(err) {
    // console.log("test_case_num saved!");
    if (err) throw err;
    // console.log("test_conf saved!");
});


function getFuncNum(IR, gt_IR) {
    // Extract condition entry
    let func_num = 0;
    let correct_num = 0;

    // constructor
    func_num += 1
    if (array_cmp(IR.EffectiveTime, gt_IR.EffectiveTime)
        && array_cmp(IR.CloseTime, gt_IR.CloseTime)
        && array_cmp(IR.OutSideClosingDate, gt_IR.OutSideClosingDate)
        // && array_cmp(IR.SellerName, gt_IR.SellerName)
        // && array_cmp(IR.BuyerName, gt_IR.BuyerName)
    ) {
        correct_num += 1;
    }

    if (IR.Payments.length > 0) {
        // pay
        func_num += 1;
        if (IR.Payments[0].PurchasePrice == gt_IR.Payments[0].PurchasePrice) correct_num += 1;

        // purchaseConfirm
        if (gt_IR.Payments[0].Transfer) {
            func_num += 1;
            if (IR.Payments[0].Transfer) correct_num += 1;
        }

        // payRelease
        func_num += 1;
        if (gt_IR.Payments[0].Transfer == IR.Payments[0].Transfer) {
            correct_num += 1;
        }
    }

    // uploadFileHash()
    if (gt_IR.Transfers) {
        func_num += 1;
        if (IR.Transfers) correct_num += 1;
    }


    // terminateConfirm & terminateByTransfer
    if (gt_IR.Terminations.TransferTermination) {
        func_num += 2;
        if (IR.Terminations.TransferTermination) correct_num += 2;
    }

    // terminateByOutOfDate
    if (gt_IR.Terminations.OutOfDateTermination) {
        func_num += 1;
        if (IR.Terminations.OutOfDateTermination && array_cmp(IR.OutSideClosingDate, gt_IR.OutSideClosingDate)) correct_num += 1;
    }   

    // terminateByOthers
    if (gt_IR.Terminations.OtherTermination) {
        func_num += 1;
        if (IR.Terminations.OtherTermination) correct_num += 1;
    }    

    // close()
    func_num += 1;
    correct_num += 1;

    return [func_num, correct_num];
}

function IR_preprocess(IR) {
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
    return IR;
}
 

function array_cmp(arr1, arr2) {
    if (arr1.length == arr2.length
        && arr1.every(function(u, i) {
            return u == arr2[i];
        })
    ) return true;
    
    return false;
}