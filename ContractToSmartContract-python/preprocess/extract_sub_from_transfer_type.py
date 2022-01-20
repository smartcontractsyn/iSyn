import spacy
from read_labeled_sentence import read_data_from_google_csv

en_nlp = spacy.load('en_core_web_trf')
def get_nsubj_from_transfer_type(sentence):
    nsubj_set = set()
    sent_obj = en_nlp(sentence)
    sent_res = next(sent_obj.sents)

    for word in sent_res:
        if word.dep_ == 'nsubj':
            nsubj_set.add(word)

    return nsubj_set


if __name__ == "__main__":
    path = '/home/pxf109/ContractToSmartContract-python/data/4-16/Contracts Ground Truth - transfer-2.csv'
    sentences = read_data_from_google_csv(path, dict())
    for s in sentences:
        sub_set = get_nsubj_from_transfer_type(s)
        print(sub_set)
