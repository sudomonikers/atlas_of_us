# Atlas Of Us Architecture

If you have not yet, please start by reading summary.md

If you have already done so, let's dive in! The Atlas Of Us has a lot of moving pieces and parts, and there are distinct files explaining each of those, this file explains the general architecture. 

## General Architecture
The Atlas Of Us is an extremely data-centric application with a TON of complexity found in our graph database. See data_model.md for more information. But for the actual application we have a traditional 3 layer architecture with several technically-partitioned services and event-driven things thrown in for good measure, all deployed on the AWS cloud.

This is a technically partitioned architecture mostly because of the nature of our data. While our different traits (sub-graphs) are somewhat distinct and have their own business rules, they are also extremely intermingled. This is a graph database after all and the whole point is that there are connections going this way and that. Modeling a human being (or all of them) is by nature an extremely intermingled thing. You cannot describe one thing without bringing in everything else. Your skills for example are highly reliant on your knowledge and some are reliant on physical characteristics, though others might be reliant on your personality attributes. It is pretty much the same across all of the 7 traits. 

So if we were to attempt DDD we would almost certainly end up with the Big Ball of Mud architecture anti-pattern. Instead of fighting the data, we will attempt to contain the chaos in one place with the goal of making the application easier to understand and work with since there will not be a whole host of inter-service dependencies.

### UI
For our UI layer, we actually plan to have several UI's starting with a web application. In the futuer we will expand to offer native mobile apps and native desktop apps if needed.

The web UI will be hosted on AWS S3, fronted by cloudfront and WAF, with other web services liek Route53, Certificate Manager, and other used to host the app. The UI will be strictly a presentation layer with all business logic being handled in the backend since we intend to serve several different UI's in the future as well as potentially offering API access.

### Business Logic Layer
The business logic will all be handled by a single horizontally scaling REST API. We will use containers deployed to ECS and ran by Lambda fronted by API Gateway. Several smaller APIs will be instantiated to handle things like embedding generation or image generation, but mostly it will be one business logic API serving the UI, with those other APIs being called internally by the main one.

API infra - API Gateway, Lambda, ECS

There will also be several asynchronous jobs kicked off as they will be long-running. Jobs will be submitted to an SQS queue by the main business logic API and then handled by containerized jobs hosted on ECS and ran by AWS Fargate. These jobs will be used to build out data in the database.

Jobs infra - SQS, ECS, Fargate

### Database Layer
As mentioned earlier, data is king in this application. Because what we are collecting is extremely interconnected and also easily modeled in graph, we will be storing all of our data in a single monolithic Neo4j Graph database deployed on Neo4j Aura. See data_model.md for more details on the data model.