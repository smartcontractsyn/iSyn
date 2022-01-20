from transformers import AutoTokenizer
from preprocess.read_labeled_sentence import read_data_from_google_csv
from simpletransformers.classification import ClassificationModel, ClassificationArgs
from sklearn.model_selection import train_test_split
from sklearn.model_selection import KFold
from utils import *
import pandas as pd
import logging
import os
import numpy as np
logging.basicConfig(level=logging.INFO)
transformers_logger = logging.getLogger("transformers")
transformers_logger.setLevel(logging.WARNING)


def read_labeled_payment_sentences(file_path, preprocess):
    res = dict()
    sentences = read_data_from_google_csv(file_path, preprocess)
    res['payment'] = sentences
    return res


def read_labeled_entity_sentences(file_path, preprocess):
    res = dict()
    sentences = read_data_from_google_csv(file_path, preprocess)
    res['entity'] = sentences
    return res


def read_labeled_termination_sentences(file_path, preprocess):
    res = dict()
    sentences = read_data_from_google_csv(file_path, preprocess)
    res['termination'] = sentences
    return res


def read_labeled_transfer_sentences(file_path, preprocess):
    res = dict()
    sentences = read_data_from_google_csv(file_path, preprocess)
    res['transfer'] = sentences
    return res


def read_labeled_other_sentences(file_path, preprocess):
    res = dict()
    sentences = read_data_from_google_csv(file_path, preprocess)
    res['others'] = sentences
    return res


def prepare_data_set(file_dictionary, preprocess_args):
    """
    input format: key: fiel path, key value range(payment, entity, transfer, termination, others)
    :param file_dictionary:
    :return: a data set used for training
    """
    data = []
    for k in file_dictionary:
        if k == 'payment':
            payment_sentences = read_labeled_payment_sentences(file_dictionary[k], preprocess_args)
            add_sentences_with_label(data, payment_sentences[k], 0)
        elif k == 'entity':
            entity_sentences = read_labeled_entity_sentences(file_dictionary[k], preprocess_args)
            add_sentences_with_label(data, entity_sentences[k], 1)
        elif k == 'termination':
            termination_sentences = read_labeled_termination_sentences(file_dictionary[k], preprocess_args)
            add_sentences_with_label(data, termination_sentences[k], 2)
        elif k == 'transfer':
            transfer_sentences = read_labeled_transfer_sentences(file_dictionary[k], preprocess_args)
            add_sentences_with_label(data, transfer_sentences[k], 3)
        else:
            other_sentences = read_labeled_other_sentences(file_dictionary[k], preprocess_args)
            add_sentences_with_label(data, other_sentences[k], 4)
    data_frame = pd.DataFrame(data)
    data_frame.columns = ["text", "labels"]
    return data_frame


def add_sentences_with_label(data, sentences, label):
    for s in sentences:
        data.append([s, label])


def get_roberta_base(model_args):
    model_args.output_dir = str(os.path.join("outputs", "roberta-base"))
    model_args.overwrite_output_dir = True
    model = ClassificationModel("roberta", "roberta-base", args=model_args, num_labels=5)
    return model


def get_roberta_large(model_args):
    model = ClassificationModel("roberta", "roberta-large", args=model_args, num_labels=5)
    return model


def get_bert_model_base_uncased(model_args):
    model_args.do_lower_case = True
    model_args.output_dir = str(os.path.join("outputs", "bert-base-uncased"))
    model = ClassificationModel("bert", "bert-base-uncased", args= model_args, num_labels=5)
    return model

def get_bert_model_base_cased(model_args):
    model_args.output_dir = str(os.path.join("outputs", "bert-base-cased"))
    model = ClassificationModel("bert", "bert-base-cased", args=model_args, num_labels= 5)
    return model


def get_distilbert_base_uncase(model_args):
    model_args.do_lower_case = True
    model_args.output_dir =  str(os.path.join("outputs", "distilbert-base-uncase"))
    model = ClassificationModel("distilbert", "distilbert-base-uncased", args=model_args, num_labels=5)
    return model


def get_distilbert_base_cased(model_args):
    model_args.output_dir = str(os.path.join("outputs", "distilbert-base-cased"))
    model = ClassificationModel("distilbert", "distilbert-base-cased", args=model_args, num_labels=5)
    return model


def get_distlbert_based_uncased_distilled_squad(model_args):
    model_args.do_lower_case = True
    model_args.output_dir = str (os.path.join("outputs", "distilbert-based-uncased-squad"))
    model = ClassificationModel("distilbert", "distilbert-base-uncased-distilled-squad", args=model_args, num_labels=5)
    return model


def get_robert_large(model_args):
    model = ClassificationModel("roberta", "roberta-large", args = model_args, num_labels=5)
    return model


def get_flaubert_small_cased(model_args):
    model_args.output_dir = str(os.path.join("outputs", "flaubert_small_cased"))
    model = ClassificationModel("flaubert", "flaubert/flaubert_small_cased", args= model_args, num_labels=5)
    return model


def get_flaubert_base_cased(model_args):
    model_args.output_dir = str(os.path.join("outputs", "flaubert_base_cased"))
    model = ClassificationModel("flaubert", "flaubert/flaubert_base_cased", args= model_args, num_labels=5)
    return model


def get_flaubert_base_uncased(model_args):
    model_args.output_dir = str(os.path.join("outputs", "flaubert_base_uncased"))
    model_args.do_lower_case = True
    model = ClassificationModel("flaubert", "flaubert/flaubert_base_uncased", args= model_args, num_labels=5)
    return model


def get_layoutlm_base_uncased(model_args):  # for now the download code has issues
    model_args.output_dir = str(os.path.join("outputs", "layoutlm_base_uncased"))
    model_args.do_lower_case = True
    model = ClassificationModel("layoutlm", "microsoft/layoutlm-base-uncased", args= model_args, num_labels=5)
    return model


def get_xlm(model_args):  # out of memory currently
    model_args.output_dir = str(os.path.join("outputs", "xlm"))
    model = ClassificationModel("xlm", "xlm-mlm-en-2048", args= model_args, num_labels = 5)
    return model


def get_xlm_roberta(model_args):
    model_args.output_dir = str(os.path.join("outputs", "xlm_roberta"))
    model = ClassificationModel("xlmroberta", "xlm-roberta-base", args= model_args, num_labels = 5)
    return model


def get_xlnet(model_args):
    model_args.output_dir = str(os.path.join("outputs", "xlnet"))
    model = ClassificationModel("xlnet", "xlnet-base-cased", args= model_args, num_labels = 5)
    return model


def k_fold_validation(get_model, all_data, model_args):
    n = 5
    kf = KFold(n_splits=n, random_state=1, shuffle=True)
    results = []
    for train_index, val_index in kf.split(all_data):
        train_df = all_data.iloc[train_index]
        val_df = all_data.iloc[val_index]
        model = get_model(model_args)
        model.train_model(train_df)
        result, model_outputs, wrong_predictions = model.eval_model(val_df)
        print(result['mcc'])
        results.append(result['mcc'])

    for i, result in enumerate(results, 1):
        print(f"Fold-{i}:{result}")

    print(f"{n}-fold CV accuracy result: Mean: {np.mean(results)} Standard deviation:{np.std(results)}")
    return results


def compare_model_by_k_fold(model_list, train_tmp, model_args):
    kfold_res_dict = dict()
    kfold_res_dict['model'] = []
    kfold_res_dict['mean'] = []
    kfold_res_dict['deviation'] = []
    for i in range(len(model_list)):
        # model = model_list[i](model_args)
        # model.train_model(train, eval_df=vali)
        # result, model_outputs, wrong_predictions = model.eval_model(test)
        model_args.evaluate_during_training = False
        model_name = str(model_list[i])[4:]
        kfold_res_dict['model'].append(model_name)
        kfold_res = k_fold_validation(model_list[i], train_tmp, model_args)
        kfold_res_dict['mean'].append(np.mean(kfold_res))
        kfold_res_dict['deviation'].append(np.std(kfold_res))

    kfold_res_dataframe = pd.DataFrame(data=kfold_res_dict)
    kfold_res_dataframe.to_csv("kFold_res.csv")

