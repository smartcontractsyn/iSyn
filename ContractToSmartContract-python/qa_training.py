'''
This file is used to train the QA module
'''
import os
import json
from simpletransformers.question_answering import QuestionAnsweringModel, QuestionAnsweringArgs
from sklearn.model_selection import train_test_split
from sklearn.model_selection import StratifiedKFold

def get_roberta_base(model_args):
    model_args.output_dir = str(os.path.join("qa_outputs", "robert-base-squad2"))
    model_args.num_train_epochs = 5
    model_args.overwrite_output_dir = True
    model_args.best_model_dir = str(os.path.join("qa_outputs", "best"))
    model = QuestionAnsweringModel("roberta", "deepset/roberta-base-squad2", args = model_args)
    return model


def get_bert_base_uncased(model_args):
    model_args.output_dir = str(os.path.join("qa_outputs", "bert-base-uncase"))
    model_args.overwrite_output_dir = True
    model_args.do_lower_case = True
    model_args.best_model_dir = str(os.path.join("qa_outputs", "best"))
    model = QuestionAnsweringModel("bert", "bert-base-uncased", args = model_args)
    return model


# def k_fold_validation(get_model, data, model_args):
#     n = 5
#     kf =


if __name__ == "__main__":
    file_path = ""
    with open(file_path, 'r') as src_file:
        json_obj =  json.load(src_file)

    train_tmp, test = train_test_split(json_obj, test_size=0.2, random_state=1)
    model_args = QuestionAnsweringArgs()
    model = get_roberta_base(model_args)
    model.train_model(train_tmp)
    result, model_outputs = model.eval_model(test)
    print(result)



