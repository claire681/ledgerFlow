import uuid
import boto3
from botocore.exceptions import ClientError
from app.core.config import settings

s3 = boto3.client(
    "s3",
    region_name=settings.aws_region,
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key,
)


def upload_document(file_bytes: bytes, filename: str, user_id: str) -> str:
    """Upload file to S3 and return the S3 key."""
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
    key = f"documents/{user_id}/{uuid.uuid4()}.{ext}"
    s3.put_object(
        Bucket=settings.s3_bucket_name,
        Key=key,
        Body=file_bytes,
        ContentType=_content_type(ext),
    )
    return key


def get_presigned_url(s3_key: str, expires: int = 3600) -> str:
    """Generate a temporary download URL."""
    try:
        return s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.s3_bucket_name, "Key": s3_key},
            ExpiresIn=expires,
        )
    except ClientError:
        return ""


def delete_document(s3_key: str):
    """Remove a document from S3."""
    s3.delete_object(
        Bucket=settings.s3_bucket_name,
        Key=s3_key,
    )


def _content_type(ext: str) -> str:
    return {
        "pdf":  "application/pdf",
        "csv":  "text/csv",
        "png":  "image/png",
        "jpg":  "image/jpeg",
        "jpeg": "image/jpeg",
    }.get(ext.lower(), "application/octet-stream")