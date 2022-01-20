from enum import IntEnum

class SentenceLabel(IntEnum):
    PAYMENT = 0
    ENTITY = 1
    TERMINATION = 2
    TRANSFER = 3
    OTHER = 4


TRANSFER_WORDS = ['deliver', 'transfer', 'issue', 'give', 'receive', 'write']
TRAINED_QA_MODEL_PATH = "/home/pxf109/ContractToSmartContract-python/qa_outputs/robert-base-squad2"  # need modification
TRANSFER_SUBJ = ['filling', 'receipt', 'document', 'notice', 'file', 'files', 'delivery', 'consent']
CLASSIFIER = 'roberta'
CLASSIFIER_PATH = '/home/pxf109/ContractToSmartContract-python/outputs/roberta-base'
DEFINE_WORDS = ['mean', 'define','describe','interpret']
NEGATIVE_WORDS= ['not', 'no']
RIGHTS_AND_OBLICATION =['right', 'obligation','rule', 'law', 'term', 'regulation']
MONTHS = ['January', 'February','March','April','May','June','July','August','September', 'October','November','December']
# CONTRACT_QUESTIONS={'employment_agreement':{'entity':["Who is the employee?", "Who is the employeer?", "What is the effective date?"]},
#                     'indenture_agreement':{'entity':['Who is the company?', 'Who is the trustee?', 'What is the effective date?']},
#                     'credit_agreement':{'entity':['Who is the borrower?', 'Who is the lender?', 'What is the effective date?']},
#                     'underwritting_agreement':{'entity':['Who is the company', 'Who is the underwritter?']},
#                     'stock_purchase_agreement':{'entity':['Who is the seller?', 'Who is the buyer?', 'What is the effective date?']},
#                    'registration_agreement:':{} }  # need more modification



INDENTRUE_AGREEMENT = 'indenture_agreement'
EMPLOYMENT_AGREEMENT = 'employment_agreement'
CREDIT_AGREEMENT = 'credit_agreement'
TRUST_AGREEMENT= 'trust_agreement'
UNDERWRITTING_AGREEMENT = 'underwritting_agreement'
SECURITY_PURCHASE_AGREEMENT = 'security_purchase_agreement'
REGISTRATION_AGREEMENT = 'registration_agreement'
PLAN_AND_MERGER_AGREEMENT = 'plan_and_merger_agreement'
QUESTION_ABOUT_EFFECTIVE_DATE = 'What is the effective date?'

QUESTION_ABOUT_COMPANY_INDENTURE = 'Who is the company?'
QUESTION_ABOUT_TRUSTEE_INDENTURE = 'Who is the trustee?'

QUESTION_ABOUT_EMPLOYEE_EMPLOYMENT = 'Who is the employee?'
QUESTION_ABOUT_EMPLOYER_EMPLOYMENT = 'Who is the employer?'

QUESTION_ABOUT_BORROWER_CREDIT = 'Who is the borrower?'
QUESTION_ABOUT_LENDER_CREDIT = 'Who is the lender?'

QUESTION_ABOUT_COMPANY_UNDERWRITTING = 'Who is the company?'
QUESTION_ABOUT_UNDERWRITTER_UNDERWRITTING = 'Who is the underwritter?'

QUESTION_ABOUT_SELLER_SECURITY_PURCHASE = 'Who is the seller?'
QUESTION_ABOUT_BUYER_SECURITY_PURCHASE ='Who is the buyer?'

QUESTION_ABOUT_TRUSTEE_TRUST_AGREEMENT = 'Who is the trustee?'
QUESTION_ABOUT_DEPOSITOR_TRUST_AGREEMENT = 'Who is the depositor?'

QUESTION_ABOUT_BUYER_PLANMERGER_AGREEMENT = 'What is the parent?'
QUESTION_ABOUT_COMPANY_PLANMERGER_AGREEMENT='Who is the company?'

QUESTION_ABOUT_COMPANY_REGISTRATION_AGREEMENT='Who is the company?'
QUESTION_ABOUT_BUYER_REGISTRATION_AGREEMENT= "Who is the buyer?"


CONTRACT_ENTITY_QUESTIONS = {EMPLOYMENT_AGREEMENT:[QUESTION_ABOUT_EFFECTIVE_DATE, QUESTION_ABOUT_EMPLOYER_EMPLOYMENT, QUESTION_ABOUT_EMPLOYEE_EMPLOYMENT],
                             CREDIT_AGREEMENT:[QUESTION_ABOUT_EFFECTIVE_DATE, QUESTION_ABOUT_BORROWER_CREDIT, QUESTION_ABOUT_LENDER_CREDIT],
                             UNDERWRITTING_AGREEMENT:[QUESTION_ABOUT_EFFECTIVE_DATE, QUESTION_ABOUT_COMPANY_UNDERWRITTING, QUESTION_ABOUT_UNDERWRITTER_UNDERWRITTING],
                             INDENTRUE_AGREEMENT:[QUESTION_ABOUT_EFFECTIVE_DATE, QUESTION_ABOUT_COMPANY_INDENTURE, QUESTION_ABOUT_TRUSTEE_INDENTURE],
                             TRUST_AGREEMENT:[QUESTION_ABOUT_EFFECTIVE_DATE, QUESTION_ABOUT_TRUSTEE_TRUST_AGREEMENT, QUESTION_ABOUT_DEPOSITOR_TRUST_AGREEMENT],
                             SECURITY_PURCHASE_AGREEMENT:[QUESTION_ABOUT_EFFECTIVE_DATE, QUESTION_ABOUT_BUYER_SECURITY_PURCHASE, QUESTION_ABOUT_SELLER_SECURITY_PURCHASE],
                             PLAN_AND_MERGER_AGREEMENT:[QUESTION_ABOUT_EFFECTIVE_DATE, QUESTION_ABOUT_BUYER_REGISTRATION_AGREEMENT,QUESTION_ABOUT_COMPANY_PLANMERGER_AGREEMENT],
                             REGISTRATION_AGREEMENT:[QUESTION_ABOUT_EFFECTIVE_DATE, QUESTION_ABOUT_BUYER_REGISTRATION_AGREEMENT, QUESTION_ABOUT_COMPANY_REGISTRATION_AGREEMENT]}

TRAINED_QA_MODEL_PATH = {INDENTRUE_AGREEMENT: '/home/username/ContractToSmartContract-python/qa_outputs/robert-base-squad2_indenture_agreement',
                         CREDIT_AGREEMENT: '/home/username/ContractToSmartContract-python/qa_outputs/robert-base-squad2_credit_agreement',
                         EMPLOYMENT_AGREEMENT:'/home/username/ContractToSmartContract-python/qa_outputs/robert-base-squad2_employment_agreement',
                         TRUST_AGREEMENT:'/home/username/ContractToSmartContract-python/qa_outputs/robert-base-squad2_trust_agreement',
                         SECURITY_PURCHASE_AGREEMENT:'/home/username/ContractToSmartContract-python/qa_outputs/robert-base-squad2_stock_purchase_agreement',
                         UNDERWRITTING_AGREEMENT:'/home/username/ContractToSmartContract-python/qa_outputs/robert-base-squad2_underwritting_agreement',
                         REGISTRATION_AGREEMENT:'/home/username/ContractToSmartContract-python/qa_outputs/robert-base-squad2_registration_agreement',
                         PLAN_AND_MERGER_AGREEMENT:'/home/username/ContractToSmartContract-python/qa_outputs/robert-base-squad2_planmerger_agreement'
                         }


SELLER = 'seller'
BUYER = 'buyer'
PAYMENT_DIRECTIONS = {INDENTRUE_AGREEMENT:{SELLER: QUESTION_ABOUT_COMPANY_INDENTURE, BUYER: QUESTION_ABOUT_TRUSTEE_INDENTURE},
                      CREDIT_AGREEMENT:{SELLER: QUESTION_ABOUT_BORROWER_CREDIT, BUYER:QUESTION_ABOUT_LENDER_CREDIT},
                      EMPLOYMENT_AGREEMENT:{SELLER: QUESTION_ABOUT_EMPLOYER_EMPLOYMENT, BUYER:QUESTION_ABOUT_EMPLOYEE_EMPLOYMENT},
                      TRUST_AGREEMENT:{SELLER: QUESTION_ABOUT_TRUSTEE_TRUST_AGREEMENT, BUYER:QUESTION_ABOUT_DEPOSITOR_TRUST_AGREEMENT},
                      SECURITY_PURCHASE_AGREEMENT:{SELLER:QUESTION_ABOUT_SELLER_SECURITY_PURCHASE, BUYER: QUESTION_ABOUT_BUYER_SECURITY_PURCHASE},
                      UNDERWRITTING_AGREEMENT:{SELLER:QUESTION_ABOUT_COMPANY_UNDERWRITTING, BUYER: QUESTION_ABOUT_UNDERWRITTER_UNDERWRITTING},
                      PLAN_AND_MERGER_AGREEMENT:{SELLER:QUESTION_ABOUT_COMPANY_PLANMERGER_AGREEMENT, BUYER:QUESTION_ABOUT_BUYER_PLANMERGER_AGREEMENT},
                      REGISTRATION_AGREEMENT:{SELLER:QUESTION_ABOUT_COMPANY_REGISTRATION_AGREEMENT, BUYER:QUESTION_ABOUT_BUYER_REGISTRATION_AGREEMENT}}


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