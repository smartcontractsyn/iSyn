from simpletransformers.question_answering import QuestionAnsweringModel, QuestionAnsweringArgs
import logging
import json


# take data_set and percentage, return test and eval sets
def data_split(data_set, percentage):
    limit = round(len(data_set) * percentage)
    return data_set[:limit], data_set[limit:]


def train_data(input_file_path, output_file_path):
    logging.basicConfig(level=logging.INFO)
    transformers_logger = logging.getLogger("transformers")
    transformers_logger.setLevel(logging.WARNING)

    with open(input_file_path) as json_file:
        data = json.load(json_file)

    model_args = QuestionAnsweringArgs()
    # add args if needed here
    # e.g. model_args.evaluate_during_training = True

    model = QuestionAnsweringModel(
        "roberta",
        "roberta-base",
        use_cuda=False,
        args=model_args
    )

    # use 80% as the training_data
    training_data, eval_data = data_split(data, 0.8)
    model.train_model(training_data, output_file_path)
    result, model_outputs = model.eval_model(eval_data, output_file_path)
    # print(result)
    prediction_test(model)
    return model


# do prediction on one context
def prediction_test(model):
    context_text = "During the Executive's employment, for all services rendered by the Executive, the Company shall pay " \
                   "the Executive a fixed annual salary of $325,000 less applicable deductions. "

    predictions, raw_outputs = model.predict(
        [
            {
                "context": context_text,
                "qas": [
                    {
                        "question": "How much does the payer need to pay?",
                        "id": "103931",
                    }
                ],
            }
        ]
    )
    # $325,000
    print(predictions)
    print(raw_outputs)


input_file_path = "QA_NewDataSample.json"
output_file_path = "~/Desktop/Contract/output8"

train_data(input_file_path, output_file_path)
