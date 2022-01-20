from utils import *
import os
import json


def convert_raw_csv_to_csv_processed_py_ssplit(folder_path, target_folder_path):
    ssplit_res = os.path.join(target_folder_path, "ssplit")
    txt_folder = os.path.join(target_folder_path, "text")
    if os.path.exists(ssplit_res) is False:
        os.mkdir(ssplit_res)

    if os.path.exists(txt_folder) is False:
        os.mkdir(txt_folder)

    for f in os.listdir(folder_path):
        file_path = os.path.join(folder_path, f)
        output_csv_to_txt_file(file_path, os.path.join(txt_folder, f))

    for f in os.listdir(txt_folder):
        file_path = os.path.join(txt_folder, f)
        process_input_with_nlp_ssplit(file_path, ssplit_res)

    for f in os.listdir(ssplit_res):
        file_path = os.path.join(ssplit_res, f)
        type_name = f.split(".")[0]+"_qa.csv"
        convert_nlp_ssplit_output_to_csv(file_path, "sentence", os.path.join(target_folder_path, type_name))


# add information from one row to the train_set
def one_row_info(index, context1, answer1, answer2, answer3, qa_dataframe, skip):
    row_info = dict()
    row_info["context"] = context1
    qas1 = get_qas(index, 0, answer1, context1, qa_dataframe)
    qas2 = get_qas(index, 1, answer2, context1, qa_dataframe)
    if isinstance(skip, str) is False or skip.strip() != "skip3":
        qas3 = get_qas(index, 2, answer3, context1, qa_dataframe)
        qas_array = [qas1, qas2,qas3]
        row_info["qas"] = qas_array
    else:
        qas_array = [qas1, qas2]
        row_info["qas"] = qas_array
    return row_info


# helper method for one_row_info
# get the dictionary in "qas" key for one question in a row
def get_qas(row_index1, question_index, answer, context1, qa_dataframe):
    # id for one question
    qas_id = row_index1 * 3 + question_index
    question = dict()
    question["id"] = str(qas_id)
    question["is_impossible"] = False
    question["question"] = qa_dataframe.columns[question_index+1]
    if answer == "None" or pd.isnull(answer):
        question["is_impossible"] = True
        question["answers"] = []
    else:
        answer_dict = dict()
        answer = answer
        answer_dict["text"] = answer
        # find the start index of the answer in the context
        if context1.find(answer) == -1:
            print(context1)
            print(answer)
            raise Exception("Can not find solution in given context")
        else:
            answer_dict["answer_start"] = context1.find(answer)
        # answer_dict["answer_start"] = context1.index(str(answer))
        question["answers"] = [answer_dict]
    return question


def convert_csv_file_to_json_train_data(csv_file_path, target_path):
    qa_sample = pd.read_csv(csv_file_path, index_col=0, skip_blank_lines=True)
    train_data = []
    for index, row in qa_sample.iterrows():
        context = row['sentences']
        if pd.isnull(context):
            continue
        a1 = row[1]
        if isinstance(a1, str):                                 # Who is the seller?
            a1 = a1.strip()
        a2 = row[2]
        if isinstance(a2, str):                                # Who is the buyer?
            a2 = a2.strip()
        a3 = row[3]
        if isinstance(a3, str):                                 # What is effective date?
            a3 = a3.strip()
        skip = row[4]

        one_row = one_row_info(index, context, a1, a2, a3, qa_sample, skip)
        train_data.append(one_row)

    for index, row in qa_sample.iterrows():
        context = row['sentences']
        if pd.isnull(context):
            continue
        a3 = row[3]
        if isinstance(a3, str):                                 # What is effective date?
            a3 = a3.strip()
        skip = row[4]
        if isinstance(skip, str) and skip.strip() == "skip3":
            continue



    folder, file_name_csv = ntpath.split(csv_file_path)
    file_name = file_name_csv.split(".")[0] + ".json"
    target_json_path = os.path.join(target_path, file_name)
    with open(target_json_path, 'w+') as dst_file:
        json.dump(train_data, dst_file, indent=2)

