const fs = require("fs");
const exec = require('child_process').exec;
const singleContractEval = require("./legalContract_backup.js");

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


for (var i=0; i<dirNamePatterns.length; i++) {
    for (var j=0; j<testcase_Dirs[i].length; ++j) {
        // var IR = JSON.parse(s.readFileSync(appRoot + "/test/test_template/test_case/" + dirNamePatterns[i] + "/" + contractNamePatterns[i] + testcase_Dirs[j] + ".sol"));
        var IR = JSON.parse(fs.readFileSync("./test/test_case/" + dirNamePatterns[i] + testcase_Dirs[i][j] + "/IR.json"));
        
        // Set EffectiveTime
        if (IR.EffectiveTime.length != 0 && IR.EffectiveTime[0] != "") {
            IR.EffectiveTime[0] = IR.EffectiveTime[0].replace(/,$/, '');
            // console.log(IR.EffectiveTime);
            if (!Number.isNaN(Date.parse(IR.EffectiveTime[0]))) {
                IR.EffectiveTime[0] = [Date.parse(IR.EffectiveTime[0]) / 1000];
            } else {
                IR.EffectiveTime[0] = [sample_args.EffectiveTime];
            }
        } else if (sample_args != undefined && sample_args.EffectiveTime != undefined) {
            // stmts.push(createNumberLiteralAssignment("EffectiveTime", Date.parse(args.EffectiveTime) / 1000));
            IR.EffectiveTime[0] = [sample_args.EffectiveTime];
        }
        
        // Set CloseTime
        if (IR.CloseTime.length != 0 && IR.CloseTime[0] != "") {
            IR.CloseTime[0] = IR.CloseTime[0].replace(/,$/, '');
            if (!Number.isNaN(Date.parse(IR.CloseTime[0]))) {
                IR.CloseTime[0] = [Date.parse(IR.CloseTime[0]) / 1000];
            } else {
                IR.CloseTime[0] = [sample_args.CloseTime];
            }
        } else if (sample_args != undefined && sample_args.CloseTime != undefined) {
            // stmts.push(createNumberLiteralAssignment("CloseTime", Date.parse(args.CloseTime) / 1000));
            IR.CloseTime[0] = [sample_args.CloseTime];
        }

        // Set OutSideClosingDate
        if (IR.OutSideClosingDate.length != 0 && IR.OutSideClosingDate[0] != "") {
            // console.log(Date.parse(IR.OutSideClosingDate) / 1000);
            IR.OutSideClosingDate[0] = IR.OutSideClosingDate[0].replace(/,$/, '');
            if (!Number.isNaN(Date.parse(IR.OutSideClosingDate[0]))) {
                IR.OutSideClosingDate[0] = [Date.parse(IR.OutSideClosingDate[0]) / 1000];
            } else {
                IR.OutSideClosingDate[0] = [sample_args.OutSideClosingDate];
            }
        } else if (sample_args != undefined && sample_args.OutSideClosingDate != undefined) {
            // stmts.push(createNumberLiteralAssignment("OutSideClosingDate", Date.parse(args.OutSideClosingDate) / 1000));
            IR.OutSideClosingDate[0] = [sample_args.OutSideClosingDate];
        }
        
        for (var k=0; k<IR.Payments.length; ++k) {
            IR.Payments[k].From = [0];
            IR.Payments[k].To = [0];
            IR.Payments[k].PurchasePrice = Math.floor(parseFloat(IR.Payments[k].PurchasePrice));
        }

        // console.log(JSON.stringify(IR));

        fs.writeFileSync("./test/test_case/" + dirNamePatterns[i] + testcase_Dirs[i][j] + "/test_conf.json", JSON.stringify(IR, null, 4), "utf-8", function(err) {
            console.log("test_conf!");
            if (err) throw err;
            console.log("test_conf saved!");
        });

        let contract_config = IR;
        let contract_name = IR.ContractCategory + "_" + testcase_Dirs[i][j] + "_" + "sythesized";
        const cur_contract = artifacts.require(contract_name);
        singleContractEval.single_contract_eval(contract_name, cur_contract, contract_config);
    }
}
