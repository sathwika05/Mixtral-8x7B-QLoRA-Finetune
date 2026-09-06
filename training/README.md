# Training and deployment sources

The notebooks and scripts that produced the adapter this application serves.

| File | What it does |
|---|---|
| `LLMNotebook.ipynb` | Prepares Dolly 15K and launches the QLoRA fine-tuning job on SageMaker |
| `DeploymentNotebook.ipynb` | Packages the adapter and deploys it to a SageMaker endpoint |
| `scripts/run_clm.py` | Training entry point executed inside the training container |
| `scripts/requirements.txt` | Container dependencies |

## Placeholders

Account-specific identifiers were replaced before these files entered the
repository. Substitute your own values to run them:

| Placeholder | Replace with |
|---|---|
| `<AWS_ACCOUNT_ID>` | Your 12-digit AWS account id |
| `<SAGEMAKER_EXECUTION_ROLE_ARN>` | The execution role the job assumes |
| `<SAGEMAKER_DEFAULT_BUCKET>` | Your SageMaker default bucket |
| `<DATASET_BUCKET>` | The bucket holding the processed dataset |
| `<HUGGING_FACE_TOKEN>` | A Hugging Face access token with read access to the base model |

The saved output cells were kept, because they are part of the record of the
run — they were sanitized with the same substitutions.
