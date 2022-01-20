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

# cgs = ["PA", "SECPA", "SPA", "EA", "TA", "UWA", "IC", "CC"]
# cg_dict = {"PA":"PA", "SA":"SECPA", "SECPA":"SECPA", "SPA":"SPA", "Security_Purchase":"SECPA", "agreement_of_plan_and_merger":"PMA",
#             "agreements":"Misc", "credit_contract":"CC", "employ_agreement":"EA", "indenture_contracts":"IC", "registration_rights_contracts":"RRC",
#                 "trust_agreement":"TA", "underwriting_agreements":"UWA"}

cgs = ["CC", "EA", "IC", "PMA", "RRC", "SECPA", "TA", "Mini-bench"]
cg_dict = {"PA":"Mini-bench", "SA":"Mini-bench", "SECPA":"Mini-bench", "SPA":"Mini-bench", "Security_Purchase":"SECPA", "agreement_of_plan_and_merger":"PMA",
            "credit_contract":"CC", "employ_agreement":"EA", "indenture_contracts":"IC", "registration_rights_contracts":"RRC",
                "trust_agreement":"TA"}

gen_tc_num = []
gt_tc_num = []
gen_tc_bitmap = []
gt_tc_bitmap = []

# with open("test_case_num.txt", "r", encoding="utf-8") as ifile:
#     lines = ifile.readlines()
#     for line in lines:
#         line.strip("\n")
#         nums = line.split(" ")
#         gen_tc_num.append(int(nums[0]))
#         gt_tc_num.append(int(nums[1]))

#     action_nums = []

for i in range(len(cgs)):
    gen_tc_num.append([])
    gt_tc_num.append([])
    gen_tc_bitmap.append([])
    gt_tc_bitmap.append([])

with open("data/test-case.txt", "r", encoding="utf-8") as ifile:
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
            gen_tc_num[cgs.index(cg_dict[segs[0]])].append(int(segs[3]))
            gt_tc_num[cgs.index(cg_dict[segs[0]])].append(int(segs[4]))
            gen_tc_bitmap[cgs.index(cg_dict[segs[0]])].append(segs[5])
            gt_tc_bitmap[cgs.index(cg_dict[segs[0]])].append(segs[6])


def line_figure1(ax):
    global gen_tc_num, gt_tc_num
    # delays = np.array([103,117,131,137,145,151,154,159,162,167,170,173,175,178,179,181,184])
    # delays = delays / 100

    # index = [x+1 for x in range(len(gt_tc_num))]
    # ax.plot(index, gt_tc_num, marker='d', markersize=4 , color='steelblue')
    # ax.plot(index, gen_tc_num, marker='*', markersize=4 , color='red')
    
    # # ax.set_yticks(y_pos)
    # ax.set_xticks(range(1,len(gt_tc_num) + 1,1))
    # ax.set_xticklabels(range(1,len(gt_tc_num) + 1,1), fontsize=14)

    begin = 1
    tick_pos = []
    for k in range(len(gen_tc_num)):
        cur_gen_tc_num = gen_tc_num[k]
        cur_gt_tc_num = gt_tc_num[k]
        tick_pos.append(begin + len(cur_gen_tc_num)/2)
        ax.axvline(begin-0.75, color='black', linestyle='dashed', linewidth=0.5)
        index = [x+begin for x in range(len(cur_gen_tc_num))]
        if k == 0:
            ax.bar(index, cur_gen_tc_num, width=1 , color='orange', linewidth=0.01, alpha=0.65, label='Ours')
            ax.bar(index, cur_gt_tc_num, width=1 , color='steelblue', linewidth=0.01, alpha=0.65, label='Ground Truth')
        else:
            ax.bar(index, cur_gen_tc_num, width=1 , color='orange', linewidth=0.01, alpha=0.65)
            ax.bar(index, cur_gt_tc_num, width=1 , color='steelblue', linewidth=0.01, alpha=0.65)
        begin += len(cur_gen_tc_num)
        
    # ax.set_yticks(y_pos)
    ax.set_xticks(tick_pos)
    ax.set_xticklabels(cgs, fontsize=10)
    ax.tick_params(axis='both', which='both', length=0)

    # ax.set_xticklabels(0,173,175,178,179,181,184])
    ax.set_xlabel('Legal Agreement Category')
    ax.set_ylabel("Constraint Amount")
    # ax.set_yscale('log')
    # ax.set_title('Dispatch delay of different patch number', pad=10)
    ax.set_ylim(ymin=0, ymax=20)
    # ax.set_xlabel("(a) Dispatch delay of various patch numbers") 
    ax.xaxis.labelpad = 8
    ax.legend(
        loc='upper left', ncol=1)

def print_recall_rate():
    global gen_tc_bitmap
    global gt_tc_bitmap
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
    posi_num = 0
    recall_num = 0
    output_str += "|Test Case Recall"
    for i in range(len(gen_tc_bitmap)):
        cur_posi_num = 0
        cur_recall_num = 0
        c_gen = gen_tc_bitmap[i]
        c_gt = gt_tc_bitmap[i]
        for j in range(len(c_gen)):
            str_gen = c_gen[j]
            str_gt = c_gt[j]
            for k in range(len(str_gen)):
                if str_gt[k] == '1':
                    cur_posi_num += 1
                    if str_gen[k] == '1':
                        cur_recall_num += 1
        output_str += "|" + '{:.2%}'.format(cur_recall_num / cur_posi_num)
        posi_num += cur_posi_num
        recall_num += cur_recall_num
    output_str += "|" + '{:.2%}'.format(recall_num / posi_num)
    output_str += "|\n"

    posi_num = 0
    preci_num = 0
    output_str += "|Test Case Precision"
    for i in range(len(gen_tc_bitmap)):
        cur_posi_num = 0
        cur_preci_num = 0
        c_gen = gen_tc_bitmap[i]
        c_gt = gt_tc_bitmap[i]
        for j in range(len(c_gen)):
            str_gen = c_gen[j]
            str_gt = c_gt[j]
            for k in range(len(str_gen)):
                if str_gen[k] == '1':
                    cur_posi_num += 1
                    if str_gt[k] == '1':
                        cur_preci_num += 1
        output_str += "|" + '{:.2%}'.format(cur_preci_num / cur_posi_num)
        posi_num += cur_posi_num
        preci_num += cur_preci_num
    output_str += "|" + '{:.2%}'.format(preci_num / posi_num)
    output_str += "|\n"
    print(output_str) 

def draw_figure():
    (fig_width, fig_height) = plt.rcParams['figure.figsize']
    fig_size = [fig_width / 1.1, fig_height / 1.7 ]
    fig, axes = plt.subplots(ncols=1, nrows=1, num=style_label,
                             figsize=fig_size, squeeze=True)
    # axes[1].set_ylabel("Total Patch Delay (μs)")
    line_figure1(axes)
    plt.subplots_adjust(left=0.10, bottom=0.2, right=0.97, top=0.93, wspace=0.23, hspace=0.4)
    # plt.yscale("log")
    fig.align_labels()
    plt.show()
    fig.savefig("RQ4.pdf")

draw_figure()
print_recall_rate()