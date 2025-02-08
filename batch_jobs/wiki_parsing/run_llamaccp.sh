text=$(cat knowledge_base_info.txt)

llama-server \
    --hf-repo bartowski/Qwen2.5-7B-Instruct-1M-GGUF \
    --mlock	