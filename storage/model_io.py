import boto3
from urllib.parse import urlparse

s3 = boto3.client("s3")

def upload_model(local_path: str, s3_uri: str):
    """
    Upload a local model file (pkl) to S3
    """
    parsed = urlparse(s3_uri)
    bucket = parsed.netloc
    key = parsed.path.lstrip("/")

    s3.upload_file(local_path, bucket, key)


def download_model(s3_uri: str, local_path: str):
    """
    Download a model file (pkl) from S3
    """
    parsed = urlparse(s3_uri)
    bucket = parsed.netloc
    key = parsed.path.lstrip("/")

    s3.download_file(bucket, key, local_path)
