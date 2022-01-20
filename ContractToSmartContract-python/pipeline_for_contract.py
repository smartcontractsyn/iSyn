'''This file will process the raw contracts and classify each sentence and ask corresponding questions'''
import docx
import time
import os
from nltk.parse.corenlp import CoreNLPParser
import nltk
import ntpath
import subprocess
import copy
import json
import re
import sys
from simpletransformers.classification import ClassificationModel
from project_global_value import *
# from question_and_answering import *
from utils import *
from ner_tag_extraction import *
from event_detect import detect_transfer_event, detect_transfer_event_for_payment, detect_transfer_event_for_termination
from rule_based_extraction import extract_participants_for_contract
from project_global_value import IR
from word2number import w2n
from dateutil.parser import parse
from stanza.server import CoreNLPClient
from question_and_answering import get_trained_qa_model, question_anwser_entity, question_answer_termination
import stanza.server.semgrex as semgrex

def read_contract(path):
    if path.endswith("docx") is False:
        raise Exception("The input file is not a word file")

    document = docx.Document(path)
    fullText = []
    part_text= []
    prev_space = False
    for para in document.paragraphs:
        if prev_space is False:
            if para.text == "":
                prev_space = True
            fullText.append(para.text)
        else:
            if para.text == "":
                cur_para ="".join(part_text)
                part_text = []
                fullText.append(cur_para)
            else:
                part_text.append(para.text)
    return fullText


def read_trained_model(model_name, parameter_path):
    model = ClassificationModel(model_name, parameter_path)
    return model


def process_contract(path, output_dir):
    '''

    :param path: the docx file of the given contract
    :return: sentence with label
    '''
    performce_record = dict()
    contract_text = read_contract(path)
    trained_model = read_trained_model(CLASSIFIER, CLASSIFIER_PATH)

    res_dict = dict()
    res_dict[SentenceLabel.PAYMENT] = dict()
    res_dict[SentenceLabel.ENTITY] = dict()
    res_dict[SentenceLabel.TRANSFER] = dict()
    res_dict[SentenceLabel.TERMINATION] = dict()
    payment_sentences = []
    entity_sentences = []
    termination_sentences = []
    transfer_sentences = []
    classify_time_start = time.monotonic()

    for p in contract_text:
        sentences = nltk.sent_tokenize(p)
        if len(sentences) > 0:
            predict_res = trained_model.predict(sentences)
            labels = predict_res[0]
            for i, class_info in enumerate(labels):
                if class_info == SentenceLabel.PAYMENT:    # payment class
                    payment_sentences.append(sentences[i])
                    # payment_constraints = question_answer_payment(sentences[i])
                    # add_corresponding_constraints(class_info, res_dict, payment_constraints)
                elif class_info == SentenceLabel.ENTITY:  # entity class
                    entity_sentences.append(sentences[i])
                    # entity_constraints =  question_anwser_entity(sentences[i])
                    # add_corresponding_constraints(class_info, res_dict, entity_constraints)
                elif class_info == SentenceLabel.TERMINATION:  # termination class
                    termination_sentences.append(sentences[i])
                    # termination_constraints =  question_answer_termination(sentences[i])
                    # add_corresponding_constraints(class_info, res_dict, termination_constraints)
                elif class_info == SentenceLabel.TRANSFER: # transfer
                    transfer_sentences.append(sentences[i])
                    # transfer_constraints = question_answer_transfer(sentences[i])
                    # add_corresponding_constraints(class_info, res_dict, transfer_constraints)
                elif class_info == SentenceLabel.OTHER:
                    continue
                else:
                    print("The class info is not equal to any label")
    classify_time_end = time.monotonic()
    performce_record['classify'] = classify_time_end- classify_time_start


    extraction_start =  time.monotonic()

    parent_folder, case_name = ntpath.split(path)
    case_name = case_name.split(".")[0]
    category_info = path.split('/')[-2]
    folder_for_this_contract = os.path.join(output_dir, category_info+"-"+case_name)
    if os.path.exists(folder_for_this_contract) is False:
        os.mkdir(folder_for_this_contract)
    output_path_for_payment_sentences = os.path.join(folder_for_this_contract, "payment.txt")
    output_path_for_entity_sentences = os.path.join(folder_for_this_contract, "entity.txt")
    output_path_for_transfer_sentences = os.path.join(folder_for_this_contract, "transfer.txt")
    output_path_for_termination_sentences = os.path.join(folder_for_this_contract, "termination.txt")

    output_classified_res(output_path_for_payment_sentences, payment_sentences)
    output_classified_res(output_path_for_entity_sentences, entity_sentences)
    output_classified_res(output_path_for_transfer_sentences, transfer_sentences)
    output_classified_res(output_path_for_termination_sentences, termination_sentences)

    stanford_nlp_ssplit_processing(output_path_for_payment_sentences, folder_for_this_contract)
    stanford_nlp_ssplit_processing(output_path_for_entity_sentences, folder_for_this_contract)
    stanford_nlp_ssplit_processing(output_path_for_transfer_sentences, folder_for_this_contract)
    stanford_nlp_ssplit_processing(output_path_for_termination_sentences, folder_for_this_contract)

    ssplit_res_folder = os.path.join(folder_for_this_contract, 'ssplit')
    processed_ssplit_folder = os.path.join(folder_for_this_contract, 'pro_ssplit')
    if os.path.exists(processed_ssplit_folder) is False:
        os.mkdir(processed_ssplit_folder)

    # do sentence_ssplit first
    for f in os.listdir(ssplit_res_folder):
        ssplit_res_path = os.path.join(ssplit_res_folder, f)
        output_nlp_ssplit_only_sentences(ssplit_res_path, processed_ssplit_folder)

    ner_res_folder = os.path.join(folder_for_this_contract, 'ner')
    if os.path.exists(ner_res_folder) is False:
        os.mkdir(ner_res_folder)

    for f in os.listdir(processed_ssplit_folder):
        processed_ssplit_file_path = os.path.join(processed_ssplit_folder, f)
        stanford_nlp_ner_processing(processed_ssplit_file_path, ner_res_folder)

    payment_constraints = extract_ner_specific_ner_tag(os.path.join(ner_res_folder, 'payment.txt.out.json'))
    # payment_transfer_events = detect_transfer_event(os.path.join(ner_res_folder, 'payment.txt.out.json'))
    payment_transfer_events = detect_transfer_event_for_payment(os.path.join(ner_res_folder, 'payment.txt.out.json'))
    transfer_events = detect_transfer_event(os.path.join(ner_res_folder, 'transfer.txt.out.json'))
    termination_constraints = extract_ner_specific_ner_tag(os.path.join(ner_res_folder, 'termination.txt.out.json'))
    # termination_transfer_events = detect_transfer_event(os.path.join(ner_res_folder, 'termination.txt.out.json'))
    termination_transfer_events = detect_transfer_event_for_termination(os.path.join(ner_res_folder, 'termination.txt.out.json'))


    extracted_entity_signed_contract = extract_participants_for_contract(os.path.join(processed_ssplit_folder, 'entity.txt.out'))

    complete_entity = extract_signed_entity_from_ner_file(os.path.join(ner_res_folder, 'entity.txt.out.json'), extracted_entity_signed_contract)
    filtered_entity = filter_potential_signed_entity_based_on_frequency(complete_entity, os.path.join(processed_ssplit_folder, 'entity.txt.out'))
    #character_of_filtered_entity = find_character_of_signed_entity(filtered_entity, os.path.join(processed_ssplit_folder, 'entity.txt.out'))

    #QA model
    qa_model = get_trained_qa_model(TRAINED_QA_MODEL_PATH)
    entity_questions = ["Who is the seller?", "Who is the buyer?", "What is effective date?"]
    seller_buyer_potential_solutions = question_anwser_entity(os.path.join(processed_ssplit_folder, 'entity.txt.out'),
                                                              qa_model, entity_questions)
    seller_set = seller_buyer_potential_solutions[entity_questions[0]]
    buyer_set = seller_buyer_potential_solutions[entity_questions[1]]

    effective_data = seller_buyer_potential_solutions[entity_questions[2]]


    if len(seller_set) > 1:
        check_qa_res_based_on_rule_res(seller_set, complete_entity)
    if len(buyer_set) > 1:
        check_qa_res_based_on_rule_res(buyer_set, complete_entity)

    termination_questions = ["What is the date in this sentence?"]
    termination_date_qa = question_answer_termination(os.path.join(processed_ssplit_folder, 'termination.txt.out'),
                                                      qa_model, termination_questions)

    termindation_date_solution_qa =termination_date_qa[termination_questions[0]]


    copy_of_IR = copy.deepcopy(IR)

    # entity_count = 0
    # for e in character_of_filtered_entity:
    #     if character_of_filtered_entity[e] == "None":
    #         copy_of_IR["Entity"+"_extracted_"+str(entity_count)] = e
    #         entity_count += 1
    #     else:
    #         copy_of_IR[character_of_filtered_entity[e]+"_extracted"] = e
    modify_effective_date(effective_data, copy_of_IR)
    modify_seller_IR(seller_set, copy_of_IR)
    modify_buyer_IR(buyer_set, copy_of_IR)
    modify_payment_constraints(payment_constraints, payment_transfer_events, copy_of_IR)
    modify_transfer_constraints(transfer_events, copy_of_IR)
    modify_termination_constraints(termination_constraints, termination_transfer_events, termindation_date_solution_qa,
                                   os.path.join(processed_ssplit_folder, 'termination.txt.out'), copy_of_IR)
    # modify_signed_entity(filtered_entity, copy_of_IR)

    extraction_end = time.monotonic()

    performce_record['extraction'] = extraction_end - extraction_start
    ir_res_path = os.path.join(folder_for_this_contract, 'IR.json')
    smartIR  = convert_json_to_smartIR(copy_of_IR)

    with open(ir_res_path, 'w+') as dst_file:
        json.dump(copy_of_IR, dst_file, indent=4)

    with open(os.path.join(folder_for_this_contract, 'time_cost.json'), 'w+') as dst_file:
        json.dump(performce_record, dst_file)

    with open(os.path.join(folder_for_this_contract, 'smartIR.txt'), 'w+') as dst_file:
        dst_file.writelines(smartIR)


    intermediate_res_record = dict()
    intermediate_res_record['payment_transfer_sentences']  = []
    for s in payment_transfer_events:
        intermediate_res_record['payment_transfer_sentences'].append(s)

    intermediate_res_record['termination_transfer_sentences'] = []
    for s in termination_transfer_events:
        intermediate_res_record['termination_transfer_sentences'].append(s)

    with open(os.path.join(folder_for_this_contract, 'transfer_intermediate.json'), 'w+') as dst_file:
        json.dump(intermediate_res_record, dst_file)




def add_corresponding_constraints(class_info, res_dict, constraints):
    constraints_dict = res_dict[class_info]
    for k in constraints:
        if k not in constraints_dict:
            constraints_dict[k] = constraints[k]
        else:
            constraints_dict[k].union(constraints[k])


def output_classified_res(res_file_path, sentences):
    with open(res_file_path, 'w+') as dst_file:
        for s in sentences:
            dst_file.write(s + os.linesep)


def stanford_nlp_ner_processing(target_file_path, output_directory):
    subprocess.run(["java", "-Xmx8g", "-cp", "/home/pxf109/stanford-corenlp-4.2.0/*",
                    "edu.stanford.nlp.pipeline.StanfordCoreNLP",
                    "-annotators", "tokenize,ssplit,pos,lemma,ner", "-file", target_file_path, "-outputFormat", "json",
                    '-outputDirectory', str(output_directory)])


def stanford_nlp_ssplit_processing(target_file_path, case_res_folder):

    ssplit_folder = os.path.join(case_res_folder, "ssplit")
    if os.path.exists(ssplit_folder) is False:
        os.mkdir(ssplit_folder)
    subprocess.run(["java", "-Xmx8g", "-cp", "/home/pxf109/stanford-corenlp-4.2.0/*",
                    "edu.stanford.nlp.pipeline.StanfordCoreNLP",
                    "-annotators", "tokenize,ssplit", "-file", target_file_path, "-outputFormat", "text",
                    "-outputDirectory", str(ssplit_folder)])



def modify_payment_constraints(extracted_payment_constraints, transfer_events, copy_of_IR):
    money_ner_set = extracted_payment_constraints[0]
    highest_number = get_highest_price_from_money_ner_set(money_ner_set)
    copy_of_IR['Payments'][0]["PurchasePrice"] = highest_number

    duration_ner_set = extracted_payment_constraints[1]
    duration_constraints_for_payment = find_payment_duration_constraints(duration_ner_set)
    per_key_word = False                         # if this payment should pay every month, we will disable time constraints
    minimum_date = 1000000000000
    for d in duration_constraints_for_payment:
        idx1 = d.find("business day")
        if idx1 != -1:
            duration_constraint = d[0:idx1-1]
            number_constraints = w2n.word_to_num(duration_constraint)
            if number_constraints < minimum_date:
                minimum_date = number_constraints
            # copy_of_IR['Payment'][0]['TimeLimit']['rightOp'] = copy_of_IR['Payment'][0]['TimeLimit']['rightOp'] + "-" +duration_constraint
        else:
            idx2 = d.find("per")
            if idx2 != -1:
                per_key_word = True

    if per_key_word is False:
        copy_of_IR['Payments'][0]['TimeLimit']['disabled'] = False
        if minimum_date != 1000000000000:
            copy_of_IR['Payments'][0]['TimeLimit']['rightOp'] = copy_of_IR['Payment'][0]['TimeLimit']['rightOp'] + "-" +str(minimum_date)
    else:
        copy_of_IR['Payments'][0]['TimeLimit']['disabled'] = True


    # payment_transfer = copy_of_IR['Payment'][1]['Transfer']
    if len(transfer_events) > 0:
        copy_of_IR['Payments'][0]['Transfer'] = True
    else:
        copy_of_IR['Payments'][0]['Transfer'] = False


    copy_of_IR['Payments'][0]['From'] = copy_of_IR['BuyerName']
    copy_of_IR['Payments'][0]['To'] = copy_of_IR['SellerName']


def get_highest_price_from_money_ner_set(money_ner_set):
    '''

    :param money_ner_set:
    :return: highest price appear in the payment sentences
    Current limitaion: we may miss the true solution if the format like 150 million or 2000 thousand but to
    solve this we may have to rely on QA
    '''
    print("Money ner set: "+ str(money_ner_set))
    max = ""
    max_number = 0
    for k in money_ner_set:
        string_number = k
        print(k + " find res: " + str(k.find('$')))
        if k.find('$')!=-1:
            string_number = k[k.find("$")+1:]
            string_number = string_number.replace(",", "")
            print("String number: " + string_number)
            print("String number isdigit: " + str(string_number.isdigit()))
            if string_number.isdigit():
                cur_number = int(string_number.replace(",", ""))
                print("Current number: "+ str(cur_number))
                if cur_number > max_number:
                    max_number = cur_number
                    print("Current max number: "+ str(max_number))
                    max = k
            elif current_string_is_float(string_number):
                cur_number = float(string_number)
                if cur_number > max_number:
                    max_number = cur_number
                    print("Current max number: "+ str(max_number))
                    max = k
    return max_number


def find_payment_duration_constraints(duration_ner_set):
    res = set()

    for d in duration_ner_set:
        if d.find("prior") != -1:
            res.add(d)
        if d.find("per month") != -1:
            res.add(d)
    return res


def modify_transfer_constraints(transfer_events, copy_of_IR):
    if len(transfer_events)  == 0:
        copy_of_IR['Transfers'] =  False
    else:
        copy_of_IR['Transfers'] = True


def modify_termination_constraints(termination_constraints, termination_transfer_events, termination_date_qa,
                                   termination_file, copy_of_IR):
    date_constraints = termination_constraints[2]
    # if len(date_constraints) == 0 and len(termination_date_qa) == 0:
    #     copy_of_IR['Terminations']["OutOfDateTermination"] = False
    # else:
    #     copy_of_IR['Terminations']["OutOfDateTermination"] = True
    date_list = []
    effective_date = ""
    effective_date_list = copy_of_IR['EffectiveTime']
    print("Effective date list: "+ str(effective_date_list))
    if len(effective_date_list) > 0:
        effective_date_list[0] = check_and_modify_date(effective_date_list[0])
        if is_date(effective_date_list[0]):
            effective_date = parse(effective_date_list[0])

    for d in termination_date_qa:                             #termination date should be bigger than effective date
        print("Possible termination date: "+ d)
        d = check_and_modify_date(d)
        if is_date(d):
            cur_date = parse(d)
            if  effective_date == "" or cur_date > effective_date:
                print("Current date is bigger than effective date.")
                date_list.append(d)

    for d in date_constraints:
        print("Possible termination date: "+ d)
        d = check_and_modify_date(d)
        if is_date(d):
            cur_date = parse(d)
            if  effective_date == "" or cur_date > effective_date:
                print("Current date is bigger than effective date.")
                date_list.append(d)


    if len(date_list) == 0:
        copy_of_IR['Terminations']["OutOfDateTermination"] = False
    else:
        copy_of_IR['Terminations']["OutOfDateTermination"] = True

    if len(date_list) > 1:
        max_date = ""
        for d in date_list:
            if is_date(d):
                if max_date == "":
                    max_date = d
                else:
                    cur_date = parse(d)
                    max_date_obj = parse(max_date)
                    if cur_date > max_date_obj:
                        max_date = d
        date_list = []
        date_list.append(max_date)

    print("Final date list: " + str(date_list))
    copy_of_IR['OutSideClosingDate'] = date_list


    if len (termination_transfer_events) == 0:
        copy_of_IR['Terminations']['TransferTermination'] = False
    else:
        copy_of_IR['Terminations']['TransferTermination'] = True

    with open(termination_file, 'r') as src_file:
        lines = src_file.readlines()
        if len(lines) >3:
            copy_of_IR['Terminations']['OtherTermination'] = True



def is_date(string, fuzzy=False):
    """
    Return whether the string can be interpreted as a date.

    :param string: str, string to check for date
    :param fuzzy: bool, ignore unknown tokens in string if True
    """
    am_or_pm = -1
    tokens = string.split(" ")
    for idx, t in enumerate(tokens):
        if t == 'a.m.' or t == 'p.m.':
            am_or_pm = idx

    if am_or_pm != -1:
        if am_or_pm == len(tokens) -1:                                  # The input is time not date
            return False
        else:
            string = " ".join(tokens[am_or_pm+1:])

    if re.match(r'^-?\d+(?:\.\d+)$', string) is not None:
        return False                                         # The input is a float numeber

    if re.match(r'[-+]?[0-9]+', string) is not None:
        return False                                        #The input is a integer, it may be the year, but usually wrong

    try:
        parse(string, fuzzy=fuzzy)
        return True
    except ValueError or Exception:
        return False


def filter_potential_signed_entity_based_on_frequency(complete_entity, entity_file):
    count_map = dict()
    for l in complete_entity:
        for e in l:
            count_map[e] = 0
    with open(entity_file, 'r') as src_file:
        lines = src_file.readlines()
    # for k in count_map:
    #     search_res = re.search(k.rstrip())

    for k in count_map.keys():
        times = 0
        for l in lines:
            times += len(re.findall(k.strip(), l))
        count_map[k] = times

    sorted_map = sorted(count_map.items(), key=lambda kv: kv[1], reverse=True)
    if len(sorted_map) < 2:
        print ("The entity in contract is less than 2")
    else:
        return [sorted_map[0][0].strip(), sorted_map[1][0].strip()]


def modify_signed_entity(filtered_entity, copy_of_IR):
    copy_of_IR['SellerName'] = filtered_entity[0]
    copy_of_IR['BuyerName'] = filtered_entity[1]


def find_character_of_signed_entity(filtered_entity, entity_file):
    set_up_environment_variable()
    res = dict()
    with open(entity_file, 'r') as src_file:
        lines = src_file.readlines()
        pattern = "{pos:/NN.*/} >>appos {}=target"
        with CoreNLPClient(
                annotators=['tokenize','ssplit','pos','lemma','ner', 'parse', 'depparse'],
                timeout=30000,
                memory='16G') as client:
            for l in lines:
                if contains_all_entity(filtered_entity, l):
                    # return find_character_of_signed_entity_in_the_given_sentence(client, pattern, l, filtered_entity)
                    return find_character_based_on_regex(filtered_entity, l)

    for e in filtered_entity:
        res[e] = "None"
    return res


def contains_all_entity(entity_list, sentence):
    for e in entity_list:
        if sentence.find(e) == -1:
            return False

    return True


def find_character_of_signed_entity_in_the_given_sentence(client, pattern, l, entity_list):
    '''
    This rule based method is not very robust
    :param client:
    :param pattern:
    :param l:
    :param entity_list:
    :return:
    '''
    sem_res = client.semgrex(l, pattern)
    st = CoreNLPParser()
    sentences = sem_res['sentences']
    res_length = sentences[0]['length']
    tokens_in_sentence =  list(st.tokenize(l))
    entity_position_range = dict()
    for e in entity_list:
        entity_token = e.split(" ")
        update_entity_position(entity_token, entity_position_range, tokens_in_sentence)

    entity_to_character = dict()
    for idx  in range(res_length):
        cur_obj = sentences[0][str(idx)]
        s_text = cur_obj['text']
        s_position = (cur_obj['begin'], cur_obj['end'])
        for e in entity_position_range.keys():
            if s_position[0] >= entity_position_range[e][0] and s_position[1]<=entity_position_range[e][1]:
                s_target_obj = cur_obj['$target']
                s_target_text = s_target_obj['text']
                if e not in entity_to_character.keys():
                    entity_to_character[e] = [s_target_text, (s_target_obj['begin'], s_target_obj['end'])]
                else:
                    cur_dist = s_target_obj['begin'] - entity_position_range[e][1]
                    pre_dict = entity_to_character[e][1][0] - entity_position_range[e][1]
                    if cur_dist < pre_dict:
                        entity_to_character[e] = [s_target_text, (s_target_obj['begin'], s_target_obj['end'])]

    return entity_to_character


def find_character_based_on_regex(entity_list, sentence):
    pattern = "\(.*?\)"
    res = dict()
    for entity in entity_list:
        idx = sentence.index(entity)
        sub_string = sentence[idx:]
        character = re.search(pattern, sub_string).group(0)

        res[entity] = re.search("[A-Z][a-zA-z]+",character).group(0)
    return res

def update_entity_position(entity_token_arr, entity_position_range_map, token_in_sentence_arr):
    start_idx = token_in_sentence_arr.index(entity_token_arr[0])
    idx = 0
    start = start_idx
    while start_idx < len(token_in_sentence_arr) and idx < len(entity_token_arr) and entity_token_arr[idx] == token_in_sentence_arr[start_idx]:
        start_idx += 1
        idx += 1

    key = " ".join(entity_token_arr)
    entity_position_range_map[key] = (start, start_idx)


def check_qa_res_based_on_rule_res(qa_res_set, rule_res):
    if len(rule_res) == 0:
        return
    remove_set = set()
    for q in qa_res_set:
        substring = False
        for l in rule_res:
            for r in l:
                if q.find(r)!= -1 or r.find(q) != -1:           # qa res is not overlaped with rule based res
                    substring = True
                    break
        if substring is False:
            remove_set.add(q)
            # qa_res_set.remove(q)

    for q in remove_set:
        qa_res_set.remove(q)


def modify_seller_IR(seller_set, IR):
    seller_list = []
    seller_set_duplicate = set()            # sometimes same organization writing format is not same detect
    for s in seller_set:
        lower_s =  s.lower()
        if lower_s not in seller_set_duplicate:
            seller_list.append(s)
            seller_set_duplicate.add(lower_s)
    IR['SellerName'] = seller_list


def modify_buyer_IR(buyer_set, IR):
    buyer_list = []
    buyer_set_duplicate = set()
    for b in buyer_set:
        lower_b = b.lower()
        if lower_b not in buyer_set_duplicate:
            buyer_list.append(b)
            buyer_set_duplicate.add(lower_b)
    IR['BuyerName'] = buyer_list

def modify_effective_date(dates, IR):
    for d in dates:
        print(d)
    dates_list = []
    max_line = 100000
    for d in dates:
        date = d[0]
        line_number = d[1]
        if len(dates_list) == 0:
            max_line = line_number
            dates_list.append(date)
        else:
            if max_line > line_number:
                max_line = line_number
                dates_list.pop()
                dates_list.append(date)
        # dates_list.append(d)
        # if len(dates_list) > 1:
        #     break
    IR["EffectiveTime"] = dates_list


if __name__ == "__main__":
    contract_path = sys.argv[1]
    output_path = sys.argv[2]
    process_contract(contract_path, output_path)
