from enum import IntEnum

class SentenceLabel(IntEnum):
    PAYMENT = 0
    ENTITY = 1
    TERMINATION = 2
    TRANSFER = 3
    OTHER = 4


TRANSFER_WORDS = ['deliver', 'transfer', 'issue', 'give', 'receive', 'write']
TRAINED_QA_MODEL_PATH = ""
TRANSFER_SUBJ = ['filling', 'receipt', 'document', 'notice', 'file', 'files', 'delivery', 'consent']
CLASSIFIER = 'roberta'
CLASSIFIER_PATH = ''

IR ={
    "ContractCategory": "StockPurchaseAgreement",
    "SellerName": [],
    "BuyerName": [],
    "EffectiveTime": [],
    "CloseTime": [],
    "OutSideClosingDate": "",
    "Payments": [
        {
            "From": "Buyer",
            "To": "Seller",
            "TimeLimit": {
                "operator": "<=",
                "leftOp": "now",
                "rightOp": "CloseTime"
            },
            "PurchasePrice" : 0,
            "Transfer": True
        }
    ],
    "Transfers": True,
    "Terminations": {
        "TransferTermination" : True,
        "OutOfDateTermination" : True,
        "OtherTermination": False
    }
}

IR2 = '''ContractCategory: {contracttype};

Entity: {{
    SellerNames: {sellername};
    BuyerNames: {buyername};
}};

EffectiveTime: {effectivetime},;
CloseTime: ;
ExpiryTime: July 31, 2021;

OfflineDelivery: {{
    DeliveryConstraint: hash;
}};

OnlineStateTransfer: [{{
    TimeConstraint: {{
        operator: <=,
        leftOprand: now,
        rightOprand: CloseTime
    }};
DeliveryConstraint: true;
(TimeContraint && DeliveryConstraint) -> Payment {{
    From: [BROOKLYN IMMUNOTHERAPEUTICS];
To: [BROOKLYN IMMUNOTHERAPEUTICS];
Price: {{
    Amount: 20000000,
    Unit: USD
}}
}};
}}];

Termination: {{
    TimeConstraint: {{
        operator: >=,
        leftOprand: now,
        rightOprand: ExpiryTime
    }};
DeliveryConstraint: true;
OtherConstraint: true;
(TimeConstraint || DeliveryConstraint || OtherConstraint);
}};'''