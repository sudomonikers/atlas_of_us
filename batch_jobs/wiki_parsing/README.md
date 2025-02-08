Here we make heavy use of the llama.cpp cli server to run inference on a model.

First we have to get the llama.cpp server running
```
llama-server --hf-repo microsoft/Phi-3-mini-4k-instruct-gguf --hf-file Phi-3-mini-4k-instruct-q4.gguf -p  
```