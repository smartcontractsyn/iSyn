const appRoot = require("app-root-path");
const transformer = require(appRoot + "/src/ast-transformer");

let advancedTransformer = {

    createWithdrawFunc: (ownerName, funcName) =>{
        try{
            //create a withdraw function
            var withdraw = transformer.createNode("FunctionDefinition");
            transformer.setProperty(withdraw, ["name", "visibility", "modifiers", "isConstructor", "stateMutability", 
	            "returnParameters"], [funcName, "public", [], false, null, null]);

            //create parameter nodes for withdraw
            var withdrawParameterList = transformer.createNode("ParameterList");
            var withdrawParameter = transformer.createNode("Parameter");
            var uint = transformer.createNode("ElementaryTypeName");
            transformer.setProperty(uint, ["name"], ["uint"]);
            transformer.setProperty(withdrawParameter, ["typeName", "name", "storageLocation", "isStateVar", "isIndexed"], [uint, "val", null, false, false]);
            withdrawParameters = [];
            withdrawParameters.push(withdrawParameter);
            transformer.setProperty(withdrawParameterList, ["parameters"], [withdrawParameters]);
            transformer.setProperty(withdraw, ["parameters"], [withdrawParameterList]);

            //create a require function
            var requirefunc = transformer.createNode("FunctionCall");
            var requireParameter = transformer.createNode("BinaryOperation");

            //create owner judgement node
            var ownerJudge = transformer.createNode("BinaryOperation");
            var msgsender = transformer.createNode("MemberAccess");
            var msg = transformer.createNode("Identifier");
            transformer.setProperty(msg, ["name"], ["msg"]);
            transformer.setProperty(msgsender, ["expression", "memberName"], [msg, "sender"]);
            var owner = transformer.createNode("Identifier");
            transformer.setProperty(owner, ["name"], [ownerName]);
            transformer.setProperty(ownerJudge, ["left", "operator", "right"], [msgsender, "==", owner]);
            transformer.setProperty(requireParameter, ["left", "operator"], [ownerJudge, "&&"]);

            //create val judgement node
            var valJudge = transformer.createNode("BinaryOperation");
            var val = transformer.createNode("Identifier");
            transformer.setProperty(val, ["name"], ["val"]);
            var balance = transformer.createNode("MemberAccess");
            transformer.setProperty(balance, ["memberName"], ["balance"]);
            var address = transformer.createNode("FunctionCall");
            var addressExpression = transformer.createNode("ElementaryTypeNameExpression");
            var addressTypeName = transformer.createNode("ElementaryTypeName");
            transformer.setProperty(addressTypeName, ["name"], ["address"]);
            transformer.setProperty(addressExpression, ["typeName"], [addressTypeName]);
            var addressArgument = transformer.createNode("Identifier");
            transformer.setProperty(addressArgument, ["name"], ["this"]);
            transformer.setProperty(address, ["names", "expression", "arguments"], [[], addressExpression, [addressArgument]]);
            transformer.setProperty(balance, ["expression"], [address]);
            transformer.setProperty(valJudge, ["left", "operator", "right"], [val, "<=", balance]);
            var requireExpression = transformer.createNode("Identifier");
            transformer.setProperty(requireExpression, ["name"], ["require"]);
            transformer.setProperty(requireParameter, ["right"], [valJudge]);
            transformer.setProperty(requirefunc, ["names", "expression", "arguments"], [[], requireExpression, [requireParameter]]);

            //create transfer function
            var transfer = transformer.createNode("FunctionCall");
            var msg2 = transformer.cloneNode(msg);
            var msgsender2 = transformer.cloneNode(msgsender);
            var val2 = transformer.cloneNode(val);
            var msgSenderTransfer = transformer.createNode("MemberAccess");
            transformer.setProperty(msgSenderTransfer, ["expression", "memberName"], [msgsender2, "transfer"]);
            transformer.setProperty(transfer, ["names", "expression", "arguments"], [[], msgSenderTransfer, [val2]]);

            //create the withdraw function body node
            var withdrawBody = transformer.createNode("Block");
            var requirefuncStatement = transformer.createNode("ExpressionStatement");
            transformer.setProperty(requirefuncStatement, ["statement"], [requirefunc]);
            var transferStatement = transformer.createNode("ExpressionStatement");
            transformer.setProperty(transferStatement, ["statement"], [transfer]);
            transformer.setProperty(withdrawBody, ["statements"], [[requirefuncStatement, transferStatement]]);
            //transformer.setProperty(withdrawBody, ["statements"], [[transferStatement]]);
            transformer.setProperty(withdraw, ["body"], [withdrawBody]);

            return withdraw;
        }catch(err){
            console.log('Unable to create a withdraw function node\n', err);
        }
    },

    addCheck: (node) => {
        try{
            var requireExpression = transformer.createNode("ExpressionStatement");
            var requrireFunc = transformer.createNode("FunctionCall");
            var requireIdentifier = transformer.createNode("Identifier");
            transformer.setProperty(requireIdentifier, ["name"], ["require"]);
            transformer.setProperty(requrireFunc, ["names", "expression", "arguments"], [[], requireIdentifier, [node]]);
            transformer.setProperty(requireExpression, ["expression"], [requrireFunc]);

            return requireExpression;
        }catch(err){
            console.log('Unable to add a require node\n', err);
        }
    },

    createTempVar: (variablename, stateVarNode) => {
        try{
            var tempname = variablename + '_temp';
            var temp = transformer.createNode("VariableDeclarationStatement");
            var tempdef = transformer.createNode("VariableDeclaration");
            var tempTypeName = transformer.createNode("ElementaryTypeName");
            //var statevar = advancedTransformer.createIdentifier(variablename);
            transformer.setProperty(tempTypeName, ["name"], ["var"]);
            transformer.setProperty(tempdef, ["typeName", "name", "expression", "visibility", "isStateVar", "isDeclaredConst", "isIndexed"],
                [tempTypeName, tempname, null, "default", false, false, false]);
            transformer.setProperty(temp, ["variables", "initialValue"], [tempdef, stateVarNode]);
            return temp;
        }catch(err){
            console.log('Unable to create a local variable\n',err);
        }
    },

    copyValue: (copyname, copiedname) => {
        try{
            var copynode = advancedTransformer.createIdentifier(copyname);
            var copiednode = advancedTransformer.createIdentifier(copiedname);
            var assignment = advancedTransformer.createBinaryOperation(copynode, "=", copiednode);
            return assignment;
        }catch(err){
            console.log('Unable to create a variable assignment node\n',err);
        }
    },

    createMsgSender: () => {
        try{
            var msgsender = transformer.createNode("MemberAccess");
            var msg = transformer.createNode("Identifier");
            transformer.setProperty(msg, ["name"], ["msg"]);
            transformer.setProperty(msgsender, ["memberName", "expression"], ["sender", msg]);
            return msgsender;
        }catch(err){
            console.log('Unable to create a msgsender node\n', err);
        }
    },

    getOwner: (ast, node) => {
        try{
            if(node == undefined || node.type != "ContractDefinition"){
                throw -1;
            }
            var res = [];
            //just find owner
            res = transformer.findNodeByName(node, "owner");
            for(let x in res){
                if(res[x].type == "VariableDeclaration" && res[x].name == "owner" && res[x].isStateVar == true){
                    return "owner";
                }
            }
            //find binary operations such as "msg.sender == owner"
            res = transformer.findNodeByType(node, "BinaryOperation");
            for(let x in res){
                if(transformer.findIncludedGlobalDef(ast, res[x]) == null || transformer.findIncludedGlobalDef(ast, res[x]).type == "ModifierDefinition"){
                    continue;
                }
                if(res[x].left.type == "MemberAccess" && res[x].left.expression.name == "msg" 
                && res[x].left.memberName == "sender" && (res[x].operator == "==" || res[x].operator == "!=" || res[x].operator == "=") 
                && res[x].right.type == "Identifier"){
                    let vardefs = transformer.findNodeByName(node, res[x].right.name);
                    for(let i in vardefs){
                        if(vardefs[i].type == "VariableDeclaration" && res[x].isStateVar == true)
                            return res[x].right.name;
                    }
                }
                else if(res[x].right.type == "MemberAccess" && res[x].right.expression.name == "msg" 
                && res[x].right.memberName == "sender" && (res[x].operator == "==" || res[x].operator == "!=" || res[x].operator == "=") 
                && res[x].left.type == "Identifier"){
                    let vardefs = transformer.findNodeByName(node, res[x].left.name);
                    for(let i in vardefs){
                        if(vardefs[i].type == "VariableDeclaration" && res[x].isStateVar == true)
                            return res[x].left.name;
                    }
                }
            }
            //check the parent contracts
            for(let x in node.baseContracts){
                if(node.baseContracts[x].type != "InheritanceSpecifier" || node.baseContracts[x].baseName.type != "UserDefinedTypeName"){
                    continue;
                }
                let contractname = node.baseContracts[x].baseName.namePath;
                let contracts = transformer.findNodeByType(ast, "ContractDefinition");
                for(let x in contracts){
                    if(contracts[x].name == contractname){
                        res = advancedTransformer.getOwner(ast, contracts[x]);
                        if(res != null){
                            return res;
                        }
                    }
                }
            }

            return null;
        }catch(err){
            if(err == -1){
                console.log('Please input a contract definition node.');
            }
            console.log('Unable to get the owner of this contract.\n', err);
        }
    },

    checkOwner: (name) =>{
        try{
            var msgsender = advancedTransformer.createMsgSender();
            var ownerJudge = transformer.createNode("BinaryOperation");
            var owner = transformer.createNode("Identifier");
            transformer.setProperty(owner, ["name"], [name]);
            transformer.setProperty(ownerJudge, ["left", "operator", "right"], [msgsender, "==", owner]);
            var requirenode = advancedTransformer.addCheck(ownerJudge);
            return requirenode;
        }catch(err){
            console.log('Unable to create a owner check node\n', err);
        }
    },

    createIdentifier: (name) => {
        try{
            var id = transformer.createNode("Identifier");
            transformer.setProperty(id, ["name"], [name]);
            return id;
        }catch(err){
            console.log('Unable to create an identifier node\n', err);
        }
    },

    createBinaryOperation: (left, op, right) => {
        try{
            var binop = transformer.createNode("BinaryOperation");
            transformer.setProperty(binop, ["left", "operator", "right"], [left, op, right]);
            return binop;
        }catch(err){
            console.log('Unable to create a binary operation node\n', err);
        }
    },

    createVariableIndex: (base, index) => {
        try{
            var vindex = transformer.createNode("IndexAccess");
            transformer.setProperty(vindex, ["base", "index"], [base, index]);
            return vindex;
        }catch(err){
            console.log('Unable to create a variable index node\n', err);
        }
    },

    createOwner: () => {
        try{
            var statedef = transformer.createNode("StateVariableDeclaration");
            var ownerdef = transformer.createNode("VariableDeclaration");
            var addressTypeName = transformer.createNode("ElementaryTypeName");
            transformer.setProperty(addressTypeName, ["name"], ["address"]);
            transformer.setProperty(ownerdef, ["typeName", "name", "expression", "visibility", "isStateVar", "isDeclaredConst", "isIndexed"],
	            [addressTypeName, "owner", null, "public", true, false, false]);
            transformer.setProperty(statedef, ["variables", "initialValue"], [[ownerdef], null]);
            return statedef;
        }catch(err){
            console.log('Unable to create a owner definition node\n', err);
        }
    },

    //createGlobalVariable lock_for_reentrancy
    createGlobalVariable: () => {
        try{
            var statedef = transformer.createNode("StateVariableDeclaration");
            var lockdef = transformer.createNode("VariableDeclaration");
            var lockTypeName = transformer.createNode("ElementaryTypeName");
            transformer.setProperty(lockTypeName, ["name"], ["bool"]);
            transformer.setProperty(lockdef, ["typeName", "name", "expression", "visibility", "isStateVar", "isDeclaredConst", "isIndexed"],
                [lockTypeName, "lock_for_reentrancy", null, "private", true, false, false]);
            transformer.setProperty(statedef, ["variables", "initialValue"], [[lockdef], null]);
            return statedef;
        }  catch (err) {
            console.log('Unable to create a global variable\n', err)
        }
    },


    getParameters: (node) => {
        try{
            var res = {};
            if(node.type != "FunctionDefinition"){
                throw -1;
            }
            var parameterList = node.parameters;
            if(parameterList.type != "ParameterList"){
                throw -1;
            }
            for(x in parameterList.parameters){
                if(parameterList.parameters[x].type == "Parameter" && parameterList.parameters[x].typeName.type == "ElementaryTypeName"){
                    res[parameterList.parameters[x].name] = parameterList.parameters[x].typeName.name;
                }
            }
            return res;
        }catch(err){
            if(err == -1){
                console.log('Node Type Error.');
            }
            console.log('Unable to get the parameters.\n', err);
        }
    },

    checkAddress: (name) => {
        try{
            var id = advancedTransformer.createIdentifier(name);
            var address = transformer.createNode("FunctionCall");
            var addresstypeexp = transformer.createNode("ElementaryTypeNameExpression");
            var addresstype = transformer.createNode("ElementaryTypeName");
            transformer.setProperty(addresstype, ["name"], ["address"]);
            transformer.setProperty(addresstypeexp, ["typeName"], [addresstype]);
            var zero = transformer.createNode("NumberLiteral");
            transformer.setProperty(zero, ["number", "subdenomination"], ["0x0", null]);
            transformer.setProperty(address, ["expression", "arguments"], [addresstypeexp, [zero]]);
            var binop = advancedTransformer.createBinaryOperation(id, "!=", address);
            var check = advancedTransformer.addCheck(binop);
            return check;
        }catch(err){
            console.log('Unable to validate this address\n', err);
        }
    },
    //check global variable
    checkLock:() => {
        try {
            //create a require function
            var requirefunc = transformer.createNode("FunctionCall");
            var requireParameter = transformer.createNode("BinaryOperation");
            var id = advancedTransformer.createIdentifier("lock_for_reentrancy");
            var boolFalse = transformer.createNode("BooleanLiteral");
            transformer.setProperty(boolFalse, ["value"], ["false"]);
            transformer.setProperty(requireParameter, ["left", "operator", "right"], [id, "==", boolFalse]);
            var requirefuncStatement = transformer.createNode("ExpressionStatement");
            var requireExpression = transformer.createNode("Identifier");
            transformer.setProperty(requireExpression, ["name"], ["require"]);
            transformer.setProperty(requirefunc, ["names", "expression", "arguments"], [[], requireExpression, [requireParameter]]);
            transformer.setProperty(requirefuncStatement, ["statement"], [requirefunc]);
            return requirefuncStatement
        }catch (err) {
            console.log('Unable to validate lock_for_reentrancy\n', err);
        }
    },

    assignLockToTrueOrFalse:(locakValue) => {
        var equal = transformer.createNode("BinaryOperation");
        var id = advancedTransformer.createIdentifier("lock_for_reentrancy");
        var boolValue = transformer.createNode("BooleanLiteral");
        transformer.setProperty(boolValue, ["value"], [locakValue]);
        transformer.setProperty(equal, ["left", "operator", "right"], [id, "=", boolValue]);
        var assignment = advancedTransformer.toExpressionStat(equal);
        return assignment
    },

    toExpressionStat: (node) => {
        try{
            var stat = transformer.createNode("ExpressionStatement");
            transformer.setProperty(stat, ["expression"], [node]);
            return stat;
        }catch(err){
            console.log('Unable to create a expression statement node.\n', err);
        }
    },

    createConstructor: (ownerName) => {
        try{
            var constructor = transformer.createNode("FunctionDefinition");
            transformer.setProperty(constructor, ["name", "visibility", "modifiers", "isConstructor", "stateMutability", 
                "returnParameters", "parameters"], [null, "public", [], true, null, null, []]);
            var parameterlist = transformer.createNode("ParameterList");
            transformer.setProperty(parameterlist, ["parameters"], [[]]);
            var block = transformer.createNode("Block");
            var ownerAssignmentStat = advancedTransformer.initOwner(ownerName);
            transformer.setProperty(block, ["statements"], [[ownerAssignmentStat]]);
            transformer.setProperty(constructor, ["body", "parameters"], [block, parameterlist]);
            return constructor;
        }catch(err){
            console.log('Unable to create a constructor node.\n', err);
        }
    },

    getConstructor: (node) => {
        try{
            if(node == undefined || node.type != "ContractDefinition"){
                throw -1;
            }
            let funcs = transformer.findNodeByType(node, "FunctionDefinition");
            for(let func in funcs){
                if(funcs[func].isConstructor == true){
                    return funcs[func];
                }
            }
            return null;
        }catch(err){
            console.log('Unable to get the constructor of this contract.\n', err);
        }
    },

    initOwner: (ownerName) => {
        try{
            var msgsender = advancedTransformer.createMsgSender();
            var ownerAssignment = transformer.createNode("BinaryOperation");
            var owner = transformer.createNode("Identifier");
            transformer.setProperty(owner, ["name"], [ownerName]);
            transformer.setProperty(ownerAssignment, ["left", "operator", "right"], [owner, "=", msgsender]);
            var ownerAssignmentStat = advancedTransformer.toExpressionStat(ownerAssignment);
            return ownerAssignmentStat;
        }catch(err){
            console.log('Unable to initialize owner.\n', err);
        }
    },

    createMemberAccess: (memberName, expressionName) => {
        try{
            var memberaccess = transformer.createNode("MemberAccess");
            var expression = advancedTransformer.createIdentifier(expressionName);
            transformer.setProperty(memberaccess, ["expression", "memberName"], [expression, memberName]);
            return memberaccess;
        }catch(err){
            console.log('Unable to create a member access node.\n', err);
        }
    }

}

module.exports = advancedTransformer;