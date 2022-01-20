import numpy as np
from pylab import rcParams
import seaborn as sns
import matplotlib.pyplot as plt
from matplotlib.ticker import FormatStrFormatter
import re

from matplotlib import rcParams
import matplotlib as mpl
mpl.rcParams.update({'font.size': 13})
mpl.rcParams['pdf.fonttype'] = 42
mpl.rcParams['ps.fonttype'] = 42

# sns.set_style("white")
style_label = "default"

green = "mediumseagreen"
red = "salmon"
blue = "steelblue"

# def bar_figure1(ax):
#     y_pos = [0.38, 1.56, 1.80, 2.14, 2.48]
#     n_groups = [1, 4, 8, 16, 32]
#     index = np.arange(len(n_groups))
#     width = 0.4
#     ax.bar(index, y_pos, width, align='center', color="lightblue") #'#B9E0A5'
#     # ax.set_yticks(y_pos)
#     ax.set_xticks(index)
#     ax.set_xticklabels(n_groups)
#     # ax.set_xlabel('Performance')
#     ax.set_title('Dispatch delay of different patch number', pad=10)
#     ax.set_ylim(ymin=0, ymax=3)
#     ax.set_xlabel("(a)") 

# cgs = ["PA", "SECPA", "SPA", "EA", "TA", "RRC", "UWA", "IC", "PMA", "CC", "Misc"]
# cgs = ["PA", "SECPA", "SPA", "EA", "TA", "UWA", "IC", "CC"]
# cg_dict = {"PA":"PA", "SA":"SECPA", "SECPA":"SECPA", "SPA":"SPA", "Security_Purchase":"SECPA", "agreement_of_plan_and_merger":"PMA",
#             "agreements":"Misc", "credit_contract":"CC", "employ_agreement":"EA", "indenture_contracts":"IC", "registration_rights_contracts":"RRC",
#                 "trust_agreement":"TA", "underwriting_agreements":"UWA"}

cgs = ["CC", "EA", "IC", "PMA", "RRC", "SECPA", "TA", "Mini-bench"]
cg_dict = {"PA":"Mini-bench", "SA":"Mini-bench", "SECPA":"Mini-bench", "SPA":"Mini-bench", "Security_Purchase":"SECPA", "agreement_of_plan_and_merger":"PMA",
            "credit_contract":"CC", "employ_agreement":"EA", "indenture_contracts":"IC", "registration_rights_contracts":"RRC",
                "trust_agreement":"TA"}


func_num = []
correct_num = []

# with open("test_case_num.txt", "r", encoding="utf-8") as ifile:
#     lines = ifile.readlines()
#     for line in lines:
#         line.strip("\n")
#         nums = line.split(" ")
#         gen_tc_num.append(int(nums[0]))
#         gt_tc_num.append(int(nums[1]))

#     action_nums = []

for i in range(len(cgs)):
    func_num.append([])
    correct_num.append([])

with open("data/func_num_proofread.txt", "r", encoding="utf-8") as ifile:
    lines = ifile.readlines()
    lines = lines[2:]
    lines.sort()
    
    for line in lines:
        line = line.replace(" ","")
        line = line.strip("\n")
        segs = [x for x in line.split("|") if x]
        # print(segs)
        segs[0] = re.sub('[0-9]', "", segs[0].split("-")[0])
        if segs[0] in cg_dict and cg_dict[segs[0]] in cgs:
            func_num[cgs.index(cg_dict[segs[0]])].append(int(segs[1]))
            correct_num[cgs.index(cg_dict[segs[0]])].append(int(segs[2]))
           
def print_accuracy():
    global correct_num
    global func_num
    output_str = ""
    output_str += "|Contract Category"
    for x in cgs:
        output_str += "|" + x
    output_str += "|Average"
    output_str += "|\n"

    for x in cgs:
        output_str += "|----"
    output_str += "|----|----"
    output_str += "|\n"

    output_str += "|Functionality Accuracy"
    func_sum = 0
    correct_sum = 0
    for i in range(len(correct_num)):
        output_str += "|" + '{:.2%}'.format(sum(correct_num[i]) / sum(func_num[i]))
        func_sum += sum(func_num[i])
        correct_sum += sum(correct_num[i])
    output_str += "|" + '{:.2%}'.format(correct_sum / func_sum)
    output_str += "|\n"
    print(output_str) 

print_accuracy()