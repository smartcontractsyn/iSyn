import json
from utils import word_counts_for_sentences

def extract_ner_specific_ner_tag(ner_file_path):
    with open(ner_file_path, 'r') as src_file:
        json_res =  json.load(src_file)

    sentences = json_res['sentences']

    money_ner_set = dict()
    duration_ner_set = dict()
    date_ner_set = dict()

    for idx, s in enumerate(sentences):
        if 'entitymentions' in s:
            entities = s['entitymentions']
            current_sentences = construct_current_sentence(sentences[idx])
            for e in entities:
                ner_val = e['ner']
                if ner_val == 'MONEY':
                    text = e['text']
                    if text not in money_ner_set.keys():
                        money_ner_set[text] = set()
                    money_ner_set[text].add(current_sentences)
                if ner_val == 'DURATION':
                    time_constraints = find_possible_time_constraints(sentences[idx])
                    if time_constraints not in duration_ner_set.keys():
                        duration_ner_set[time_constraints] = set()
                    duration_ner_set[time_constraints].add(current_sentences)
                if ner_val == 'DATE':
                    text = e['text']
                    if text not in date_ner_set.keys():
                        date_ner_set[text] = set()
                    date_ner_set[text].add(current_sentences)
    return (money_ner_set, duration_ner_set, date_ner_set)


def extract_ner_specific_ner_tag_for_rule_based(ner_file_path):
    with open(ner_file_path, 'r') as src_file:
        json_res =  json.load(src_file)

    sentences = json_res['sentences']

    money_ner_set = dict()
    duration_ner_set = dict()
    date_ner_set = dict()
    organisation_ner_set = dict()

    for idx, s in enumerate(sentences):
        if 'entitymentions' in s:
            entities = s['entitymentions']
            current_sentences = construct_current_sentence(sentences[idx])
            for e in entities:
                ner_val = e['ner']
                if ner_val == 'MONEY':
                    text = e['text']
                    if text not in money_ner_set.keys():
                        money_ner_set[text] = set()
                    money_ner_set[text].add(current_sentences)
                if ner_val == 'DURATION':
                    time_constraints = find_possible_time_constraints(sentences[idx])
                    if time_constraints not in duration_ner_set.keys():
                        duration_ner_set[time_constraints] = set()
                    duration_ner_set[time_constraints].add(current_sentences)
                if ner_val == 'DATE':
                    text = e['text']
                    if text not in date_ner_set.keys():
                        date_ner_set[text] = set()
                    date_ner_set[text].add(current_sentences)
                if ner_val == 'ORGANIZATION' or ner_val == 'PERSON':
                    text = e['text']
                    if text not in organisation_ner_set.keys():
                        date_ner_set[text] = set()
                    organisation_ner_set[text].add(current_sentences)

    return (money_ner_set, duration_ner_set, date_ner_set, organisation_ner_set)


def construct_current_sentence(sent_json_obj):
    tokens = sent_json_obj['tokens']
    token_list = []
    for t in tokens:
        token_list.append(t['lemma'])
    return " ".join(token_list)


def construct_current_sentence_with_raw_text(sent_json_obj):
    tokens = sent_json_obj['tokens']
    token_list = []
    for t in tokens:
        token_list.append(t['originalText'])
    return " ".join(token_list)


def find_possible_time_constraints(sent_json_obj):
    tokens = sent_json_obj['tokens']
    idx_duration = find_idx_of_duration(tokens)
    if idx_duration == -1 :
        return ""
    seach_idx = idx_duration
    res = []
    per_bool = False

    while seach_idx >=0:
        cur_t = tokens[seach_idx]
        if cur_t['ner'] == 'NUMBER':
            res.insert(0, cur_t['lemma'])
            break
        if 'word' in cur_t and cur_t['word'] == 'per':
            if 'text' in cur_t:
                res.insert(0, cur_t['text'])
            elif 'originalText' in cur_t:
                res.insert(0, cur_t['originalText'])
            per_bool = True
            break
        res.insert(0, cur_t['lemma'])
        seach_idx = seach_idx - 1

    pre_part = " ".join(res)
    if per_bool is True:
        return pre_part

    seach_idx = idx_duration + 1
    res = []
    while seach_idx < len(tokens):
        cur_t = tokens[seach_idx]
        cur_text = cur_t['word']
        if cur_text == ',' or cur_text == '.' or cur_text == ')':
            break
        res.append(cur_text)
        seach_idx += 1

    later_part = " ".join(res)
    res = pre_part +" "+later_part
    return res


def find_idx_of_duration(token_list):
    for idx, t in enumerate(token_list):
        ner_val = t['ner']
        if ner_val == 'DURATION' and 'lemma' in t and t['lemma'] == 'day':
            return idx
    return -1


def extract_signed_entity_from_ner_file(ner_file_path, key_words_for_signed_contract):
    '''

    :param ner_file_path:
    :param key_words_for_signed_contract: patten search result about signed entities
    :return: signed entites, may contains more orgnization
    '''
    res = []
    with open(ner_file_path, 'r') as src_file:
        ner_file_obj = json.load(src_file)
        sentences = ner_file_obj['sentences']
        for idx, s in enumerate(sentences):
            cur_sentences =  construct_current_sentence_with_raw_text(s)
            if contains_all_key_words(cur_sentences, key_words_for_signed_contract):
                # this sentence contains predefined pattern
                signed_entity = find_signed_entities(s, key_words_for_signed_contract)
                res.append(signed_entity)

        if len(res) == 0:  # if this sentence contains two (orgnization, person or MISC), we will collect them
            for idx, s in enumerate(sentences):
                find_possible_missed_entities(s, res)


    print(res)
    return res


def contains_all_key_words(cur_sentences, key_words_for_signed_contract):

    for finded_patten in key_words_for_signed_contract:
        length = finded_patten['length']
        key_words_count = dict()
        for i in range(length):
            cur_res = finded_patten[str(i)]
            for k in cur_res:
                if k == 'text':
                    if cur_res[k] not in key_words_count.keys():
                        key_words_count[cur_res[k]] = set()
                    position = (cur_res['begin'], cur_res['end'])
                    key_words_count[cur_res[k]].add(position)
                if isinstance(cur_res[k],dict) is True:
                    for k2 in cur_res[k].keys():
                        if k2 == 'text':
                            if cur_res[k][k2] not in key_words_count.keys():
                                key_words_count[cur_res[k][k2]] = set()
                            position = (cur_res[k]['begin'], cur_res[k]['end'])
                            key_words_count[cur_res[k][k2]].add(position)
        words_count = word_counts_for_sentences(cur_sentences)
        has_all = True
        for k in key_words_count.keys():
            counts = len(key_words_count[k])
            if k not in words_count or words_count[k] < counts:
                has_all = False
                break
        if has_all:
            return True

    return False


def find_signed_entities(sent_obj, key_words_for_signed_contract):
    res = []
    entity_mentions = sent_obj['entitymentions']
    for finded_patten in key_words_for_signed_contract:
        length = finded_patten['length']
        key_words_count = dict()
        for i in range(length):
            cur_res = finded_patten[str(i)]
            for k in cur_res:
                if k == 'text':
                    if cur_res[k] not in key_words_count.keys():
                        key_words_count[cur_res[k]] = set()
                    position = (cur_res['begin'], cur_res['end'])
                    key_words_count[cur_res[k]].add(position)
                if isinstance(cur_res[k],dict) is True:
                    for k2 in cur_res[k].keys():
                        if k2 == 'text':
                            if cur_res[k][k2] not in key_words_count.keys():
                                key_words_count[cur_res[k][k2]] = set()
                            position = (cur_res[k]['begin'], cur_res[k]['end'])
                            key_words_count[cur_res[k][k2]].add(position)
        for e in entity_mentions:
            entity_text = e['text']
            tokens = entity_text.split(" ")
            for t in tokens:
                if t in key_words_count.keys():
                    res.append(entity_text)
                    key_words_count[t].pop()
                    if len(key_words_count[t]) == 0:
                        del key_words_count[t]

        if len(key_words_count.keys()) > 0:
            left_entity = find_left_entity(sent_obj, key_words_count)
            for l in left_entity:
                res.append(l)


    return res


def find_left_entity(sent_obj, key_word_count):
    tokens = sent_obj['tokens']
    res = []
    for idx, t in enumerate(tokens):
        pos_tag = t['pos']
        if pos_tag.find("NN") == -1:
            continue
        original_text = t['originalText']
        if original_text in key_word_count.keys():
            nn_entity = find_nn_words_from_given_position(tokens, idx)
            res.append(nn_entity)

    return res


def find_nn_words_from_given_position(token_obj, idx):
    left = idx
    right = idx+1
    left_parts = []
    right_parts = []
    while left > 0:
        cur_t = token_obj[left]
        if cur_t['pos'].find('NN') == -1:
            break
        left_parts.insert(0, cur_t['originalText'])
        left -= 1

    while right < len(token_obj):
        cur_t = token_obj[right]
        if cur_t['pos'].find('NN') == -1:
            break
        right_parts.append(cur_t['originalText'])
        right += 1

    return " ".join(left_parts) + " " + " ".join(right_parts)



def find_possible_missed_entities(sent_obj, res_list):
    '''

    :param sent_obj: ner result sentence object
    :param res_list: result list
    :return: none
    '''

    entityMentions = sent_obj['entitymentions']
    contains_two = 0

    for e in entityMentions:
        if e['ner'] == "ORGANIZATION" or e['ner'] == "MISC" or e['ner'] == "PERSON":
            contains_two += 1

    if contains_two < 2:
        return
    sub_res = []
    for e in entityMentions:
        if e['ner'] == "ORGANIZATION" or e['ner'] == "MISC" or e['ner'] == "PERSON":
            sub_res.append(e['text'])

    res_list.append(sub_res)

