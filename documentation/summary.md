# The Atlas Of Us
The Atlas of Us is an application for figuring out who you are and better yet who you could become. To do this the app walks the user through figuring out who they are first. How do we do that? And how do we know who they could become?

Correctly modeling all that a person is is a very tall task. Before we can even get to modelling a specific person, we need to have an understanding of all that any human could be. What makes a person a person? Each person unique? Is it their personality? Their specific set of knowledge or skills? Is it the things they do on a day to day basis or moreso what they are capable of doing in different situations? How do we figure out who a person ACTUALLY is versus who they think they are? We all have our biases and self-indulgent lies after all.

So to figure out what an individual can possible be, the Atlas Of Us has a comprehensive graph of what can make up a person. This is in fact a combination of many things, and we are adding on new layers as we discover them. For now we model the following:

1. Personality (We use the Big 5 Theorem to model Personality Traits)
2. Knowledge (We have a comprehensive knowledge graph of all there is to know. These are facts and things that can be considered true)
3. Skills (These are things a person is CAPABLE of doing)
4. Physical Attributes (We model the human body in our database, and have users incoroporate their specific details)
5. Social Network (We create a social network of friends, family, organizations the users are apart of, jobs, influence, social status, etc.)
6. Things (Things? Well yes, this is a bit of a catch all but its used to model things the users own)

## What we don't do - yet
These 6 traits give us a pretty decent snapshot of each individual's stable inertia in time, but of course it doesn't account for a person's STATE. I might score extremely high in the Boldness personality trait, but if I got horrible sleep the night before I may act more tentatively today since I am feeling low-energy. State in any given moment is NOT something we currently model, though we have plans to incorporate this in the future.

You may notice that these 6 traits also do not account for a person's history. What are we if not a combination of our memories and past experiences? Don't those shape who we are? Well, yes they do, and we believe we capture the outputs of those experiences and memories in our 6 main human traits, though incorporating those things would give us a good indication of the trajectory of a person and deeper insight into their motivations and reasons for being the way they are. We have plans to incorporate this in the future as well.

Last but not least, we cannot claim 100% accuracy on telling a user who they are since users often, well, they lie. Every person has a whole host of biases and cognitive dissonances, and although we can lead the user in a way that elicits their true self, we cannot fully stop them from flat out lying either to us or to themselves. Our plan to account for this is to help make the user aware of their own biases and dissonances and walk them down the path of honesty, but as of now we haven't come up with a way to have a full-proof solution.

So to sum up what is currently out of scope for The Atlas Of Us:
1. User's fluxuating states
2. User's history and past experiences
3. Accounting for users being big fat liars

## So What Does That Leave Us With?
Despite leaving out quite a few things, we can do A LOT for users with this model. Through our elicitation walkthroughs we can help them better understand themselves, and then at the end see a holistic picture of who they are now. Then because we have a huge knowledge graph of everything a human can be, we can easily show them who they could become. What are the possibilities of humanity? Are they infinite? Well, maybe theoretically, but what we can do is show them a grounded in reality picture of who they could become. And because we have a complete picture of who they are now, we can offer them guidance on what would be easy for them to achieve and what would be more difficult. Because we have a full picture of what humans could be, we can show them their dreams, and if they don't have any then we will give them some. This is the core app, a summary of who you are and who you could become, with steps on how to get there.

## Future Plug-In Apps
A complete picture of who a person is is pretty powerful. All their skills and knowledge, their personality and physical attributes, their social connections and habits, this is a lot. Beyond the already interesting use case of knowing who you are and who you could become, there is a lot more we could do with this. Matching user's with their soul mate for example, or their dream job. Conversely, matching companies with their dream candidates. Coordinating users with the right products for their goals and needs, which we know pretty intimately. These are just a sample of the possibilities of what could be done if we had a complete picture of who people are. The core app is a gateway to unlock so much more!

## So... How Do We Do This?
There is a lot going on here. While this document is a summary of what the app is, the underlying technology and data model are extremely complicated. Each of those 6 traits are equally important but also pretty distinct. Therefor each of them has its own data model we call a sub-graph and distinct business rules. The Technical Architecture for the Atlas Of Us is described in architecture.md, and the data model is described in data_model.md
