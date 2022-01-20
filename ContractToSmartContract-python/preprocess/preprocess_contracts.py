import docx
from transformers import AutoTokenizer

def read_text_form_doct(file_path):
    document = docx.Document(file_path)
    fullText = []
    for para in document.paragraphs:
        fullText.append(para.text)
    return fullText

def process_text(text_list):
    res = []

def get_tokenizer(model_name):
    '''
    if you plan on using a pretrained model, it’s important to use the associated pretrained tokenizer:
    it will split the text you give it in tokens the same way for the pretraining corpus,
    and it will use the same correspondence token to index (that we usually call a vocab) as during pretraining
    :param model_name:
    :return: tokenizer
    '''
    return AutoTokenizer.from_pretrained(model_name)


if __name__ == '__main__':
    path = r"/home/pfang/PycharmProjects/ContractToSmartContract-python/data/test/Law_Insider__Information-services-agreement_Filed_30-01-2021_Contract.docx"
    texts = read_text_form_doct(path)
    tokenizer = get_tokenizer('bert-base-cased')
    for t in texts:
        print(t)
        encoded_input = tokenizer(t)
        print(encoded_input)

