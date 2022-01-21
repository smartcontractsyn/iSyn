import os
from IR2json import IR2json

files_list = []
for dir_path, directories, files in os.walk("./test_case/"):
    if dir_path[-1] != "/":
        print(dir_path)
        # print(files)
        IR2json(dir_path + "/smartIR.txt", dir_path + "/IR.json")

os.system("node batch_synthesize.js")
# print(files_list)