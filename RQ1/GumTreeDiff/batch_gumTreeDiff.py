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
        
        cmd = ["gradlew.bat",
                "run",
                "--args",
                "actiondiff " +
                "test_case/" + dirNamePatterns[i] + testcase_Dirs[i][j] + "/" + groundTruthNamePatterns[i] + testcase_Dirs[i][j] + ".sol" + " " +
                "test_case/" + dirNamePatterns[i] + testcase_Dirs[i][j] + "/" + generatedNamePatterns[i] + testcase_Dirs[i][j] + ".sol"
                ] 
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE)
        try:
            outs, errs = process.communicate(timeout=15)
        except TimeoutExpired:
            proc.kill()
            outs, errs = proc.communicate()
        print(dirNamePatterns[i] + testcase_Dirs[i][j])
        print(outs.decode('utf-8'))

# python .\batch_gumTreeDiff.py | out-file -encoding utf8 batch_diff_result.txt
