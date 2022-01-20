import re


def get_number_of_tokens(sentence):
    tokens = re.split("\s+", sentence)
    return len(tokens)