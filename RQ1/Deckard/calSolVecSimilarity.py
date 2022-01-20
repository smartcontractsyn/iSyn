import subprocess
import sys
import os
import numpy as np
from numpy.linalg import norm

FNULL = open(os.devnull, 'w')

sol_filename0 = sys.argv[1]
sol_filename1 = sys.argv[2]
line_num0 = 0
line_num1 = 0

with open(sol_filename0, 'r', encoding='utf-8') as ifile:
    lines = ifile.readlines()
    line_num0 = len(lines)

with open(sol_filename1, 'r', encoding='utf-8') as ifile:
    lines = ifile.readlines()
    line_num1 = len(lines)

# Get vector of file0
cmd = ['./solvecgen', sol_filename0, '--start-line-number', '1', '--end-line-number', str(line_num0)]
# process = subprocess.Popen(cmd, stdout=subprocess.PIPE)
process = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
process.wait()

cmd = ['./solvecgen', sol_filename1, '--start-line-number', '1', '--end-line-number', str(line_num1)]
# process = subprocess.Popen(cmd, stdout=subprocess.PIPE)
process = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
process.wait()

solvec_filename0 = sys.argv[1] + ".vec"
solvec_filename1 = sys.argv[2] + ".vec"
solvec0 = []
solvec1 = []

with open(solvec_filename0, "r", encoding='utf-8') as ifile:
    lines = ifile.readlines()
    vecline = lines[1]
    vecline = vecline.strip("\n")
    solvec0 = vecline.split(" ")
    # print(solvec0)
    solvec0 = [int(x) for x in solvec0 if x != '']
    solvec0 = np.array(solvec0)

with open(solvec_filename1, "r", encoding='utf-8') as ifile:
    lines = ifile.readlines()
    vecline = lines[1]
    vecline = vecline.strip("\n")
    solvec1 = vecline.split(" ")
    # print(solvec1)
    solvec1 = [int(x) for x in solvec1 if x != '']
    solvec1 = np.array(solvec1)

cos_sim = np.inner(solvec0, solvec1) / (norm(solvec0) * norm(solvec1))
print()
print("Vec cosine", cos_sim)
print("Difference 1-norm", np.linalg.norm((solvec0 - solvec1), ord=1))
print("Difference 2-norm", np.linalg.norm((solvec0 - solvec1), ord=2))