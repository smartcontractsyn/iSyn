import stanza
from stanza.server import CoreNLPClient
import stanza.server.semgrex as semgrex
import os
from utils import set_up_environment_variable




def extract_participants_for_contract(file):
    set_up_environment_variable()
    res = []
    # nlp = stanza.Pipeline("en", processors="tokenize,pos,lemma,depparse")
    with open(file, 'r') as src_file:
        sentences = src_file.readlines()

        with CoreNLPClient(
                annotators=['tokenize','ssplit','pos','lemma','ner', 'parse', 'depparse'],
                timeout=30000,
                memory='16G') as client:
            pattern = '{pos:/VB.*/} >> /nmod:between/ {}=org'
            pattern2 = '{pos:/VB.*/} >/obl:agent/ {}=org'
            pattern3 = '{pos:/VB.*/} >>/nmod:among/ {}=org'
            # If there is no rule find for given sentence, if there are two orgnizations is also a candidate
            for s in sentences:
                add_corresponding_pattern(s, pattern, client, res)
                add_corresponding_pattern(s, pattern2, client, res)
                add_corresponding_pattern(s, pattern3, client, res)

    return res


def add_corresponding_pattern(text, pattern, client, res_list):
    try:
        semgrex_results = client.semgrex(text, pattern)
        for k in semgrex_results:
            for cur in semgrex_results[k]:
                if cur['length']  <2:
                    continue
                res_list.append(cur)
    except Exception:
        print("Standord nlp has server error!")
        return

