FROM ghcr.io/ggml-org/llama.cpp:server

EXPOSE 8080

CMD ["--hf-repo", "Qwen/Qwen3-Embedding-0.6B", "--hf-file", "all-minilm-l6-v2-q8_0.gguf", "--embeddings", "--port", "8080", "--host", "0.0.0.0"]
