import os
import json
import numpy as np
from typing import List
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.config import settings

client = AsyncOpenAI(api_key=settings.openai_api_key)

async def get_embedding(text_content: str) -> List[float]:
    try:
        response = await client.embeddings.create(
            model="text-embedding-ada-002",
            input=text_content[:8000],
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Embedding error: {e}")
        return []

async def store_document_embedding(
    db: AsyncSession,
    user_id: str,
    document_id: str,
    content: str,
    metadata: dict = {},
):
    try:
        embedding = await get_embedding(content)
        if not embedding:
            return False

        embedding_str = '[' + ','.join(str(x) for x in embedding) + ']'

        await db.execute(
            text("""
                INSERT INTO document_embeddings (user_id, document_id, content, embedding, metadata)
                VALUES (:user_id, :document_id, :content, CAST(:embedding AS vector), :metadata)
                ON CONFLICT DO NOTHING
            """),
            {
                "user_id":     user_id,
                "document_id": document_id,
                "content":     content,
                "embedding":   embedding_str,
                "metadata":    json.dumps(metadata),
            }
        )
        await db.commit()
        return True
    except Exception as e:
        print(f"Store embedding error: {e}")
        return False

async def search_similar_documents(
    db: AsyncSession,
    user_id: str,
    query: str,
    limit: int = 5,
) -> List[dict]:
    try:
        query_embedding = await get_embedding(query)
        if not query_embedding:
            return []

        embedding_str = '[' + ','.join(str(x) for x in query_embedding) + ']'

        result = await db.execute(
            text("""
                SELECT
                    de.content,
                    de.metadata,
                    de.document_id,
                    1 - (de.embedding <=> CAST(:embedding AS vector)) AS similarity
                FROM document_embeddings de
                WHERE de.user_id = :user_id
                WHERE 1 - (de.embedding <=> CAST(:embedding AS vector)) > 0.7
                ORDER BY de.embedding <=> CAST(:embedding AS vector)
                LIMIT :limit
            """),
            {
                "user_id":   user_id,
                "embedding": embedding_str,
                "limit":     limit,
            }
        )
        rows = result.mappings().all()
        return [dict(r) for r in rows]
    except Exception as e:
        print(f"Search embedding error: {e}")
        return []

async def find_duplicate_documents(
    db: AsyncSession,
    user_id: str,
    threshold: float = 0.95,
) -> List[dict]:
    try:
        result = await db.execute(
            text("""
                SELECT
                    a.document_id as doc1_id,
                    b.document_id as doc2_id,
                    a.content as doc1_content,
                    b.content as doc2_content,
                    1 - (a.embedding <=> b.embedding) AS similarity
                FROM document_embeddings a
                JOIN document_embeddings b
                    ON a.user_id = b.user_id
                    AND a.document_id < b.document_id
                WHERE a.user_id = :user_id
                    AND 1 - (a.embedding <=> b.embedding) > :threshold
                ORDER BY similarity DESC
                LIMIT 10
            """),
            {"user_id": user_id, "threshold": threshold}
        )
        rows = result.mappings().all()
        return [dict(r) for r in rows]
    except Exception as e:
        print(f"Duplicate search error: {e}")
        return []
