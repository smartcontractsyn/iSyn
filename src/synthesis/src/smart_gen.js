const appRoot = require("app-root-path");
const transformer = require(appRoot + "/src/ast-transformer");
const advancedTransformer = require(appRoot + "/src/advancedtransformer");
const parser = require(appRoot + "/src/solidity-parser-antlr/src/index");
const fs = require("fs");
const utils = require(appRoot + "/src/utils");
const generator = require(appRoot + "/src/solidity-generator");
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const web3 = require("web3");

// var sample_args = {
//     EffectiveTime : "0",
//     CloseTime : "0",
//     OutSideClosingDate : "0",
//     SellerAddress : 0,
//     BuyerAddresses : [0],
//     needPriceConversion: false,
// };

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
    // fs.writeFile(appRoot + "/test/test_template/SPA_template.json", str, "utf-8", function(err) {
    //     if (err) throw err;
    //     console.log("Contract saved!");
    // });
}

function printObjectToFile(obj, filename) {
    str = JSON.stringify(obj, null, 4); // (Optional) beautiful indented output.
    // console.log(str); // Logs output to dev tools console.
    fs.writeFile(appRoot + "/test/test_template/" + filename, str, "utf-8", function(err) {
        if (err) throw err;
        console.log("Contract saved!");
    });
}

// var args = {
//     EffectiveTime : "May 6, 2020",
//     CloseTime : "May 6, 2020",
//     OutSideClosingDate : "May 6, 2020",
//     SellerAddress : 0,
//     BuyerAddresses : [0],
// }

const extractIR = function(IR, ast, args) {

    if (args == undefined) {
        console.error("Must specify args!\n");
        return;
    }

    var constructor_sk;
    var pay_sk;
    var payRelease_sk;
    var uploadFileHash_sk;
    var terminateByTransfer_sk;
    var terminateByOutOfDate_sk;
    var terminateByOthers_sk;
    var purchaseConfirm_sk;
    var terminateConfirm_sk;

    var contractDef = transformer.findNodeByType(ast, "ContractDefinition")[0];
    contractDef.name = args.contractName;
    // var contractSubNodes = contractDef.subNodes;
    
    var functions = transformer.findNodeByType(ast, "FunctionDefinition");
    for (var x in functions) {
        if (functions[x].isConstructor) {
            constructor_sk = functions[x];
        }
        if (functions[x].name == "pay_0") {
            pay_sk = functions[x];
        }
        if (functions[x].name == "payRelease_0") {
            payRelease_sk = functions[x];
        }
        if (functions[x].name == "uploadFileHash") {
            uploadFileHash_sk = functions[x];
        }
        if (functions[x].name == "terminateByTransfer") {
            terminateByTransfer_sk = functions[x];
        }
        if (functions[x].name == "terminateByOutOfDate") {
            terminateByOutOfDate_sk = functions[x];
        }
        if (functions[x].name == "terminateByOthers") {
            terminateByOthers_sk = functions[x];
        }        
        if (functions[x].name == "purchaseConfirm") {
            purchaseConfirm_sk = functions[x];
        }
        if (functions[x].name == "terminateConfirm") {
            terminateConfirm_sk = functions[x];
        }
    }

    // var modifierDefs = transformer.findNodeByType(ast, "ModifierDefinition");
    var stmts = constructor_sk.body.statements;

    // Set EffectiveTime
    if (IR.EffectiveTime.length != 0 && IR.EffectiveTime[0] != "") {
        IR.EffectiveTime[0] = IR.EffectiveTime[0].replace(/,$/, '');
        // console.log(IR.EffectiveTime);
        // console.log(Date.parse(IR.EffectiveTime[0]));
        if (!Number.isNaN(Date.parse(IR.EffectiveTime[0]))) {
            stmts.push(createNumberLiteralAssignment("EffectiveTime", Date.parse(IR.EffectiveTime[0]) / 1000));
        } else {
            stmts.push(createNumberLiteralAssignment("EffectiveTime", args.EffectiveTime));
        }
    } else if (args != undefined && args.EffectiveTime != undefined) {
        // stmts.push(createNumberLiteralAssignment("EffectiveTime", Date.parse(args.EffectiveTime) / 1000));
        stmts.push(createNumberLiteralAssignment("EffectiveTime", args.EffectiveTime));
    }
    
    // Set CloseTime
    if (IR.CloseTime.length != 0 && IR.CloseTime[0] != "") {
        IR.CloseTime[0] = IR.CloseTime[0].replace(/,$/, '');
        if (!Number.isNaN(Date.parse(IR.CloseTime[0]))) {
            stmts.push(createNumberLiteralAssignment("CloseTime", Date.parse(IR.CloseTime[0]) / 1000));
        } else {
            stmts.push(createNumberLiteralAssignment("CloseTime", args.CloseTime));
        }
    } else if (args != undefined && args.CloseTime != undefined) {
        // stmts.push(createNumberLiteralAssignment("CloseTime", Date.parse(args.CloseTime) / 1000));
        stmts.push(createNumberLiteralAssignment("CloseTime", args.CloseTime));
    }

    // Set OutSideClosingDate
    if (IR.OutSideClosingDate.length != 0 && IR.OutSideClosingDate[0] != "") {
        // console.log(Date.parse(IR.OutSideClosingDate) / 1000);
        IR.OutSideClosingDate[0] = IR.OutSideClosingDate[0].replace(/,$/, '');
        if (!Number.isNaN(Date.parse(IR.OutSideClosingDate[0]))) {
            stmts.push(createNumberLiteralAssignment("OutSideClosingDate", Date.parse(IR.OutSideClosingDate[0]) / 1000));
        } else {
            stmts.push(createNumberLiteralAssignment("OutSideClosingDate", args.OutSideClosingDate));
        }
    } else if (args != undefined && args.OutSideClosingDate != undefined) {
        // stmts.push(createNumberLiteralAssignment("OutSideClosingDate", Date.parse(args.OutSideClosingDate) / 1000));
        stmts.push(createNumberLiteralAssignment("OutSideClosingDate", args.OutSideClosingDate));
    }

    // Set Seller Name
    if (IR.SellerName.length != 0 && args != undefined && args.SellerAddress != undefined) {
        stmts.push(createStringLiteralAssignment("sellerName", IR.SellerName[0]));
        stmts.push(createIdentifierAssignment("seller", createNumberToAddress(args.SellerAddress)));
    } else {
        // console.error("No sellerName or SellerAddress!\n");
        stmts.push(createStringLiteralAssignment("sellerName", ""));
        stmts.push(createIdentifierAssignment("seller", createNumberToAddress(0)));
        console.log("sellerName not extracted\n");
        // return;
    }

    var BuyerName2Index = {};
    var buyerNum = 1;

    // Set Buyer Name & Buyer Address
    if (IR.BuyerName.length != 0) {
        if (IR.BuyerName.length != args.BuyerAddresses.length) {
            console.error("Unmatched BuyerName and BuyerAddresses!\n");
            return;
        } else {
            buyerNum = IR.BuyerName.length;
            for (var kk=0; kk< buyerNum; kk++) {
                BuyerName2Index[IR.BuyerName[kk]] = kk;
            }
            stmts.push(createArrayAssignment("buyerName", createArrayTuple("StringLiteral", IR.BuyerName)));
            // stmts.push(createStringLiteralAssignment("buyer", args.BuyerAddresses));
            stmts.push(createIdentifierAssignment("buyer", createNumberToAddressTuple(args.BuyerAddresses)));
        }
    } else {
        // console.error("No buyerName!\n");
        stmts.push(createArrayAssignment("buyerName", createArrayTuple("StringLiteral", [""])));
        // stmts.push(createStringLiteralAssignment("buyer", args.BuyerAddresses));
        stmts.push(createIdentifierAssignment("buyer", createNumberToAddressTuple([0])));
        console.log("buyerName not extracted\n");
        // return;
    }

    // set length of pricePayedByBuyer, purchaseBuyerConfirmed, terminateBuyerConfirmed, state, purchaseSellerConfirmed, terminatedSellerConfirmed
    var pricePayedByBuyer_sk;
    var purchaseBuyerConfirmed_sk;
    var terminateBuyerConfirmed_sk;
    var state_sk;

    var purchaseSellerConfirmed_sk;
    var terminateSellerConfirmed_sk;

    var stateVarDecs = transformer.findNodeByType(ast, "StateVariableDeclaration");
    for (x in stateVarDecs) {
        if (stateVarDecs[x].variables[0].name == "pricePayedByBuyer") {
            pricePayedByBuyer_sk = stateVarDecs[x];
            stateVarDecs[x].variables[0].typeName.length.number = buyerNum.toString();
        } else if (stateVarDecs[x].variables[0].name == "purchaseBuyerConfirmed") {
            purchaseBuyerConfirmed_sk = stateVarDecs[x];
            stateVarDecs[x].variables[0].typeName.length.number = buyerNum.toString();
        } else if (stateVarDecs[x].variables[0].name == "terminateBuyerConfirmed") {
            terminateBuyerConfirmed_sk = stateVarDecs[x];
            stateVarDecs[x].variables[0].typeName.length.number = buyerNum.toString();
        } else if (stateVarDecs[x].variables[0].name == "state") {
            state_sk = stateVarDecs[x];
            stateVarDecs[x].variables[0].typeName.length.number = buyerNum.toString();            
        } else if (stateVarDecs[x].variables[0].name == "purchaseSellerConfirmed") {
            purchaseSellerConfirmed_sk = stateVarDecs[x];
            stateVarDecs[x].variables[0].typeName.length.number = buyerNum.toString();   
        } else if (stateVarDecs[x].variables[0].name == "terminateSellerConfirmed") {
            terminateSellerConfirmed_sk = stateVarDecs[x];
            stateVarDecs[x].variables[0].typeName.length.number = buyerNum.toString();   
        }
    }

    var paymentsHaveTransfer = false;

    // ------> Add pay and payRelease functions
    // Note: Different payment may have different timelimits, so we must write different pay and payRelease function for them.
    for (var x in IR.Payments) {
        var pay_IR = IR.Payments[x];

        if (pay_IR.Transfer) {
            paymentsHaveTransfer = true;
        }

        // ### Step1: Write pay function
        var pay = transformer.cloneNode(pay_sk);

        // Set pay function name
        pay.name = "pay_" + x.toString();

        stmts = pay.body.statements;

        // Check seller and buyer, get buyer index
        if (pay_IR.To != IR.SellerName[0] && pay_IR.To.length !=0 && pay_IR.To[0] != "") {
            console.error("Illegal seller name in No." + x.toString() + " payment\n");
            return;
        }

        var curBuyerIndex = 0;
        if (pay_IR.From.length == 0 || IR.BuyerName.length == 0) {
            curBuyerIndex = 0;
        } else if (pay_IR.From[0] == "") {
            curBuyerIndex = 0;
        } else if (BuyerName2Index.hasOwnProperty(pay_IR.From[0])) {
            // console.log(JSON.stringify(BuyerName2Index));
            curBuyerIndex = BuyerName2Index[pay_IR.From[0]];
        } else {
            console.error("Illegal buyer name in No." + x.toString() + " payment\n");
            return;
        }

        var cur_index = 0; // stmt index

        // Modify state require
        stmts[cur_index].expression.arguments[0].left.left.index.number = curBuyerIndex.toString();
        stmts[cur_index].expression.arguments[0].right.left.index.number = curBuyerIndex.toString();
        cur_index += 1;

        // Modify sender require
        stmts[cur_index].expression.arguments[0].right.index.number = curBuyerIndex.toString();
        cur_index += 1;

        // Add TimeLimit
        if (pay_IR.TimeLimit != undefined) {
            if (pay_IR.TimeLimit.leftOp == "now") pay_IR.TimeLimit.leftOp = "currentTime";
            stmts.splice(cur_index, 0, createOracleObtainVariable("currentTime", "uint", "oracle", "getTime"));
            cur_index += 1;
            stmts.splice(cur_index, 0, createRequire(genBinaryOperationFromIR(pay_IR.TimeLimit), "Time later than Close time"));
            cur_index += 1;
        }

        // Set price
        // Need to be replaced with Web3.js API ! toWei
        // May need a oracle to get the ratio?
        if (pay_IR.PurchasePrice != undefined) {
            stmts.splice(cur_index, 0, createOracleObtainVariable("currentPrice", "uint256", "oracle", "getPrice"));
            cur_index += 1;
            // stmts[cur_index].initialValue.number = Math.floor(Math.pow(10, 18) *  pay_IR.PurchasePrice / convertData.USD);
            if (args.needPriceConversion) {
                stmts[cur_index].initialValue.number = web3.utils.toWei(Math.floor(pay_IR.PurchasePrice / convertData.USD).toString()).toString();
            } else stmts[cur_index].initialValue.number = Math.floor(pay_IR.PurchasePrice);
            // stmts[cur_index].initialValue.number = Math.floor(pay_IR.PurchasePrice / convertData.USD);
            cur_index += 1;
            stmts.splice(cur_index, 0, createDivideAssignment("price", "price", "currentPrice"));
            cur_index += 2;
        } else {
            console.error("Price for payment[" + x.toString() + "] not specified!\n");
            return;
        }

        // Modify event emit. Note that the Payed index represents payment index but not buyer index
        stmts[cur_index].eventCall.arguments[0].number = x.toString();
        cur_index += 1;

        // Update pricePayedByBuyer
        stmts[cur_index].expression.left.index.number = curBuyerIndex.toString();
        cur_index += 1;

        // Update state assignment
        stmts[cur_index].expression.left.index.number = curBuyerIndex.toString();

        // ### Step 2: Write payRelease function
        var payRelease = transformer.cloneNode(payRelease_sk);

        // Set payRelease function name
        payRelease.name = "payRelease_" + x.toString();

        stmts = payRelease.body.statements;

        var cur_index = 0;

        // Modify sender require
        stmts[cur_index].expression.arguments[0].right.index.number = curBuyerIndex.toString();
        cur_index += 1;

        // Add TimeLimit
        if (pay_IR.TimeLimit != undefined) {
            if (pay_IR.TimeLimit.leftOp == "now") pay_IR.TimeLimit.leftOp = "currentTime";
            stmts.splice(cur_index, 0, createOracleObtainVariable("currentTime", "uint", "oracle", "getTime"));
            cur_index += 1;

            stmts.splice(cur_index, 0, createRequire(genBinaryOperationFromIR(pay_IR.TimeLimit), "Time later than Close time"));
            cur_index += 1;
        }

        // Add confirm require if needed
        if (pay_IR.Transfer != undefined && pay_IR.Transfer == true) {
            // Modify purchaseBuyerConfirmed
            stmts[cur_index].expression.arguments[0].index.number = curBuyerIndex.toString();
            stmts[cur_index + 1].expression.arguments[0].index.number = curBuyerIndex.toString();
            cur_index += 2;
        } else {
            // Delete purchaseBuyerConfirmed and purchaseSellerConfirmed
            transformer.deleteNode(payRelease, stmts[cur_index]);
            transformer.deleteNode(payRelease, stmts[cur_index]);
        }

        // Modify event Release emit. Note that the Released index represents payment index but not buyer index
        stmts[cur_index].eventCall.arguments[0].number = x.toString();
        cur_index += 1;

        // Update state assignment
        stmts[cur_index].expression.left.index.number = curBuyerIndex.toString();
        cur_index += 1;

        // Update money transfer
        stmts[cur_index].expression.arguments[0].index.number = curBuyerIndex.toString();
        cur_index += 1;

        // Update clean stmt
        stmts[cur_index].expression.left.index.number = curBuyerIndex.toString();        

        // ### Step 3: Insert
        // Insert pay function
        // printObject(pay_sk);
        transformer.insertPrevNode(ast, pay, pay_sk);
        // Insert payRelease function
        transformer.insertPrevNode(ast, payRelease, payRelease_sk);
    }

    transformer.deleteNode(ast, pay_sk);
    transformer.deleteNode(ast, payRelease_sk);

    if (!paymentsHaveTransfer) {
        transformer.deleteNode(ast, purchaseConfirm_sk);
    }

    // -------> Add uploadFileHash function for transfers
    if (!(IR.Transfers || paymentsHaveTransfer || IR.Terminations.TransferTermination)) {
        transformer.deleteNode(ast, uploadFileHash_sk);
    }

    // -------> Add terminate function

    // Add termination by transfer
    if (!IR.Terminations.TransferTermination) {
        transformer.deleteNode(ast, terminateByTransfer_sk);
        transformer.deleteNode(ast, terminateConfirm_sk);
    }

    // Add termination by Out of Date
    if (!IR.Terminations.OutOfDateTermination) {
        transformer.deleteNode(ast, terminateByOutOfDate_sk);
    }

    // Add termination by Others
    if (!IR.Terminations.OtherTermination) {
        transformer.deleteNode(ast, terminateByOthers_sk);
    }

    // Add termination by other reasons (Oracle)
    // TODO
}

const ast2IR = function(ast, IR) {
    var expStmts = transformer.findNodeByType(ast, "ExpressionStatement");
    for (var x in expStmts) {
        curStmt = expStmts[x];
        if (curStmt.expression.left == undefined) continue;
        if (curStmt.expression.left.name == undefined) continue;
        if (curStmt.expression.left.name == "EffectiveTime") {
            IR.EffectiveTime = [curStmt.expression.right.number];
        }
        if (curStmt.expression.left.name == "CloseTime") {
            IR.CloseTime = [curStmt.expression.right.number];
        }
        if (curStmt.expression.left.name == "OutSideClosingDate") {
            IR.OutSideClosingDate = [curStmt.expression.right.number];
        }
        if (curStmt.expression.left.name == "sellerName") {
            IR.SellerName = [curStmt.expression.right.value];
        }
        if (curStmt.expression.left.name == "buyerName") {
            IR.BuyerName = [curStmt.expression.right.components[0].value];
        }
    }
    var varDeclrStmts = transformer.findNodeByType(ast, "VariableDeclarationStatement");
    for (var x in varDeclrStmts) {
        curStmt = varDeclrStmts[x];
        if (curStmt.variables[0].name == "price") {
            IR.Payments[0].PurchasePrice = curStmt.initialValue.number;
            IR.Payments[0].From = [IR.BuyerName[0]];
            IR.Payments[0].To = [IR.SellerName[0]];
        }
    }

    var payConfirms = transformer.findNodeByName(ast, "purchaseConfirm");
    if (payConfirms.length != 0) IR.Payments[0].Transfer = true;
    else IR.Payments[0].Transfer = false;

    var uploadHashes = transformer.findNodeByName(ast, "uploadFileHash");
    if (uploadHashes.length != 0) IR.Transfers = true;
    else IR.Transfers = false;

    var transferTerms = transformer.findNodeByName(ast, "terminateByTransfer");
    if (transferTerms.length != 0) IR.Terminations.TransferTermination = true;
    else IR.Terminations.TransferTermination = false;

    var expireTerms = transformer.findNodeByName(ast, "terminateByOutOfDate");
    if (expireTerms.length != 0) IR.Terminations.OutOfDateTermination = true;
    else IR.Terminations.OutOfDateTermination = false;

    var otherTerms = transformer.findNodeByName(ast, "terminateByOthers");
    if (otherTerms.length != 0) IR.Terminations.OtherTermination = true;
    else IR.Terminations.OtherTermination = false;
}

function createNumberLiteralAssignment(identifierName, numberLiteral) {
    var obj = 
    {
        "type": "ExpressionStatement",
        "expression": {
            "type": "BinaryOperation",
            "operator": "=",
            "left": {
                "type": "Identifier",
                "name": "purchasePrice",
            },
            "right": {
                "type": "NumberLiteral",
                "number": numberLiteral.toString(),
                "subdenomination": null,
            },
        },
    };
    obj.expression.left.name = identifierName;
    obj.expression.right.name = numberLiteral;
    return obj;
}

function createStringLiteralAssignment(identifierName, stringLiteral) {
    var obj = 
    {
        "type": "ExpressionStatement",
        "expression": {
            "type": "BinaryOperation",
            "operator": "=",
            "left": {
                "type": "Identifier",
                "name": identifierName,
            },
            "right": {
                "type": "StringLiteral",
                "value": stringLiteral
            },
        },
    };
    return obj;
}

function createRequire(binaryOp, warn_str=null) {
    if (warn_str != null) {
        var obj = 
        {
            "type": "ExpressionStatement",
            "expression": {
                "type": "FunctionCall",
                "expression": {
                    "type": "Identifier",
                    "name": "require",
                },
                "arguments": [
                    binaryOp,
                    {
                        "type": "StringLiteral",
                        "value": warn_str
                    }                    
                ],
                "names": []
            }
        }

    } else {
        var obj = 
        {
            "type": "ExpressionStatement",
            "expression": {
                "type": "FunctionCall",
                "expression": {
                    "type": "Identifier",
                    "name": "require",
                },
                "arguments": [
                    binaryOp
                ],
                "names": []
            }
        }
    }
    return obj;
}

function createArrayAssignment(variableName, arrayTuple) {
    return {
        "type": "ExpressionStatement",
        "expression": {
            "type": "BinaryOperation",
            "operator": "=",
            "left": {
                "type": "Identifier",
                "name": variableName,
            },
            "right": {
                "type": "TupleExpression",
                "components": arrayTuple,
                "isArray": true,
            },
        },
    };
}

function createArrayTuple(typeName, arrayValue) {
    var ret = [];
    for (var x in arrayValue) {
        ret.push({"type":typeName, "value": arrayValue[x]});
    }
    return ret;
}

function createUintVariableDeclaration(variableName, initValStr) {
    return {
        "type": "VariableDeclarationStatement",
        "variables": [
            {
                "type": "VariableDeclaration",
                "typeName": {
                    "type": "ElementaryTypeName",
                    "name": "uint",
                },
                "name": variableName,
                "storageLocation": null,
                "isStateVar": false,
                "isIndexed": false,
            }
        ],
        "initialValue": {
            "type": "NumberLiteral",
            "number": initValStr,
            "subdenomination": null,
        }
    };    
}

function createIdentifierAssignment(identifierName, value) {
    return                             {
        "type": "ExpressionStatement",
        "expression": {
            "type": "BinaryOperation",
            "operator": "=",
            "left": {
                "type": "Identifier",
                "name": identifierName,
            },
            "right": value,
        },
    }
}

function createNumberToAddress(number) {
    return {
        "type": "FunctionCall",
        "expression": {
            "type": "ElementaryTypeNameExpression",
            "typeName": {
                "type": "ElementaryTypeName",
                "name": "address",
            },
        },
        "arguments": [
            {
                "type": "NumberLiteral",
                "number": number,
                "subdenomination": null,
            }
        ],
        "names": [],
    }
}

function createNumberToAddressTuple(numberTuple) {
    var cur_tuple = [];
    for (x in numberTuple) {
        cur_tuple.push(createNumberToAddress(numberTuple[x]));
    }
    return {
        "type": "TupleExpression",
        "components": cur_tuple,
        "isArray": true,
    };
}

function genBinaryOperationFromIR(binaryIR) {
    if (binaryIR.operator == undefined) {
        if (isNumeric(binaryIR)) return createNumberLiteral(binaryIR);
        else return advancedTransformer.createIdentifier(binaryIR);
    }

    // Need parenthesis?
    return advancedTransformer.createBinaryOperation(genBinaryOperationFromIR(binaryIR.leftOp), 
                                            binaryIR.operator, 
     
                                            genBinaryOperationFromIR(binaryIR.rightOp));
}

function createOracleObtainVariable(variableName, varaibleTypeName, oracleName, getMethodName) {
    return {
        "type": "VariableDeclarationStatement",
        "variables": [
            {
                "type": "VariableDeclaration",
                "typeName": {
                    "type": "ElementaryTypeName",
                    "name": varaibleTypeName,
                },
                "name": variableName,
                "storageLocation": null,
                "isStateVar": false,
                "isIndexed": false,
            }
        ],
        "initialValue": {
            "type": "FunctionCall",
            "expression": {
                "type": "MemberAccess",
                "expression": {
                    "type": "Identifier",
                    "name": oracleName,
                },
                "memberName": getMethodName,
            },
            "arguments": [],
            "names": [],
        },
    };
}

function createDivideAssignment(targetName, dividendName, divisorName) {
    return {
        "type": "ExpressionStatement",
        "expression": {
            "type": "BinaryOperation",
            "operator": "=",
            "left": {
                "type": "Identifier",
                "name": targetName,
            },
            "right": {
                "type": "BinaryOperation",
                "operator": "/",
                "left": {
                    "type": "Identifier",
                    "name": dividendName,
                },
                "right": {
                    "type": "Identifier",
                    "name": divisorName,
                },
            },
        },
    };
}

function createStringArrayStateVariable(variableName) {
    return {
        "type": "StateVariableDeclaration",
        "variables": [
            {
                "type": "VariableDeclaration",
                "typeName": {
                    "type": "ArrayTypeName",
                    "baseTypeName": {
                        "type": "ElementaryTypeName",
                        "name": "string",
                    },
                    "length": null,
                },
                "name": variableName,
                "expression": null,
                "visibility": "default",
                "isStateVar": true,
                "isDeclaredConst": false,
                "isIndexed": false,
            }
        ],
        "initialValue": null,
    };
}

function createMsgSenderRequire(identifierName) {
    return {
        "type": "ExpressionStatement",
        "expression": {
            "type": "FunctionCall",
            "expression": {
                "type": "Identifier",
                "name": "require",
            },
            "arguments": [
                {
                    "type": "BinaryOperation",
                    "operator": "==",
                    "left": {
                        "type": "MemberAccess",
                        "expression": {
                            "type": "Identifier",
                            "name": "msg",
                        },
                        "memberName": "sender",
                    },
                    "right": {
                        "type": "Identifier",
                        "name": identifierName,
                    }
                }
            ],
            "names": []
        }
    };
}

function createNumberLiteral(numberStr) {
    return {
        "type": "NumberLiteral",
        "number": numberStr,
        "subdenomination": null,
    };
}

function isNumeric(value) {
    return /^-?\d+$/.test(value);
}

module.exports = {extractIR, ast2IR};