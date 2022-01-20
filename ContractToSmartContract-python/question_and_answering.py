import json
from nltk import StanfordNERTagger
from nltk.tokenize import word_tokenize
from nltk.parse.corenlp import CoreNLPParser
from simpletransformers.question_answering import QuestionAnsweringModel, QuestionAnsweringArgs

STTager = StanfordNERTagger("/home/<set up by user>/stanford-ner-2020-11-17/classifiers/english.muc.7class.distsim.crf.ser.gz",
                            "/home/<set up by user>/stanford-ner-4.2.0/stanford-ner-2020-11-17/stanford-ner-4.2.0.jar",
                            encoding='utf-8')


def question_answer_payment(sentence_file, qa_model, question_list):
    res = dict()
    with open(sentence_file, 'r') as src_file:
        lines = src_file.readlines()
    for q in question_list:
        res[q] = set()
    id = 0
    for l in lines:
        for q in question_list:
            question = construct_qa_input(l, q, id)
            id += 1
            predictions, raw_outputs = qa_model.predict(question)
            predictions = predictions[0]
            answer = predictions['answer']
            if answer[0] != '':                 # skip the none solution
                if answer[0][-1] == ",":
                    answer[0] = answer[0][0:len(answer[0])-1]
                res[q].add(answer[0])
    return res


def question_anwser_entity(sentence_file, qa_model, question_list):
    res = dict()
    with open(sentence_file, 'r') as src_file:
        lines = src_file.readlines()
    for q in question_list:
        res[q] = set()
    id = 0
    line_number = 0
    for l in lines:
        for q in question_list:
            question = construct_qa_input(l, q, id)
            id += 1
            predictions, raw_outputs = qa_model.predict(question)
            predictions = predictions[0]
            answer = predictions['answer']
            if answer[0] != '':                 # skip the none solution
                # comma_index = len(answer[0])
                # if answer[0].find(",") != -1:   # get rid of ,
                #     comma_index = answer[0].find(",")
                if q == "What is effective date?":
                    res[q].add((answer[0], line_number))
                else:
                    res[q].add(answer[0])
        line_number += 1
    process_entity_solution(res, question_list)
    return res


def process_entity_solution(solution_res, question_list):
    '''
    get rid of ,  in the qa solutions
    :param solution_res:
    :param question_list:
    :return: None
    '''
    for q in question_list:
        if q == "What is effective date?":
            solution_set = solution_res[q]
            for s in solution_set:
                if len(s) > 0 and s[len(s)-1] == ',':
                    solution_set.remove(s)
                    s = s[0:len(s)-1]
                    solution_set.add(s)
        else:
            solution_set = solution_res[q]
            for s in solution_set:
                if len(s) > 0:
                    comma_index = len(s)
                    if s.find(",") != -1:
                        comma_index = s.find(",")
                solution_set.remove(s)
                solution_set.add(s[0:comma_index])






def question_answer_termination(sentence_file, qa_model, question_list):
    res = dict()
    with open(sentence_file, 'r') as src_file:
        lines = src_file.readlines()
    for q in question_list:
        res[q] = set()
    id = 0
    for l in lines:
        for q in question_list:
            question = construct_qa_input(l, q, id)
            id += 1
            predictions, raw_outputs = qa_model.predict(question)
            predictions = predictions[0]
            answer = predictions['answer']
            if answer[0] != '':                 # skip the none solution
                if answer[0][-1] == ",":
                    answer[0] = answer[0][0:len(answer[0])-1]
                res[q].add(answer[0])
    return res


def question_answer_transfer(sentence_file, qa_model, question_list):
    res = dict()
    with open(sentence_file, 'r') as src_file:
        lines = src_file.readlines()

    for q in question_list:
        res[q] = set()
    id = 0
    for l in lines:
        for q in question_list:
            question = construct_qa_input(l, q, id)
            id += 1
            predictions, raw_outputs = qa_model.predict(question)
            predictions = predictions[0]
            answer = predictions['answer']
            if answer[0] != '':                 # skip the none solution
                if answer[0][-1] == ",":
                    answer[0] = answer[0][0:len(answer[0])-1]
                res[q].add(answer[0])
    return res


def iterate_ner_res(nre_res):
    with open(nre_res, 'r') as src_file:
        json_res = json.load(src_file)

    doic_id = json_res['docId']
    sentences = json_res['sentences']

    ner_set = set()
    for i in range(len(sentences)):
        cur_sentences_res = sentences[i]
        token_list = cur_sentences_res['tokens']
        for token in token_list:
            ner_set.add(token['ner'])
    print(ner_set)



def get_trained_qa_model(model_path):
    model = QuestionAnsweringModel("roberta", model_path)
    return model


def construct_qa_input(context, question, id):
    res = []
    question_obj = dict()

    question_obj['context'] = context
    question_obj['qas'] = []
    qas_dict = dict()
    qas_dict['question'] = question
    qas_dict['id'] = id
    question_obj['qas'].append(qas_dict)

    res.append(question_obj)
    return res

