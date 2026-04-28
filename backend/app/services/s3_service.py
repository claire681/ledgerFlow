import boto3
import uuid
import traceback
from pathlib import Path
from app.core.config import settings

s3_client = boto3.client(
    's3',
    aws_access_key_id     = settings.aws_access_key_id,
    aws_secret_access_key = settings.aws_secret_access_key,
    region_name           = settings.aws_region,
)

BUCKET = settings.s3_bucket_name


def upload_file_to_s3(
    file_bytes: bytes,
    filename:   str,
    folder:     str = "documents",
    content_type: str = "application/octet-stream",
) -> str:
    """
    Uploads a file to S3 and returns the S3 key.
    Returns the S3 key like: documents/uuid-filename.pdf
    """
    ext      = Path(filename).suffix.lower()
    s3_key   = f"{folder}/{uuid.uuid4()}{ext}"

    try:
        s3_client.put_object(
            Bucket      = BUCKET,
            Key         = s3_key,
            Body        = file_bytes,
            ContentType = content_type,
        )
        
        return s3_key
    except Exception as e:
        print(f"S3 upload error: {traceback.format_exc()}")
        raise Exception(f"Failed to upload to S3: {str(e)}")


def download_file_from_s3(s3_key: str) -> bytes:
    """Downloads a file from S3 and returns the bytes."""
    try:
        response = s3_client.get_object(Bucket=BUCKET, Key=s3_key)
        return response['Body'].read()
    except Exception as e:
        print(f"S3 download error: {traceback.format_exc()}")
        raise Exception(f"Failed to download from S3: {str(e)}")


def delete_file_from_s3(s3_key: str) -> bool:
    """Deletes a file from S3."""
    try:
        s3_client.delete_object(Bucket=BUCKET, Key=s3_key)
        return True
    except Exception as e:
        print(f"S3 delete error: {traceback.format_exc()}")
        return False


def get_presigned_url(s3_key: str, expiry: int = 3600) -> str:
    """
    Generates a temporary URL to access a file.
    Default expiry is 1 hour.
    """
    try:
        url = s3_client.generate_presigned_url(
            'get_object',
            Params     = {'Bucket': BUCKET, 'Key': s3_key},
            ExpiresIn  = expiry,
        )
        return url
    except Exception as e:
        print(f"S3 presigned URL error: {traceback.format_exc()}")
        raise Exception(f"Failed to generate URL: {str(e)}")


def file_exists_in_s3(s3_key: str) -> bool:
    """Checks if a file exists in S3."""
    try:
        s3_client.head_object(Bucket=BUCKET, Key=s3_key)
        return True
    except Exception:
        return False