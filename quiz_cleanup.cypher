// removes the questions the first test runs of TopicFillRequested-Quiz wrote on Chess, Pinyin and Accounting, which
// had a wrong answer, an ambiguous one and a choice written twice, so the handler can write them again
MATCH (t:Topic)-[:HAS_LEVEL]->(:BloomLevel)<-[:TESTS]-(q:QuizQuestion)
WHERE t.id IN ["f0115cf1-bd47-4dd7-b69e-c3b2eb0c4bd3", "c1e5ed98-c6db-46e5-8535-43308749148a", "a249893c-da74-407c-9961-8947e43e6dd2"]
DETACH DELETE q;
