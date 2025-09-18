-- Similarity search function for RAG (ChatGPT plan requirement)
CREATE OR REPLACE FUNCTION match_notes(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    n.id,
    n.content,
    1 - (ne.embedding <=> query_embedding) AS similarity
  FROM notes n
  JOIN note_embeddings ne ON n.id = ne.note_id
  WHERE 1 - (ne.embedding <=> query_embedding) > match_threshold
  ORDER BY ne.embedding <=> query_embedding
  LIMIT match_count;
$$;