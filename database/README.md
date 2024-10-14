The Atlas Of Us is, in essence, just a database. Specifically a Graph Database (using Neo4j) used to contain a knowledge graph. The history of the changes to the database lives in these files and in github, and in fact changes are only made to the actual database when a branch is merged.

There are three 'layers' to the graph database, with layer 1 only changing with a merge to the repo. 

EXPLAIN THOSE THREE LAYERS



HOW TO UPDATE THE DATABASE
All nodes are unique on the 'name' property, and when creating a change to a node you are to only use the MERGE clause and query by the name, and set any additional things using SET for example:
```
MERGE (n:l1Domain { name: 'Body'})
SET n.description = 'example'
```
We do this because nodes may be used in multiple different files, so even if you do not see it, a node may already exist and we do not want to be to specific when we match nodes. 

While all the queries are layed out in a tree like file structure in this repo, it is important to remember this graph database is NOT a tree, but a full graph. This means you may find nodes referenced in multiple different files here. HOWEVER, when a node is mentioned in a certain file, it will only be referenced for its properties relating to context of that domain/file/tree. For example: Basketball is a node that may reside in both the Physical Skills domain but also the Knowledge -> History Domain. While it is just one node, it will have different attributes and relationships for each version of Basketball there is. So within one file, say the History domain, the Basketball node may be referenced have many children related to the history of Basketball. In that file, there would be no references at all to the other 'version' of Basketball which is related to the Physical Skill. So within one file we may think of a node only within the realm of that files domain, but just know that the actual node will likely exist as part of other domains as well. This is why we query by name only, so that we dont accidentally create two separate copies of what is really the same thing.

In order to not overwrite the properties set on one node by another domain, each domain will have its own unique properties. These possible properties will be spelled out in the l1Domain node's 'domain-relationships' and 'domain-properties' properties. Each domain should suffix properties with its domain name in order to maintain domain uniqueness and not overwrite the the ones set by other domains. For example, an attribute node of both History and 

This schema is extremely flexible and allows one thing to be containerized by many domains at once without fear of those domains getting in the way of each other. It allows each node to be apart of many different trees at once, thereby allowing us to manage our database in this manner while still being a true graph.

In general, there are three main types of nodes. 'Domain' nodes which are a sort of parent for all the related items that make up that thing, 'Attribute' nodes which are the items in that thing, and 'Reference' nodes which may contain information that is common to many other nodes but we would only want to store/update once. Beyond that, each domain may have its own specific nodes and relationships

With that being said, there are several globally used relationships and properties that will be used across all domains, they are as follows:
```
NODES:
    RELATIONSHIPS:
    PROPERTIES:

RELATIONSHIPS:
    PROPERITES:
```

