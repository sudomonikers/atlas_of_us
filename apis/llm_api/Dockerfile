FROM ghcr.io/ggml-org/llama.cpp:server

EXPOSE 8081

CMD ["--hf-repo", "Qwen/Qwen2.5-0.5B-Instruct-GGUF", "--hf-file", "qwen2.5-0.5b-instruct-q8_0.gguf", "--port", "8081", "--host", "0.0.0.0"]
