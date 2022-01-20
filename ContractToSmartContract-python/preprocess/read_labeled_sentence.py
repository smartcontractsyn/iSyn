import pandas
import string
from nltk.tokenize import word_tokenize
from nltk.stem.snowball import SnowballStemmer
from nltk.corpus import stopwords
from preprocess.utils import get_number_of_tokens


def read_data_from_google_csv(path, preprocess_args):
    '''
    The format of this csv: the first line is url of the legal contract, the other column is the sentence can be used for
    training
    :param path: the path of csv file contains ground truth
    :return: list of raw sentences
    '''
    if 'stem' in preprocess_args and preprocess_args['stem'] == True:
        stemmer = SnowballStemmer('english')

    if "remove_stop" in preprocess_args and preprocess_args['remove_stop'] == True:
        stop_words = set(stopwords.words('english'))


    dataframe = pandas.read_csv(path, header=None, skip_blank_lines=True)
    columns = dataframe.shape[1]
    sentences = []
    for i in range(1, columns):
        cur_column = dataframe[i]
        for j in range(len(cur_column)):
            if pandas.notna(cur_column[j]):
                if len(preprocess_args) == 0:
                    sentences.append(cur_column[j])
                else:
                    token = word_tokenize(cur_column[j])
                    help_token = []
                    if preprocess_args['remove_punctuation'] == True:
                        for i in range(len(token)):
                            if token[i].isalpha():
                                help_token.append(token[i])
                        token = help_token
                        help_token = []
                    if 'stem' in preprocess_args and preprocess_args['stem'] == True:
                        for t in token:
                            help_token.append(stemmer.stem(t))
                        token = help_token
                        help_token = []
                    if "remove_stop" in preprocess_args and preprocess_args['remove_stop'] == True:
                        for t in token:
                            if t not in stop_words:
                                help_token.append(t)
                        token = help_token
                        help_token = []
                    processed_sentence = " ".join(token)
                    sentences.append(processed_sentence)

    return sentences


if __name__ == "__main__":
    path = "/home/pxf109/ContractToSmartContract-python/data/test/Contracts Ground Truth - payment-2.csv"
    preprocess_args = {"remove_punctuation": True}
    preprocess_args['stem'] = True
    preprocess_args['remove_stop'] = True
    sentences = read_data_from_google_csv(path,preprocess_args)
    for s in sentences:
        print(s)