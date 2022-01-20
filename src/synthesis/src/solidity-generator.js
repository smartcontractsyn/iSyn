const parser = require("./solidity-parser-antlr/src/index");

Generator = {
  source: [], // array of tokens in order
  text: "", // solidity source
  //finalText: "",

  /*gen: (ast, oldtext) => {
    Generator.finalText = "";

    let modified = false;
    let modifiedRange = [-1, -1];
    let modifiedText = "";

    parser.visit(ast, {
      PrevAll: node => {
        if(node.modified == 1 && modified == false){
          modified = true;
          modifiedId = node.id;
          console.log(node);
          if(node.range != undefined){
            modifiedRange[0] = node.range[0];
            modifiedRange[1] = node.range[1];
          }
          else{
            modifiedRange = [-1, -1];
          }
          modifiedText = Generator.run(node);
        }
      },
      PostAll: node => {
        if(modified == false && node.modified == 0 && node.depth == 1){
          Generator.finalText += oldtext.substring(node.range[0], node.range[1] + 1);
          Generator.finalText += "\n";
        }
        else if(modified == true && node.id == modifiedId){
          modified = false;
        }
        else if(modified == false && node.modified == 2){
          if(node.range[0] - modifiedRange[0] < 0 && modifiedRange[0] != -1){
            Generator.finalText += oldtext.substring(node.range[0], modifiedRange[0]);
            Generator.finalText += modifiedText;
            console.log(modifiedText);
          }
          else{
            Generator.finalText += modifiedText;
            console.log(modifiedText);
          }
          if(node.range[1] - modifiedRange[1] > 0 && modifiedRange[1] != -1){
            Generator.finalText += oldtext.substring(modifiedRange[1] + 1, node.range[1] + 1);
          }
          modifiedRange = [node.range[0], node.range[1]];
        }
      }
    })
    return Generator.finalText;
  },*/

  // return source, given ast (json)
  run: function(ast) {
    // clear history
    Generator.source = [];
    Generator.text = "";

    // produce a list of identifiers for source
    let brackets = [];
    let prevSignals = [];
    let postSignals = [];
 
    let version = 0.5;
    let currentContractName = null;
    let forLoopExpId = null;
    let skip = [];

    let parseParameter = node => {
      if (node.typeName.type == "ArrayTypeName") {
        Generator.source.push(node.typeName.baseTypeName.name);
        Generator.source.push("[");
        Generator.source.push("]");
      } else if (node.typeName.type == "ElementaryTypeName") {
        Generator.source.push(node.typeName.name);
      }
      if (node.name != null) Generator.source.push(node.name);
    };

    parser.visit(ast, {
      ImportDirective: node => {
        Generator.source.push("import");
        Generator.source.push('"' + node.path + '"');
        Generator.source.push(";");
      },
      PragmaDirective: node => {
        Generator.source.push("pragma");
        Generator.source.push(node.name);
        Generator.source.push(node.value);
        if(node.value[3] == "4"){
          version = 0.4;
        }
        else if(node.value[3] == "5"){
          version = 0.5;
        }
        Generator.source.push(";");
      },

      ContractDefinition: node => {
        if(node.kind == "contract"){
          Generator.source.push("contract");
        }
        else if(node.kind == "library"){
          Generator.source.push("library");
        }
        else if(node.kind == "interface"){
          Generator.source.push("interface");
        }
        Generator.source.push(node.name);
        currentContractName = node.name;
        if (node.baseContracts.length > 0) {
          Generator.source.push("is");
          for (var i in node.baseContracts) {
            if (i > 0)
              prevSignals.push({ id: node.baseContracts[i].id, type: "," });
          }
        }
        brackets.push({ depth: node.depth, type: "}" });
        if (node.subNodes.length > 0)
          prevSignals.push({ id: node.subNodes[0].id, type: "{" });
        else brackets.push({ depth: node.depth, type: "{" });
      },

      InheritanceSpecifier: node => {
        if (node.arguments.length > 0) {
          prevSignals.push({ id: node.arguments[0].id, type: "(" });
          for (var i in node.arguments) {
            if (i > 0)
              prevSignals.push({ id: node.arguments[i].id, type: "," });
          }
          brackets.push({ depth: node.depth, type: ")" });
        }
      },

      StateVariableDeclaration: node => {
        for (var i in node.variables) {
          // there is a duplication of initialValue
          node.variables[i].expression = null;
        }
        brackets.push({ depth: node.depth, type: ";" });
        if (node.initialValue)
          prevSignals.push({ id: node.initialValue.id, type: "=" });
      },

      VariableDeclarationStatement: node => {
        if(node.variables.length > 1){
          for(let x = 0; x < node.variables.length; x++){
            if(node.variables[x] != null &&
              (node.variables[x].typeName == null || node.variables[x].typeName == undefined)){
                Generator.source.push("var");
                break;
              }
          }
          Generator.source.push("( ");
          for(var i in node.variables){
            if(i > 0 && node.variables[i] != null){
              prevSignals.push({ id: node.variables[i].id, type: ","})
            }
            if(node.variables[i] == null && i > 0){
              let pushed = false;
              for(let x = i; x < node.variables.length; x++){
                if(node.variables[x] != null){
                  prevSignals.push({ id: node.variables[x].id, type: ","});
                  pushed = true;
                  break;
                }
              }
              if(pushed == false)
                prevSignals.push({ id: node.initialValue.id, type: ","});
            }
          } 
        }
        brackets.push({ depth: node.depth, type: ";" });
        if (node.initialValue && node.variables.length > 1)
          prevSignals.push({ id: node.initialValue.id, type: ") =" });
        else if(node.initialValue)
          prevSignals.push({ id: node.initialValue.id, type: "=" });
      },

      VariableDeclaration: node => {
        if(node.name != null)
          brackets.push({ depth: node.depth, type: node.name });
        if (node.visibility && node.visibility != "default")
          brackets.push({ depth: node.depth, type: node.visibility });
        if(node.isDeclaredConst == true)
          brackets.push({ depth: node.depth, type: "constant"});
        if (node.storageLocation)
          brackets.push({ depth: node.depth, type: node.storageLocation });
      },

      UsingForDeclaration: node => {
        Generator.source.push("using");
        Generator.source.push(node.libraryName);
        Generator.source.push("for");
        brackets.push({ depth: node.depth, type: ";" });
      },

      ElementaryTypeName: node => {
        Generator.source.push(node.name);
      
        if (node.stateMutability != undefined)
          brackets.push({ depth: node.depth, type: node.stateMutability });
      },

      UserDefinedTypeName: node => {
        Generator.source.push(node.namePath);
      },

      ArrayTypeName: node => {
        brackets.push({ depth: node.depth, type: "]" });
        if (node.length) prevSignals.push({ id: node.length.id, type: "[" });
        else brackets.push({ depth: node.depth, type: "[" });
      },

      FunctionTypeName: node => {
        Generator.source.push("function (");
        if(node.parameterTypes.length == 0)
          Generator.source.push(")");
        else{
          postSignals.push({ id: node.parameterTypes[node.parameterTypes.length - 1].typeName.id, type: ")" });
        }
        let modifier_list = [];
        if (node.visibility != null && node.visibility != "default") {
          modifier_list.push(node.visibility);
        }
        if (node.stateMutability != null) {
          modifier_list.push(node.stateMutability);
        }
        if(node.returnTypes.length == 0){
          for (var i in modifier_list)
            brackets.push({ depth: node.depth, type: modifier_list[i] });
        }
        if (node.returnTypes.length != 0){
          for (var i in modifier_list)
            prevSignals.push({ id: node.returnTypes[0].id, type: modifier_list[i] });
          prevSignals.push({ id: node.returnTypes[0].id, type: "returns (" });
          postSignals.push({ id: node.returnTypes[node.returnTypes.length - 1].typeName.id, type: " )" });
        }
        
      },

      Mapping: node => {
        Generator.source.push("mapping");
        Generator.source.push("(");
        prevSignals.push({ id: node.valueType.id, type: "=>" });
        brackets.push({ depth: node.depth, type: ")" });
      },

      FunctionDefinition: node => {
        if (node.isConstructor && version > 0.4) {
          Generator.source.push("constructor");
        } else {
          Generator.source.push("function");
          if(node.isConstructor == true){
            Generator.source.push(currentContractName);
          }
          else{
            Generator.source.push(node.name);
          }
        }

        let modifier_list = [];
        if (node.visibility != null && node.visibility != "default") {
          modifier_list.push(node.visibility);
        }
        if (node.stateMutability != null) {
          modifier_list.push(node.stateMutability);
        }

        let tmpId = null;
        if (node.body != null) {
          tmpId = node.body.id;
        } else {
          brackets.push({ depth: node.depth, type: ";" });
        }
        if (node.returnParameters != null) {
          tmpId = node.returnParameters.id;
        }

        
        if(node.modifiers.length != 0 && tmpId != null && node.modifiers[0].id > tmpId){
          moveModifierDefAhead = true;
          for(let i in node.modifiers){
            prevSignals.push({ id: tmpId, type: node.modifiers[i].name });
            skip.push(node.modifiers[i].id);
            if (node.modifiers[i].arguments.length > 0) {
              prevSignals.push({ id: tmpId, type: "(" });
              for (var j in node.modifiers[i].arguments) {
                if(node.modifiers[i].arguments[j].type == "Identifier"){
                  skip.push(node.modifiers[i].arguments[j].id);
                  prevSignals.push({ id: tmpId, type:  node.modifiers[i].arguments[j].name});
                }
                if (j < node.modifiers[i].arguments.length - 1)
                  prevSignals.push({ id: tmpId, type: "," });
              }
              prevSignals.push({ id: tmpId, type: ")" });
            }
          }
        }

        if (tmpId == null) {
          for (var i in modifier_list)
            brackets.push({ depth: node.depth, type: modifier_list[i] });
        } else {
          // add modifiers prior to the body
          for (var i in modifier_list)
            prevSignals.push({ id: tmpId, type: modifier_list[i] });
        }

        if (node.returnParameters != null)
          prevSignals.push({ id: tmpId, type: "returns" });
      },

      ModifierDefinition: node => {
        Generator.source.push("modifier");
        Generator.source.push(node.name);
      },

      EventDefinition: node => {
        Generator.source.push("event");
        Generator.source.push(node.name);
        brackets.push({ depth: node.depth, type: ";" });
      },

      StructDefinition: node => {
        Generator.source.push("struct");
        Generator.source.push(node.name);
        Generator.source.push("{");
        for (var i = 1; i < node.members.length; i++) {
          prevSignals.push({ id: node.members[i].id, type: ";" });
        }
        brackets.push({ depth: node.depth, type: "}" });
        brackets.push({ depth: node.depth, type: ";" });
      },

      EnumDefinition: node => {
        Generator.source.push("enum");
        Generator.source.push(node.name);
        Generator.source.push("{");
        brackets.push({ depth: node.depth, type: "}" });
        for (var i in node.members) {
          if (i > 0) prevSignals.push({ id: node.members[i].id, type: "," });
        }
      },

      EnumValue: node => {
        Generator.source.push(node.name);
      },

      IfStatement: node => {
        Generator.source.push("if");
        Generator.source.push("(");
        prevSignals.push({ id: node.trueBody.id, type: ")" });
        if (node.falseBody != null) {
          prevSignals.push({ id: node.falseBody.id, type: "else" });
        }
      },

      WhileStatement: node => {
        Generator.source.push("while");
        Generator.source.push("(");
        prevSignals.push({ id: node.body.id, type: ")" });
      },

      ForStatement: node => {
        Generator.source.push("for");
        Generator.source.push("(");
        prevSignals.push({ id: node.body.id, type: ")" });
        if(node.initExpression == null){
          prevSignals.push({ id: node.conditionExpression.id, type: ";" });
        }
        prevSignals.push({ id: node.loopExpression.id, type: ";" });
        forLoopExpId = node.loopExpression.id;
      },

      BreakStatement: node => {
        Generator.source.push("break");
        brackets.push({ depth: node.depth, type: ";" });
      },

      IndexAccess: node => {
        brackets.push({ depth: node.depth, type: "]" });
        prevSignals.push({ id: node.index.id, type: "[" });
      },

      ModifierInvocation: node => {
        if(skip.indexOf(node.id) == -1){
          Generator.source.push(node.name);
          if (node.arguments.length > 0) {
            prevSignals.push({ id: node.arguments[0].id, type: "(" });
            for (var i in node.arguments) {
              if (i > 0)
                prevSignals.push({ id: node.arguments[i].id, type: "," });
            }
            brackets.push({ depth: node.depth, type: ")" });
          }
        }
        else{
          skip.splice(skip.indexOf(node.id), 1);
        }
      },

      ParameterList: node => {
        Generator.source.push("(");
        brackets.push({ depth: node.depth, type: ")" });
        for (var i = 1; i < node.parameters.length; i++) {
          prevSignals.push({ id: node.parameters[i].id, type: "," });
        }
      },

      Parameter: node => {
        if (node.name != null){
          brackets.push({ depth: node.depth, type: node.name });
          if(node.storageLocation != null)
            brackets.push({ depth: node.depth, type: node.storageLocation });
        }
      },

      ExpressionStatement: node => {
        if(node.id != forLoopExpId)
          brackets.push({ depth: node.depth, type: ";" });
      },

      BinaryOperation: node => {
        prevSignals.push({ id: node.right.id, type: node.operator });
      },

      UnaryOperation: node => {
        if (["+", "-", "!", "~", "after", "delete"].includes(node.operator)) {
          Generator.source.push(node.operator);
        } else if (["--", "++"].includes(node.operator)) {
          brackets.push({ depth: node.depth, type: node.operator });
        }
      },

      NumberLiteral: node => {
        Generator.source.push(node.number);
        if(node.subdenomination != undefined){
          Generator.source.push(node.subdenomination);
        }
      },

      BooleanLiteral: node => {
        Generator.source.push(node.value);
      },

      HexLiteral: node => {
        Generator.source.push(node.value);
      },

      StringLiteral: node => {
        Generator.source.push('"' + node.value + '"');
      },

      DecimalNumber: node => {
        Generator.source.push(node.value);
      },

      Identifier: node => {
        if(skip.indexOf(node.id) == -1)
          Generator.source.push(node.name);
        else{
          skip.splice(skip.indexOf(node.id), 1);
        }
      },

      MemberAccess: node => {
        brackets.push({ depth: node.depth, type: "." + node.memberName });
        // prevSignals.push({id: node.expression.id+1, type: "." + node.memberName});
      },

      FunctionCall: node => {
        if (node.arguments.length > 0) {
          if(node.names !=undefined && node.names.length > 0){
            brackets.push({ depth: node.depth, type: "})" });
            prevSignals.push({ id: node.arguments[0].id, type: "({" });
          }
          else{
            brackets.push({ depth: node.depth, type: ")" });
            prevSignals.push({ id: node.arguments[0].id, type: "(" });
          }
          
        } else {
          brackets.push({ depth: node.depth, type: "()" });
        }

        for (var i = 0; i < node.arguments.length; i++) {
          if(i == 0 && node.names != undefined && node.names[i] != undefined){
            prevSignals.push({ id: node.arguments[i].id, type: node.names[i]});
            prevSignals.push({ id: node.arguments[i].id, type: ":"});
          }
          else if(i != 0){
            prevSignals.push({ id: node.arguments[i].id, type: "," });
            if(node.names != undefined && node.names[i] != undefined){
              prevSignals.push({ id: node.arguments[i].id, type: node.names[i]});
              prevSignals.push({ id: node.arguments[i].id, type: ":"});
            }  
          } 
        }
      },

      Block: node => {
        Generator.source.push("{");
        brackets.push({ depth: node.depth, type: "}" });
      },

      Conditional: node => {
        prevSignals.push({ id: node.trueExpression.id, type: "?" });
        prevSignals.push({ id: node.falseExpression.id, type: ":" });
      },

      EmitStatement: node => {
        Generator.source.push("emit");
        brackets.push({ depth: node.depth, type: ";" });
      },

      ReturnStatement: node => {
        Generator.source.push("return");
        brackets.push({ depth: node.depth, type: ";" });
      },

      ThrowStatement: node => {
        Generator.source.push("throw");
        Generator.source.push(";");
      },

      TupleExpression: node => {
        if(node.isArray){
          Generator.source.push("[");
          brackets.push({ depth: node.depth, type: "]" });
        }
        else{
          Generator.source.push("(");
          brackets.push({ depth: node.depth, type: ")" });
        }
        for (var i in node.components) {
          if (i > 0 && node.components[i] != null) prevSignals.push({ id: node.components[i].id, type: "," });
          if (node.components[i] == null && i > 0){
            let pushed = false;
            for(let x = i; x < node.components.length; x++){
              if(node.components[x] != null){
                prevSignals.push({ id: node.components[x].id, type: ","});
                pushed = true;
                break;
              }
            }
            if(pushed == false){
              brackets.push({ depth: node.depth, type: ","});
          }
          }
        }
      },

      NewExpression: node => {
        Generator.source.push("new");
      },

      InlineAssemblyStatement: node => {
        Generator.source.push("assembly");
      },

      AssemblyBlock: node => {
        Generator.source.push("{");
        brackets.push({ depth: node.depth, type: "}" });
      },

      AssemblyAssignment: node => {
        prevSignals.push({ id: node.expression.id, type: ":=" });
        brackets.push({ depth: node.depth, type: "\n" });
      },

      AssemblyCall: node => {
        Generator.source.push(node.functionName);
        if (node.arguments.length > 0) {
          Generator.source.push("(");
          for (var i in node.arguments) {
            if (i > 0)
              prevSignals.push({ id: node.arguments[i].id, type: "," });
          }
          brackets.push({ depth: node.depth, type: ")\n" });
        }
      },

      HexNumber: node => {
        Generator.source.push(node.value);
      },

      AssemblyLocalDefinition: node => {
        Generator.source.push("let");
        prevSignals.push({ id: node.expression.id, type: ":=" });
        brackets.push({ depth: node.depth, type: "\n" });
      },

      AssemblyIf: node => {
        Generator.source.push("if");
      },

      DoWhileStatement: node => {
        console.log("There is a do-while statement in the source code: line", node.loc.start.line, ".We can not gen it now.");
      },

      PrevAll: node => {
        while (
          brackets.length > 0 &&
          node.depth <= brackets[brackets.length - 1].depth
        ) {
          let tmpBracket = brackets.pop();
          Generator.source.push(tmpBracket.type);
        }
        let delList = [];
        for (var i in prevSignals) {
          if (prevSignals[i].id == node.id) {
            Generator.source.push(prevSignals[i].type);
            delList.push(i);
          }
        }
        for (var i in delList) {
          prevSignals.splice(delList[delList.length - 1 - i], 1);
        }
      },

      PostAll: node => {
        let delList = [];
        for (var i in postSignals) {
          if (postSignals[i].id == node.id) {
            Generator.source.push(postSignals[i].type);
            delList.push(i);
          }
        }
        for (var i in delList) {
          postSignals.splice(delList[delList.length - 1 - i], 1);
        }
      }
    });
    // push in remained brackets or something
    let tmp = {};
    while ((tmp = prevSignals.pop())) {
      Generator.source.push(tmp.type);
    }
    while ((tmp = postSignals.pop())) {
      Generator.source.push(tmp.type);
    }
    while (brackets.length > 0) {
      let tmpBracket = brackets.pop();
      Generator.source.push(tmpBracket.type);
    }
    Generator.format();
    return Generator.text;
  },

  format: () => {
    // Format the source

    if (!Generator.source || Generator.source.length == 0) return "";
    Generator.text = "";
    tabCnt = 0;
    for (var i in Generator.source) {
      if (Generator.source[i] == "{") {
        tabCnt += 1;
      } else if (Generator.source[i] == "}") {
        tabCnt -= 1;
      }
      // console.log(Generator.source[i])
      if (Generator.text[Generator.text.length - 1] == "\n") {
        // Add tabs before the token
        for (var j = 0; j < tabCnt; j++) {
          Generator.text += "    ";
        }
      } else if (
        Generator.text != "" &&
        Generator.source[i] != null &&
        Generator.source[i] != "," &&
        Generator.source[i] != ";" &&
        Generator.source[i][0] != "." &&
        Generator.source[i][0] != "(" &&
        Generator.source[i][0] != "[" &&
        (i > 0 && Generator.source[i - 1] != "(") &&
        (i > 0 && Generator.source[i - 1] != "[") &&
        Generator.source[i] != ")" &&
        Generator.source[i] != "]"
      ) {
        // Add a space before the token
        Generator.text += " ";
      }

      Generator.text += Generator.source[i];

      if (
        Generator.source[i] == "{" ||
        Generator.source[i] == "}" ||
        Generator.source[i] == ";"
      ) {
        // Add newline after the token
        Generator.text += "\n";
      }
    }
  }
};

module.exports = Generator;
