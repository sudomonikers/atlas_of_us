We want to test the personality scoring loop with these scenes and scoring job.

Take a look at the scenes in this folder. Play through each of them (by hitting the /answers endpoint with curl, not by using playwright or something like that). 

use the following user (my own, no need to worry about tokens): 
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI0OjJiNjA3ZDVkLTkyNTAtNGNmYS1hYWUzLWM1NmIxODlmNDk3YToyMjUiLCJpYXQiOjE3OTIwMTk5OTMsImV4cCI6MTc5MjEwNjM5M30.5cl34XgRpxYcPgiQkVZgrqBZmsZqppy2gCgCBBRSJqI

We will do a QA of the personality module in the following manner:
1. write a personality.md script for scores you are intending to hit. write one file, if there are already existing files, take a look at what those intended scores were, and come up with a different personality for this round.
2. Once you have an intended personality (Written to this directory) hit each endpoint with answers that you think someone with that personality would answer with.
   Write the answers to personality_round_N_answers.mjs (copy the shape of an existing round), then run them with
   `node src/personality/testing/play.mjs src/personality/testing/personality_round_N_answers.mjs` from the ui folder. Name scenes after it to play only those.
3. Once all scenarios are played through, take a look at the users final scores and compare how they match what you intended. (you will have to wait for the batch job to complete). Write the output to the same file.
4. Finally, do an analysis of how/why the scores were off. Do not make any changes, we are just testing right now.