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

var sample_args = {
    EffectiveTime : "1000",
    CloseTime : "1000",
    OutSideClosingDate : "1000",
    SellerAddress : 0,
    BuyerAddresses : [0],
    needPriceConversion: false,
    contractName: ""
};

let column_tags = ['Contract',
    "functionality correctness",
    "edit num",
];

var output_str = "";
output_str = "|" + column_tags.join("|") + "|" + "\n";
output_str = output_str + "|";
for (var i=0; i<column_tags.length; ++i)
    output_str = output_str + "----|";
output_str += "\n";

var total_correct_num = 0;
var total_num = 0;

var category_dirs = fs.readdirSync('./test_case/');
for (var i=0; i<category_dirs.length; i++) {
    // console.log(category_dirs[i]);
    if (category_dirs[i] == "selected") continue;
    category_dir_path = './test_case/' + category_dirs[i] + '/';
    var contract_dirs = fs.readdirSync(category_dir_path);
    contract_dirs.sort()
    for (var j=0; j<contract_dirs.length; j++) {
        // console.log(contract_dirs[j]);
        contract_dir_path = category_dir_path + contract_dirs[j] + '/';
        if (!fs.existsSync(contract_dir_path + "IR.json")) {
            // console.log(contract_dir_path + "IR.json");
            continue;
        }
        // continue;
        console.log(contract_dirs[j]);
        // continue;
        let IR = JSON.parse(fs.readFileSync(contract_dir_path + "IR.json"));
        IR = preprocess_IR(IR);
        let gt_IR = JSON.parse(fs.readFileSync(contract_dir_path + "IR_ground_truth_proofread.json"));
        gt_IR = preprocess_IR(gt_IR);
        let func_correct = true;
        let edit_num = 0;

        if (contract_dirs[j] == "SPA0") {
            console.log(gt_IR);
            console.log(IR);
        }

        if (!array_cmp(IR.BuyerName, gt_IR.BuyerName)) {
            edit_num += 1;
        }
        if (!array_cmp(IR.SellerName, gt_IR.SellerName)) {
            edit_num += 1;
        }
        if (!array_cmp(IR.CloseTime, gt_IR.CloseTime)) {
            func_correct = false;
            edit_num += 1;
        }
        if (!array_cmp(IR.EffectiveTime, gt_IR.EffectiveTime)) {
            func_correct = false;
            edit_num += 1;
        }
        if (!array_cmp(IR.OutSideClosingDate, gt_IR.OutSideClosingDate)) {
            func_correct = false;
            edit_num += 1;
        }
        if (!array_cmp(IR.Payments[0].From, gt_IR.Payments[0].From)) {
            // edit_num += 1;
        }
        if (!array_cmp(IR.Payments[0].To, gt_IR.Payments[0].To)) {
            // edit_num += 1;
        }
        if (IR.Payments[0].PurchasePrice != gt_IR.Payments[0].PurchasePrice) {
            func_correct = false;
            edit_num += 1;
        }
        if (IR.Payments[0].Transfer != gt_IR.Payments[0].Transfer) {
            func_correct = false;
            edit_num += 2;
        }        
        if (IR.Transfers != gt_IR.Transfers) {
            func_correct = false;
            edit_num += 1;
        }
        if (IR.Terminations.OtherTermination != gt_IR.Terminations.OtherTermination) {
            func_correct = false;
            edit_num += 1;
        } 
        if (IR.Terminations.OutOfDateTermination != gt_IR.Terminations.OutOfDateTermination) {
            func_correct = false;
            edit_num += 1;
        }
        if (IR.Terminations.TransferTermination != gt_IR.Terminations.TransferTermination) {
            func_correct = false;
            edit_num += 2;
        }

        output_str += "|" + contract_dirs[j] + "|" + String(func_correct) + "|" + String(edit_num) + "|\n";

        total_num += 1;
        if (func_correct) total_correct_num += 1;
    }
}

fs.writeFileSync("./evaluation-plot/data/edit_num_proofread.txt", output_str, "utf-8", function(err) {
    // console.log("test_case_num saved!");
    if (err) throw err;
    // console.log("test_conf saved!");
});

console.log(output_str);
console.log(total_correct_num / total_num);

function array_cmp(arr1, arr2) {
    if (arr1.length == arr2.length
        && arr1.every(function(u, i) {
            return u == arr2[i];
        })
    ) return true;
    
    return false;
}

function preprocess_IR(IR) {
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
        IR.CloseTime[0] = IR.CloseTime[0].replace(/,$/, '');
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
        IR.OutSideClosingDate[0] = IR.OutSideClosingDate[0].replace(/,$/, '');
        if (!Number.isNaN(Date.parse(IR.OutSideClosingDate[0]))) {
            IR.OutSideClosingDate = [Date.parse(IR.OutSideClosingDate[0]) / 1000];
        } else {
            IR.OutSideClosingDate = [sample_args.OutSideClosingDate];
        }
    } else if (sample_args != undefined && sample_args.OutSideClosingDate != undefined) {
        // stmts.push(createNumberLiteralAssignment("OutSideClosingDate", Date.parse(args.OutSideClosingDate) / 1000));
        IR.OutSideClosingDate = [sample_args.OutSideClosingDate];
    }
    
    // for (var k=0; k<IR.Payments.length; ++k) {
    //     IR.Payments[k].From = [0];
    //     IR.Payments[k].To = [0];
    //     IR.Payments[k].PurchasePrice = Math.floor(parseFloat(IR.Payments[k].PurchasePrice));
    // }

    return IR;
}

