import subprocess
import sys
import os

# testcase_Dirs = [[], # PA
#                 ["0", "1", "2", "3", "4", "5", "6"], # SPA
#                 ["0", "1"], # SECPA
#                 ["0", "1"]]; # SA

testcase_Dirs = [["0", "1", "2", "3", "4", "5"], # PA
                ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"], # SPA
                ["0", "1", "2", "3"], # SECPA
                ["0", "1"]] # SA

groundTruthNamePatterns = ["PurchaseAgreementGroundTruth_", "StockPurchaseAgreementGroundTruth_", "SecurityPurchaseAgreementGroundTruth_", "SecurityAgreementGroundTruth_"]
generatedNamePatterns = ["PurchaseAgreementGenerated_", "StockPurchaseAgreementGenerated_", "SecurityPurchaseAgreementGenerated_", "SecurityAgreementGenerated_"]
dirNamePatterns = ["PA", "SPA", "SECPA", "SA"]


for i in range(len(dirNamePatterns)):
    for j in range(len(testcase_Dirs[i])):
        
        cmd = ['python3', 
                "calSolVecSimilarity.py",
                "test_case/" + dirNamePatterns[i] + testcase_Dirs[i][j] + "/" + groundTruthNamePatterns[i] + testcase_Dirs[i][j] + ".sol",
                "test_case/" + dirNamePatterns[i] + testcase_Dirs[i][j] + "/" + generatedNamePatterns[i] + testcase_Dirs[i][j] + ".sol"] 
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE)
        process.wait()
        print(dirNamePatterns[i] + testcase_Dirs[i][j])
        print(process.stdout.read().decode('utf-8'))