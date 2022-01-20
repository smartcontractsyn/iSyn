from nltk.corpus import wordnet
from nltk.corpus.reader import NOUN
from project_global_value import TRANSFER_WORDS, TRANSFER_SUBJ
import inflect
import json

def get_synonym(word_list):
    res_set = set()
    for w in word_list:
        for synset in wordnet.synsets(w):
            for l in synset.lemmas():
                res_set.add(l.name())
    return res_set


def get_synonym_subjection_for_transfer(word_list):
    final_res_single = set()
    engine = inflect.engine()
    for w in word_list:
        for sysnset in wordnet.synsets(w, NOUN):
            for l in sysnset.lemmas():
                    final_res_single.add(l.name())
    final_res_single_plural = set()
    for s in final_res_single:
        if s.find("_")!= -1:
            final_res_single_plural.add(s)
            continue
        plural = engine.plural(s)
        final_res_single_plural.add(plural)
        final_res_single_plural.add(s)


    return final_res_single_plural




def detect_transfer_event(ner_file):
    with open(ner_file, 'r') as src_file:
        json_res = json.load(src_file)

    sentences_obj = json_res['sentences']
    synonym_words = get_synonym(TRANSFER_WORDS)
    res_set = set()
    for idx, sent in enumerate(sentences_obj):
        tokens_obj = sent['tokens']
        for t in tokens_obj:
            if 'pos' in t and t['pos'].find('VB') != -1:
                lemma_verb =  t['lemma']
                if lemma_verb in synonym_words:
                    currnet_sent = construct_current_sentence(sent)
                    res_set.add(currnet_sent)

    return res_set


def detect_transfer_event_for_payment(ner_file):
    with open(ner_file, 'r') as src_file:
        json_res = json.load(src_file)

    sentences_obj = json_res['sentences']
    synonym_words = get_synonym_subjection_for_transfer(TRANSFER_SUBJ)
    synonym_words_verb = get_synonym(TRANSFER_WORDS)
    res_set = set()
    engine = inflect.engine()
    for idx, sent in enumerate(sentences_obj):
        tokens_obj = sent['tokens']
        n_syn = False
        v_syn = False
        for t in tokens_obj:
            if 'pos' in t and t['pos'].find('NN') != -1:
                lemma_noun =  t['lemma'].lower()
                if t['pos'] == 'NNS':
                    lemma_noun = engine.singular_noun(lemma_noun)
                if lemma_noun in synonym_words:
                    n_syn = True
            if 'pos' in t and t['pos'].find('VB') != -1:
                lemma_verb =  t['lemma']
                if lemma_verb in synonym_words_verb:
                    v_syn = True
        if n_syn and v_syn:
            current_sent = construct_current_sentence(sent)
            res_set.add(current_sent)

    return res_set


def detect_transfer_event_for_termination(ner_file):
    with open(ner_file, 'r') as src_file:
        json_res = json.load(src_file)

    sentences_obj = json_res['sentences']
    synonym_words = get_synonym_subjection_for_transfer(TRANSFER_SUBJ)
    synonym_words_verb = get_synonym(TRANSFER_WORDS)
    res_set = set()
    engine = inflect.engine()
    for idx, sent in enumerate(sentences_obj):
        tokens_obj = sent['tokens']
        n_syn = False
        v_syn = False
        for t in tokens_obj:
            if 'pos' in t and t['pos'].find('NN') != -1:
                lemma_noun =  t['lemma'].lower()
                if t['pos'] == 'NNS':
                    lemma_noun = engine.singular_noun(lemma_noun)
                if lemma_noun in synonym_words:
                    n_syn = True
                    # currnet_sent = construct_current_sentence(sent)
                    # res_set.add(currnet_sent)
                if detect_nn_can_be_taken_as_verb(lemma_noun):
                    v_syn = True
            if 'pos' in t and t['pos'].find('VB') != -1:
                lemma_verb =  t['lemma']
                if lemma_verb in synonym_words_verb:
                    v_syn = True
                    # currnet_sent = construct_current_sentence(sent)
                    # res_set.add(currnet_sent)
        if n_syn and v_syn:
            current_sent = construct_current_sentence(sent)
            res_set.add(current_sent)

    return res_set


def construct_current_sentence(sent_json_obj):
    tokens = sent_json_obj['tokens']
    token_list = []
    for t in tokens:
        token_list.append(t['lemma'])
    return " ".join(token_list)


def detect_nn_can_be_taken_as_verb(string):
    target_set = {'writing'}
    return string in target_set

