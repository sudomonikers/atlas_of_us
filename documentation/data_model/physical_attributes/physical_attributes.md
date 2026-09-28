# Physical Attributes Graph
A person's physical body is an important part about who they are. It affects their capabilities in terms of Skills they can have and Ideas they can understand, as well as influences their PersonalityTraits. The Physical Attributes graph is more than just skin, muscle, and bone. It is the entirety of you from your nervous system to your limbic sytem to more abstract things like 'reaction time' and other diseases you may have. This particular graph is interesting in that it is extremely large and complex, but also mostly known and seeded. While it does change it doesn't change much over time. The following are covered:

1. Body Structure - seeded from Uberon
2. Measurements - custom developed
3. Conditions - seeded from Mondo/HPO

For Body Structure, we have gone ahead and seeded an entire human body's physical makeup into the database as graph. A huge mapping of human conditions (diseases and the like) have also been seeded and linked to the different structures they affect. Finally, the measurements are the actual interesting thing that most Persons will be interested in. That list has been compiled together by hand, and linked to various structures and conditions also by hand.

The shape of each Measurement looks like this:
```cypher
(hec:PhysicalMeasurement {name: "Hand-Eye Coordination", description: "The ability to use your eyes to process visual information and guide your hands to perform a precise task", vector: [1, 2, 3]})
```

Most of the interesting information here is contained in the Persons relationship with the Measurement. For example:
```cypher
(a:Person)-[:HAS_MEASUREMENT {amount: 0.9}]-(hec:PhysicalMeasurement);
```
Here the amount is a float between 0 and 1 with 1 being extremely high and 0 being essentially no hand eye coordination at all.

How Persons interact with the Body Structure and Conditions nodes will be filled out later.
