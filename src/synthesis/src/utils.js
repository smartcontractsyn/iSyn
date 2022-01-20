const fs = require("fs");
const prettyFormat = require("pretty-format");
const prettyFormatOptions = {
  indent: 4
};

Utils = {
  print: function(obj) {
    console.log(JSON.stringify(obj, null, 2));
  },

  printPretty: function(obj) {
    console.log(prettyFormat(obj, prettyFormatOptions));
  },

  readContract: function(path) {
    //console.log("Read Solidity contract");
    try {
      let contract = fs.readFileSync(path, "utf-8").toString();
      // this.printPretty(contract);
      return contract;
    } catch (e) {
      console.log("Error:", e.stack);
    }
  },

  writeContract: function(contract, path) {
    fs.writeFile(path, contract, "utf-8", function(err) {
      if (err) throw err;
      console.log("Contract saved!");
    });
  },

  readAST: function(path) {
    console.log("Read AST");
    try {
      let ast = JSON.parse(fs.readFileSync(path).toString());
      return ast;
    } catch (e) {
      console.log("Error:", e.stack);
    }
  },

  writeAST: function(ast, path) {
    fs.writeFile(path, JSON.stringify(ast, null, 2), "utf-8", function(err) {
      if (err) throw err;
      console.log("AST saved!");
    });
  },

  readTransactions: function(path) {
    console.log("Read transactions (testsuites)");
    try {
      let transactions = JSON.parse(fs.readFileSync(path).toString());
      return transactions;
    } catch (e) {
      console.log("Error:", e.stack);
    }
  }
};

module.exports = Utils;
