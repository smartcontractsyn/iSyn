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
    "Synthesized Line"
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

        var IR = JSON.parse(fs.readFileSync(contract_dir_path + "/IR.json"));

        IR = IR_preprocess(IR)

        let cur_line_num = 0;
        cur_line_num = getLineNum(IR);
        console.log(cur_line_num);

        // output_str += contract_dirs[j] + " " + String(test_cases.length) + " " + String(ground_truth_test_cases.length) + "\n"
        output_str += "|" + contract_dirs[j] + "|" + String(cur_line_num)+ "|" 
                        + "\n";
    }
}

fs.writeFileSync("./evaluation-plot/data/synthesized_line.txt", output_str, "utf-8", function(err) {
    // console.log("test_case_num saved!");
    if (err) throw err;
    // console.log("test_conf saved!");
});


function getLineNum(IR) {
    // Extract condition entry
    let line_num = 0;

    // EffectiveTime = 1000;
    // CloseTime = 1000;
    // OutSideClosingDate = 1370016000;
    // sellerName = "RANGE OPERATING NEW MEXICO";
    // seller = address(0);
    // buyerName =[""];
    // buyer =[address(0)];
    // func_num += 1;
    line_num += 8;

    // uint currentTime = oracle.getTime();
    // require(currentTime <= CloseTime, "Time later than Close time");

    // uint256 currentPrice = oracle.getPrice();
    // uint256 price = 275000000;
    // price = price / currentPrice;
    if (IR.Payments.length > 0) {
        line_num += 5;

        if (!IR.Payments[0].Transfer) {
            line_num += 16 + 2;
        }

        // uint currentTime = oracle.getTime();
        // require(currentTime <= CloseTime, "Time later than Close time");
        line_num += 2;       
    }

    if (!IR.Transfers) {
        line_num += 18;
    }

    if (!IR.Terminations.TransferTermination) {
        line_num += 41;
    }

    if (!IR.Terminations.OutOfDateTermination) {
        line_num += 12;
    }

    if (!IR.Terminations.OtherTermination) {
        line_num += 14;
    }

    return line_num;
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