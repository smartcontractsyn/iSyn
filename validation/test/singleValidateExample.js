const PurchaseAgreement = artifacts.require("PurchaseAgreement");
const OracleTest = artifacts.require("OracleTest");
const singleContractValidate = require("../src/validate.js");

let contract_config_ = {
  "ContractCategory": "PurchaseAgreement",
  "BuyerName": ["BROOKLYN IMMUNOTHERAPEUTICS"],
  "SellerName": ["BROOKLYN IMMUNOTHERAPEUTICS"],
  "CloseTime": [1000000000],
  "EffectiveTime": [1619366400],
  "OutSideClosingDate": [1627660800],
  "Payments": [
      {
          "From": [0],
          "PurchasePrice": 20000000,
          "TimeLimit": {
              "leftOprand": "now",
              "operator": "<=",
              "rightOprand": "CloseTime"
          },
          "To": [0],
          "Transfer": true
      }
  ],
  "Terminations": {
      "OtherTermination": true,
      "OutOfDateTermination": true,
      "TransferTermination": true,
  },
  "Transfers": true
}

let state_enum = {
  Created: 0,
  Locked: 1,
  Released: 2,
  Transfered: 3,
  Inactive: 4,
};

let validation_case_ = {
    EffectiveTimeCon: true,
    PaymentRoleCon: true,
    PaymentTimeCon: true,
    PaymentPriceCon: true,
    ValidFileSignUploaderCon: true,
    TransferTerminationCon: true,
    PaymentTransferCon: true,
    OtherTerminationCon: true,
    OutOfDateTerminationCon: true,
};

singleContractValidate.single_contract_validate("PurchaseAgreement", PurchaseAgreement, contract_config_, validation_case_);