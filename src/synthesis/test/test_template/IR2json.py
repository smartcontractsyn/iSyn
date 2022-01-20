import sys
import re
import json
import yaml

# Convert SmartIR to json for ease of synthesis

def IR2json(input_f, output_f):
    with open(input_f, "r", encoding="utf-8") as ifile:
        lines = ifile.readlines()

        ir = "".join(lines)
        
        ir = re.sub(r'([A-Za-z]+):', r'"\1":', ir)
        # print(ir)
        ir = re.sub(r'"Price":.+?"Amount": ([^,]+?),.+?\}', r'"Price": \1,', ir, flags=re.DOTALL)
        ir = re.sub(r'\(.+?\).+?Payment.*?\{(.+?)\};', r'\1', ir, flags=re.DOTALL)
        ir = re.sub(r'("Termination":.+?)\(.+?\).+?\};', r'\1};', ir, flags=re.DOTALL)
        
        ir = re.sub(r';', r',', ir, flags=re.DOTALL)
        ir = re.sub(r': ([^\n"\{\[]+?)[;,]\n', r': "\1",\n', ir, flags=re.DOTALL)
        ir = re.sub(r': ([^\n";,\{\[]+?)\n', r': "\1"\n', ir, flags=re.DOTALL)
        
        # ir = re.sub(r': ([A-Z][a-zA-Z]+)', r': "\1"', ir, flags=re.DOTALL)
        # ir = re.sub(r': ([<>=]+)', r': "\1"', ir, flags=re.DOTALL)
        ir = "{\n" + ir + "\n}"
        ir = re.sub(r'\n', r'', ir, flags=re.DOTALL)
        ir = re.sub(r'leftOprand', r'leftOp', ir, flags=re.DOTALL)
        ir = re.sub(r'rightOprand', r'rightOp', ir, flags=re.DOTALL)

        parsed = yaml.load(ir)
        # print(parsed)

        # Key rename
        parsed["CloseTime"] = [parsed["CloseTime"]]
        if parsed["ExpiryTime"] != None:
            parsed["OutSideClosingDate"] = [parsed.pop("ExpiryTime")]
        else:
            parsed["OutSideClosingDate"] = []
            parsed.pop("ExpiryTime")
        parsed["EffectiveTime"] = [parsed["EffectiveTime"]]
        parsed["BuyerName"] = parsed["Entity"]["BuyerNames"]
        parsed["SellerName"] = parsed["Entity"]["SellerNames"]
        parsed.pop("Entity")
        parsed["Payments"] = []
        for x in parsed["OnlineStateTransfer"]:
            x["Transfer"] = x.pop("DeliveryConstraint")
            if x["Transfer"] == "true":
                x["Transfer"] = True
            else:
                x["Transfer"] = False
            x["PurchasePrice"] = x.pop("Price")
            x["TimeLimit"] = x.pop("TimeConstraint")
            parsed["Payments"].append(x)
        parsed.pop("OnlineStateTransfer")
        if parsed["OfflineDelivery"]["DeliveryConstraint"] == "hash":
            parsed["OfflineDelivery"]["DeliveryConstraint"] = True
        else:
            parsed["OfflineDelivery"]["DeliveryConstraint"] = False
        parsed["Transfers"] = parsed.pop("OfflineDelivery")["DeliveryConstraint"]

        parsed["Terminations"] = {}
        if parsed["Termination"]["DeliveryConstraint"] == "true":
            parsed["Terminations"]["TransferTermination"] = True
        else:
            parsed["Terminations"]["TransferTermination"] = False
        if parsed["Termination"]["TimeConstraint"] == "true":
            parsed["Terminations"]["OutOfDateTermination"] = True
        else:
            parsed["Terminations"]["OutOfDateTermination"] = False
        if parsed["Termination"]["OtherConstraint"] == "true":
            parsed["Terminations"]["OtherTermination"] = True
        else:
            parsed["Terminations"]["OtherTermination"] = False    
        parsed.pop("Termination")

        # Output SmartIR json
        formatted_ir = json.dumps(parsed, indent=4, sort_keys=True)
        # print(formatted_ir)
        with open(output_f, "w", encoding='utf-8') as ofile:
            ofile.write(formatted_ir)