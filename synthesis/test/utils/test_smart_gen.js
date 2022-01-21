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

// var example_text = utils.readContract(
//     appRoot + "/test/ground_truth_sample.sol"
//   );

// // var template_ast = parser.parse(template_text, {loc: true, range: true});
// var example_ast = parser.parse(example_text);
// parser.setDepthAndID(example_ast, true, true);
// printObjectToFile(example_ast, "contract_sample.json");

var IR_template = JSON.parse(fs.readFileSync(appRoot + "/test/IR_template.json"));

var sample_contract_text = utils.readContract(appRoot + "/test/contract_sample.sol");
var sample_ast = parser.parse(sample_contract_text);
contractGenerator.ast2IR(sample_ast, IR_template);
printObjectToFile(IR_template, "generated_IR_sample.json");





// parser.setDepthAndID(example_ast, true, true);
// generator.run(example_ast);
// utils.writeContract(
// generator.text,
// appRoot +
//     "/test/hh.sol"
// );


// // get AST of template contract
// var template_text = utils.readContract(
//     appRoot + "/test/StockPurchaseAgreementGroundTruth.sol"
//   );

// // var template_ast = parser.parse(template_text, {loc: true, range: true});
// var template_ast = parser.parse(template_text);
// parser.setDepthAndID(template_ast, true, true);
// printObjectToFile(template_ast, "SPA_ground_truth.json");

// // get AST of skeleton contract
// var skeleton_text = utils.readContract(
//     appRoot + "/test/StockPurchaseAgreementSkeleton.sol"
// );
// // var skeleton_ast = parser.parse(skeleton_text, {loc: true, range: true});
// var skeleton_ast = parser.parse(skeleton_text);
// parser.setDepthAndID(skeleton_ast, true, true);
// printObjectToFile(skeleton_ast, "SPA_skeleton.json");

// // Date parse
// // console.log(Date.parse('May 15, 2014'));
// // throw new Error("Stop script");

// // Get ETH to USD convert
// var xmlhttp = new XMLHttpRequest();
// var url = "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=BTC,USD,EUR";
// var convertData = undefined;

// xmlhttp.onreadystatechange = function() {
//     if (this.readyState == 4 && this.status == 200) {
//         convertData = JSON.parse(this.responseText);
//         doExtract();
//     }
// };

// xmlhttp.open("GET", url, true);
// xmlhttp.send();

var sample_args = {
    EffectiveTime : "0",
    CloseTime : "0",
    OutSideClosingDate : "0",
    SellerAddress : 0,
    BuyerAddresses : [0],
    needPriceConversion: false,
};

function doExtract() {
    var IR = JSON.parse(fs.readFileSync(appRoot + "/test/SPA_IR.json"));
    contractGenerator.extractIR(IR, skeleton_ast, sample_args);
    parser.setDepthAndID(skeleton_ast, true, true);
    generator.run(skeleton_ast);

    // Change Unit of days in require stmt
    // console.log(generator.text);
    // var target_ast = parser.parse(generator.text);
    // day2SecondInRequire(target_ast);
    // parser.setDepthAndID(target_ast, true, true);
    // generator.run(target_ast);
    
    // output contract
    utils.writeContract(
    generator.text,
    appRoot +
        "/test/target_contracts/SPA.sol"
    );
}

function day2SecondInRequire(ast) {
    var functionCalls = transformer.findNodeByType(ast, "FunctionCall");
    var requires = [];
    for (x in functionCalls) {
        if (functionCalls[x].expression.name === "require") requires.push(functionCalls[x]);
    }
    for (x in requires) {
        cur_require = requires[x];
        if (cur_require.arguments[0].type === "BinaryOperation") {
            day2SecondInBinaryOperation(cur_require.arguments[0]);
        }
    }
} 

function day2SecondInBinaryOperation(binaryOperation) {
    if (binaryOperation.left.type == "NumberLiteral") {
        var sec = parseInt(binaryOperation.left.number) * 86400;
        binaryOperation.left.number = sec.toString();
    } else if (binaryOperation.left.type == "BinaryOperation") {
        day2SecondInBinaryOperation(binaryOperation.left);
    }

    if (binaryOperation.right.type == "NumberLiteral") {
        var sec = parseInt(binaryOperation.right.number) * 86400;
        binaryOperation.right.number = sec.toString();
    } else if (binaryOperation.right.type == "BinaryOperation") {
        day2SecondInBinaryOperation(binaryOperation.right);
    }
} 

function printObject(obj) {
    str = JSON.stringify(obj, null, 4); // (Optional) beautiful indented output.
    console.log(str); // Logs output to dev tools console.
    // fs.writeFile(appRoot + "/test/SPA_template.json", str, "utf-8", function(err) {
    //     if (err) throw err;
    //     console.log("Contract saved!");
    // });
}

function printObjectToFile(obj, filename) {
    str = JSON.stringify(obj, null, 4); // (Optional) beautiful indented output.
    // console.log(str); // Logs output to dev tools console.
    fs.writeFile(appRoot + "/test/" + filename, str, "utf-8", function(err) {
        if (err) throw err;
        console.log("Contract saved!");
    });
}