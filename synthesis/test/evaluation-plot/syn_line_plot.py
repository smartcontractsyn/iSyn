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
# cg_dict = {"PA":"PA", "SA":"SECPA", "SECPA":"SECPA", "SPA":"SPA", "Security_Purchase":"SECPA", "agreement_of_plan_and_merger":"PMA",
#             "agreements":"Misc", "credit_contract":"CC", "employ_agreement":"EA", "indenture_contracts":"IC", "registration_rights_contracts":"RRC",
#                 "trust_agreement":"TA", "underwriting_agreements":"UWA"}

cgs = ["CC", "EA", "IC", "PMA", "RRC", "SECPA", "TA", "Mini-bench"]
cg_dict = {"PA":"Mini-bench", "SA":"Mini-bench", "SECPA":"Mini-bench", "SPA":"Mini-bench", "Security_Purchase":"SECPA", "agreement_of_plan_and_merger":"PMA",
            "credit_contract":"CC", "employ_agreement":"EA", "indenture_contracts":"IC", "registration_rights_contracts":"RRC",
                "trust_agreement":"TA"}

def bar_figure_syn_line(ax):
    global cgs
    plt.sca(ax)
    line_nums = []
    for i in range(len(cgs)):
        line_nums.append([])
    with open("data/synthesized_line.txt", "r", encoding="utf-8") as ifile:
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
                line_nums[cgs.index(cg_dict[segs[0]])].append(int(segs[1]))

    begin = 1
    tick_pos = []
    c_num = 0
    for cur_line_nums in line_nums:
        c_num += len(cur_line_nums)
        print(len(cur_line_nums))
        tick_pos.append(begin + len(cur_line_nums)/2)
        ax.axvline(begin-0.75, color='black', linestyle='dashed', linewidth=0.5)
        index = [x+begin for x in range(len(cur_line_nums))]
        ax.bar(index, cur_line_nums, width=1 , color='steelblue', linewidth=0.01, alpha=0.65)
        begin += len(cur_line_nums)
        
    print(c_num)
    # ax.set_yticks(y_pos)
    ax.set_xticks(tick_pos)
    ax.set_xticklabels(cgs, fontsize=10)
    ax.tick_params(axis='both', which='both', length=0)
    # for tick in ax.xaxis.get_majorticklabels():
    #     tick.set_horizontalalignment("left")
    # ax.set_xticklabels(0,173,175,178,179,181,184])
    ax.set_xlabel('Legal Agreement Category')
    ax.set_ylabel("Synthesized LoC")
    # ax.set_yscale('log')
    # ax.set_title('Dispatch delay of different patch number', pad=10)
    # ax.set_ylim(ymin=0, ymax=600)
    # # ax.set_xlabel("(a) Dispatch delay of various patch numbers") 
    # ax.xaxis.labelpad = 8
    # ax.legend(('Ground Truth test case','Generated test case' ),
    #     loc='upper left', ncol=1)
    



def draw_figure():
    (fig_width, fig_height) = plt.rcParams['figure.figsize']
    fig_size = [fig_width/1.1, fig_height / 1.7 ]
    fig, axes = plt.subplots(ncols=1, nrows=1, num=style_label,
                             figsize=fig_size, squeeze=True)
    # axes[1].set_ylabel("Total Patch Delay (μs)")
    # line_figure1(axes[0])
    bar_figure_syn_line(axes)
    plt.yticks(fontsize=10, rotation=45)

    plt.subplots_adjust(left=0.11, bottom=0.16, right=0.985, top=0.97, wspace=0.23, hspace=0.4)
    # plt.yscale("log")
    fig.align_labels()
    plt.show()
    fig.savefig("synthesized-LoC.pdf")

draw_figure()