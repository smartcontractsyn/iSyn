# copy selected contracts for evaluation

from distutils.dir_util import copy_tree
from shutil import copyfile
import os

# contract_path = "/home/zzh/projects/SmartContract/Justitia-Backup/src/synthesis/test/test_case"
# temp_contract_path = "/home/zzh/projects/SmartContract/temp/Justitia-Backup/src/synthesis/test/test_case"
# test_path = "/home/zzh/projects/SmartContract/Justitia-Backup/src/synthesis/test/test_case"
# gtt_path = "/home/zzh/projects/SmartContract/Justitia-Backup/src/synthesis/test/ground_truth_template.sol"
# IRgtt_path = "/home/zzh/projects/SmartContract/Justitia-Backup/src/synthesis/test/IR_template.json"

# # output_path = "/home/zzh/projects/SmartContract/Classification/output"
# for folder in os.listdir(contract_path):
#     cur_path = os.path.join(contract_path, folder)
#     temp_cur_path = os.path.join(temp_contract_path, folder)
#     if not os.path.isdir(cur_path):
#         continue
#     if folder == "selected":
#         continue
#     candidates = []
#     for x in os.listdir(cur_path):
#         # print(x)
#         c_path = os.path.join(cur_path, x)  
#         temp_c_path = os.path.join(temp_cur_path, x)      
#         # copy_tree(c_path, ct_path)
#         if os.path.isfile(temp_c_path + "/ground_truth.sol"):
#             # continue
#             print(temp_c_path + "/ground_truth.sol")
#             # copyfile(temp_c_path + "/ground_truth.sol", c_path + "/ground_truth.sol")


contract_path = "/home/zzh/projects/SmartContract/Classification/evaluations2/evaluations"
temp_contract_path = "/home/zzh/projects/SmartContract/temp/Justitia-Backup/src/synthesis/test/test_case"
test_path = "/home/zzh/projects/SmartContract/Justitia-Backup/src/synthesis/test/test_case"
gtt_path = "/home/zzh/projects/SmartContract/Justitia-Backup/src/synthesis/test/ground_truth_template.sol"
IRgtt_path = "/home/zzh/projects/SmartContract/Justitia-Backup/src/synthesis/test/IR_template.json"

# output_path = "/home/zzh/projects/SmartContract/Classification/output"
for folder in os.listdir(contract_path):
    cur_path = os.path.join(contract_path, folder)
    # temp_cur_path = os.path.join(temp_contract_path, folder)
    if not os.path.isdir(cur_path):
        continue
    if folder == "selected":
        continue
    candidates = []
    for x in os.listdir(cur_path):
        # print(x)
        c_path = os.path.join(cur_path, x)  
        # temp_c_path = os.path.join(temp_cur_path, x)      
        # copy_tree(c_path, ct_path)
        # if os.path.isfile(temp_c_path + "/ground_truth.sol"):
            # continue
            # print(temp_c_path + "/ground_truth.sol")
        print(c_path)
        copyfile(IRgtt_path, c_path + "/IR_ground_truth.json")