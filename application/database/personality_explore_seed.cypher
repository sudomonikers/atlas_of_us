// =============================================================================
// Atlas of Us — Personality explore seed
// Spec: documentation/data_model/personality/personality.md
//
// The reading material behind the Explore tab. Run after personality_seed.cypher.
//
//   (:PersonalityModel)-[:HAS_DOMAIN]->(:PersonalityDomain)-[:HAS_FACET]->(:PersonalityTrait)
//   (:PersonalityTrait)-[:INTERACTS_WITH {description}]->(:PersonalityTrait)
//
// Domains and traits both carry an overview plus four lists: where being high
// helps (highGood), where being low helps (lowGood), and what to watch out for
// at each end (highWatch, lowWatch). Written to be honest, not flattering:
// every end of every scale has a cost.
//
// Idempotent: safe to re-run. MERGE on name, properties overwritten from this
// file on every run. Trait descriptions are left to personality_seed.cypher.
// =============================================================================


// -----------------------------------------------------------------------------
// 0. Constraints
// -----------------------------------------------------------------------------

CREATE CONSTRAINT personalitymodel_name_unique IF NOT EXISTS
FOR (n:PersonalityModel) REQUIRE n.name IS UNIQUE;

CREATE CONSTRAINT personalitydomain_key_unique IF NOT EXISTS
FOR (n:PersonalityDomain) REQUIRE n.key IS UNIQUE;


// -----------------------------------------------------------------------------
// 1. The model
// -----------------------------------------------------------------------------

MERGE (m:PersonalityModel {name: "Big Five"})
SET m.overview = "The Big Five is the most widely used and best supported model of personality in psychology. It says most of the stable differences between people can be described along five broad dimensions: Openness, Conscientiousness, Extraversion, Agreeableness and Neuroticism. Each one is a scale, not a type. You aren't an introvert or an extravert, you sit somewhere along a line, and most people sit near the middle of most of them. Each domain splits into six narrower facets, and two people with the same domain score can get there through very different facets. Your scores are fairly stable across adulthood, but they do drift: on average people become more conscientious, more agreeable and less neurotic as they age.",
    m.history = "The model wasn't invented, it was found. Starting in the 1930s, researchers worked from the lexical hypothesis: if a difference between people matters, language will have a word for it. They collected thousands of English adjectives that describe people, had people rate themselves and each other on them, and used factor analysis to see which words cluster together. The same five clusters kept appearing across different researchers, samples and later languages. Costa and McCrae built the NEO questionnaires around them in the 1980s, and the IPIP-NEO facets used here are a free, public-domain version of that work.",
    m.limits = "It's the best model we have, not a complete one. It describes how people tend to behave, but it doesn't explain why, and it says little about values, beliefs, skills or how someone changes with circumstance. Almost all of the data comes from questionnaires where people rate themselves, which rewards self-flattery and self-ignorance alike. Most of the research has been done on Western, educated, relatively wealthy people, and the five factors replicate less cleanly in some other cultures. Different questionnaires carve the facets differently, so a facet name here won't always mean exactly what it means elsewhere. Scores predict real outcomes like job performance, health and relationship stability, but only modestly: a trait shifts the odds, it doesn't decide anything.",
    m.ourTake = "We use the Big Five because it holds up better than anything else, but we don't gather it the way most tests do. Instead of asking you to rate vague statements, we put you in situations and read what you do and why. We also measure fourteen extra traits, like Patience, Resilience and Stubbornness, that matter in everyday life but don't map cleanly onto the five domains. Those extra traits are our own addition. They overlap with the Big Five and with each other, and they don't have the decades of research behind them that the core facets do, so treat them as a useful description rather than established science.";


// -----------------------------------------------------------------------------
// 2. Domains
// -----------------------------------------------------------------------------

UNWIND [

  { key: "openness", name: "Openness", order: 0,
    overview: "Openness to Experience is about how much novelty, complexity and imagination you go looking for. High scorers are drawn to new ideas, art, unusual experiences and their own inner life. Low scorers prefer the concrete, the familiar and the proven. It's the domain most linked to creativity and to political views: open people lean liberal, closed people lean conservative. It correlates modestly with intelligence, which tempts open people to think it means being smarter. It doesn't. Plenty of very open people are credulous, scattered and more in love with ideas than with whether they're true, and plenty of low scorers are sharp, practical and right.",
    highGood: ["Creative and research work, where new combinations are the whole job.", "Adapting to new cultures, technologies and ways of living.", "Understanding people whose lives and beliefs differ sharply from yours."],
    lowGood: ["Work that rewards doing a proven thing reliably, the same way, for years.", "Resisting fads, hype and ideas that are interesting but wrong.", "Finding real contentment in routine, tradition and the familiar."],
    highWatch: ["Chasing novelty and dropping projects once they stop being new.", "Mistaking an interesting idea for a true one, and falling for elaborate nonsense.", "Looking down on people with conventional tastes, which is its own kind of narrow-mindedness."],
    lowWatch: ["Dismissing ideas before understanding them, and calling that common sense.", "Getting stuck when the world changes and the old way stops working.", "A smaller life than you needed to have, from never trying the unfamiliar."] },

  { key: "conscientiousness", name: "Conscientiousness", order: 1,
    overview: "Conscientiousness is about self-control in the service of goals: organising, planning, following through and resisting the pull of the moment. Of all five domains it's the most consistent predictor of success at school and work, and it predicts better health and longer life too, mostly because conscientious people do the boring things that keep them alive. That makes it easy to treat as simply good. It isn't. Very high scorers can be rigid, joyless, workaholic and harsh on people who don't share their standards, and they can be so busy executing a plan that they never ask whether it was the right plan.",
    highGood: ["Long projects where success comes from steady, unglamorous work.", "Roles where other people's safety or money depends on you not dropping things.", "Building habits, savings and health that pay off decades later."],
    lowGood: ["Fast-moving, chaotic situations where the plan is out of date by lunchtime.", "Creative play and exploration, where structure kills the good ideas early.", "Letting go of goals that have stopped being worth the effort."],
    highWatch: ["Rigidity: following the plan after it has stopped making sense.", "Burnout, and a self-worth that collapses whenever you aren't productive.", "Moralising about other people's mess and lateness as if they were character flaws."],
    lowWatch: ["Letting people down, then being surprised that they stop relying on you.", "Losing years to the gap between what you meant to do and what you did.", "Calling it spontaneity when it's really avoidance."] },

  { key: "extraversion", name: "Extraversion", order: 2,
    overview: "Extraversion is about how much you seek out stimulation, especially from other people, and how much positive energy you feel and show. High scorers get energy from company, talk more, take charge more and feel good more often. Low scorers, introverts, are not shy or antisocial by definition: they just need less stimulation, and too much of it wears them out. Extraversion is the domain most tied to day-to-day happiness, and extraverts tend to be rewarded in schools and workplaces built around meetings and talking. That reward isn't the same as being right. Extraverts are often given credit for confidence, not competence.",
    highGood: ["Sales, leadership, teaching and any role where energy is contagious.", "Building a wide network, and being the person who knows someone for everything.", "Recovering mood quickly, by going out and seeing people."],
    lowGood: ["Long stretches of focused, solitary work.", "Listening, observing and noticing what louder people miss.", "Being fine alone, which makes you less dependent on other people's approval."],
    highWatch: ["Talking over people, and mistaking airtime for contribution.", "Thinking out loud and committing to things before thinking them through.", "Needing constant stimulation, and not knowing what to do with quiet."],
    lowWatch: ["Being overlooked for work and promotions you deserved, because you didn't say so.", "Letting friendships fade because reaching out always felt like effort.", "Calling avoidance a preference, and never testing whether it is one."] },

  { key: "agreeableness", name: "Agreeableness", order: 3,
    overview: "Agreeableness is about how you treat other people's interests against your own: trust, warmth, honesty, modesty and the urge to cooperate rather than compete. High scorers are kind, easy to work with and well liked. Low scorers are sceptical, blunt and more willing to fight for what they want. It's tempting to rank this as good versus bad, but the research doesn't. Agreeable people earn measurably less on average, get taken advantage of more and often avoid conflicts that needed to happen. Disagreeable people are harder to be around but are often the ones who say the true thing in the room and negotiate the better deal.",
    highGood: ["Caring and support roles, where warmth is the work.", "Keeping teams, families and friendships together through friction.", "Being trusted, because people can tell you don't have an angle."],
    lowGood: ["Negotiating, competing and advocating hard for yourself or your side.", "Giving unwelcome feedback and refusing to go along with a bad idea.", "Spotting manipulation and bad faith before it costs you."],
    highWatch: ["Getting exploited, resenting it silently, and calling that kindness.", "Avoiding necessary conflict until a small problem becomes a big one.", "Telling people what they want to hear instead of what's true."],
    lowWatch: ["Winning arguments and losing people.", "Assuming bad intent so often that you create the hostility you expected.", "Being right in a way that nobody wants to hear, so nothing changes."] },

  { key: "neuroticism", name: "Neuroticism", order: 4,
    overview: "Neuroticism is about how strongly and how often you feel negative emotions: worry, anger, sadness, embarrassment and the sense of being overwhelmed. High scorers feel threat sooner, feel it harder and take longer to come down. Low scorers are calm and hard to rattle. It's the domain most linked to anxiety disorders, depression and poor physical health, and it's the one most people would choose to have less of. But low isn't automatically better. Some worry is useful, very calm people can miss real danger and other people's distress, and high scorers are often the first to notice that something is wrong.",
    highGood: ["Spotting risks and problems early, before calmer people have noticed them.", "Taking criticism and danger seriously, so you prepare and improve.", "Empathy for people who are struggling, because you know the feeling."],
    lowGood: ["Crises, emergencies and high-pressure work, where calm is contagious.", "Taking risks and recovering from setbacks without being knocked off course.", "Being steady for other people when they can't be steady themselves."],
    highWatch: ["Treating feelings as evidence, and acting on threats that aren't real.", "Exhausting the people around you with reassurance they can't actually give.", "Avoiding anything that might go badly, which over time includes most good things."],
    lowWatch: ["Under-reacting to real danger because it doesn't feel dangerous.", "Struggling to understand, or being impatient with, people who are anxious.", "Complacency: nothing feels urgent, so nothing gets fixed."] },

  { key: "other", name: "Beyond the Big Five", order: 5,
    overview: "These are traits we measure because they shape everyday life in ways people recognise, even though they aren't part of the Big Five. Most of them overlap with it: Resilience sits close to low Neuroticism, Perfectionism blends high Conscientiousness with high Neuroticism, and Stubbornness is partly low Agreeableness. They are our own selection, not a validated scientific model, so read them as useful descriptions rather than separate dimensions of personality.",
    highGood: null, lowGood: null, highWatch: null, lowWatch: null }

] AS d
MERGE (n:PersonalityDomain {key: d.key})
SET n.name = d.name, n.order = d.order, n.overview = d.overview,
    n.highGood = d.highGood, n.lowGood = d.lowGood, n.highWatch = d.highWatch, n.lowWatch = d.lowWatch
WITH n
MATCH (m:PersonalityModel {name: "Big Five"})
MERGE (m)-[:HAS_DOMAIN]->(n);

// facets belong to the domain in their description prefix, e.g. "openness facet: ...". Everything else is Beyond the Big Five
MATCH (d:PersonalityDomain), (t:PersonalityTrait)
WHERE (d.key <> "other" AND t.description STARTS WITH d.key + " facet:")
   OR (d.key = "other" AND NOT t.description CONTAINS " facet:")
MERGE (d)-[:HAS_FACET]->(t);


// -----------------------------------------------------------------------------
// 3. Traits
// -----------------------------------------------------------------------------

UNWIND [

  // ---- openness ----
  { name: "Imagination",
    overview: "Imagination is how much of your life happens inside your head: daydreaming, inventing, picturing how things could be. High scorers have a vivid inner world they return to constantly, and they're often good at seeing possibilities other people don't. Low scorers keep their attention on what is actually in front of them. High imagination is a real asset for creative work and planning, but it's also where a lot of wasted time and avoidance live. A rich fantasy life can quietly replace the harder work of making something real, and people high in it often confuse having pictured something with having done it.",
    highGood: ["Creative work, design and invention, where the first step is seeing what isn't there yet.", "Planning for situations that haven't happened, and imagining how they could go wrong.", "Keeping yourself entertained through boredom, waiting and solitude."],
    lowGood: ["Practical, hands-on work where attention to the real thing matters most.", "Staying present in conversations instead of drifting off.", "Seeing situations as they are, not as you'd like them to be."],
    highWatch: ["Daydreaming instead of doing, and feeling productive anyway.", "Building elaborate stories about what other people think, then reacting to the story.", "Losing interest once a project moves from imagining it to executing it."],
    lowWatch: ["Struggling to picture a different future, so you never aim for one.", "Dismissing other people's ideas because you can't see them yet.", "Missing risks that only show up if you imagine what could happen."] },

  { name: "Artistic Interests",
    overview: "Artistic Interests is about how strongly beauty moves you: music, art, writing, design and nature. High scorers seek it out, notice it everywhere and can be genuinely affected by it. Low scorers can take it or leave it, and don't feel much is missing. It shapes how people spend their time and money far more than how well they do at work. High scorers sometimes treat their taste as a sign of depth or moral seriousness. It isn't. Caring about beauty says nothing about whether you're kind, honest or good at anything, and low scorers aren't shallow for preferring function to form.",
    highGood: ["Design, craft and any work where how it looks and feels is the point.", "Finding meaning, comfort and restoration in art and nature.", "Noticing quality and detail that other people walk past."],
    lowGood: ["Focusing on function and getting things working, without fussing about appearance.", "Spending money and time on things that matter more to you.", "Being unaffected by snobbery and taste-based status games."],
    highWatch: ["Snobbery: judging people by what they like.", "Spending beyond your means on beautiful things.", "Valuing how something looks over whether it works."],
    lowWatch: ["Missing a source of joy and meaning that costs very little.", "Dismissing design and presentation that actually matter to other people.", "A narrower shared life with partners and friends who care about these things."] },

  { name: "Emotionality",
    overview: "Emotionality, in this sense, is awareness of your own feelings: noticing them, valuing them and being able to name them. It isn't the same as being emotional or unstable, that's Neuroticism. High scorers have a detailed read on their own inner weather and tend to treat feelings as important information. Low scorers pay less attention, and often can't say what they feel beyond 'fine' or 'bad'. Knowing your feelings helps you manage them and explain them to others. The catch is that high scorers can over-attend, analysing every feeling until it's bigger than it was, and treating 'I feel it strongly' as if it meant 'it's true'.",
    highGood: ["Relationships, where being able to say what you feel prevents a lot of damage.", "Therapy, art and writing that draw on inner experience.", "Noticing early that something is wrong with you before it becomes a crisis."],
    lowGood: ["Staying task-focused when feelings would get in the way.", "Not being knocked off course by moods that will pass anyway.", "Situations that need detachment, like emergencies and negotiations."],
    highWatch: ["Over-processing: talking about a feeling until it grows.", "Treating your feelings as facts that other people must respond to.", "Self-absorption, where your inner world crowds out other people's."],
    lowWatch: ["Not knowing you're angry, sad or burnt out until it comes out sideways.", "Partners and friends feeling shut out because you can't say what's going on.", "Making big decisions without noticing what you actually want."] },

  { name: "Adventurousness",
    overview: "Adventurousness is the appetite for new activities, places and experiences, as opposed to the comfort of the familiar. High scorers order the dish they've never heard of, move cities, change careers and get bored with routine. Low scorers find real satisfaction in knowing what to expect, and stick with what works. Both are legitimate ways to live. High scorers often treat their restlessness as a virtue and their low-scoring friends as timid, but novelty isn't growth, and a lot of adventure is just avoiding the boredom of committing to one thing. Low scorers, for their part, can mistake comfort for contentment and miss out on things they'd have loved.",
    highGood: ["Moving, travelling and adapting to new places and cultures.", "Early-stage work where the job keeps changing.", "Trying things other people won't, and finding opportunities as a result."],
    lowGood: ["Building deep skill and relationships by staying with one thing for years.", "Running steady, reliable routines that other people depend on.", "Being content without needing to keep raising the stakes."],
    highWatch: ["Leaving jobs, places and people as soon as they become familiar.", "Confusing novelty with progress.", "Never getting good at anything, because you're always a beginner."],
    lowWatch: ["Staying in a situation long after it stopped being right, because leaving is unfamiliar.", "A shrinking comfort zone as you get older.", "Missing opportunities because they came in an unfamiliar shape."] },

  { name: "Intellect",
    overview: "Intellect is the love of ideas for their own sake: puzzles, theories, debates and abstract thinking. It's about appetite, not ability. High scorers enjoy thinking hard and will chase a question nobody asked them to answer. Low scorers prefer the practical and see abstract debate as a waste of time. It correlates with intelligence, but plenty of high scorers are wrong a lot, and enjoying arguments about ideas is not the same as being good at reaching true conclusions. High scorers can also hide in thought, endlessly analysing something that needed a decision, and can be tiresome to people who just want to get on with things.",
    highGood: ["Research, analysis, strategy and any work built on hard thinking.", "Learning new fields quickly because you enjoy the struggle.", "Questioning assumptions that everyone else accepts."],
    lowGood: ["Practical work where doing beats theorising.", "Making decisions without getting lost in analysis.", "Connecting with people who have no interest in debate."],
    highWatch: ["Analysis paralysis: thinking as a way of not acting.", "Turning every conversation into an argument and not noticing people don't enjoy it.", "Arrogance about ideas, and contempt for practical people."],
    lowWatch: ["Being easily misled by confident claims you didn't examine.", "Dismissing useful ideas because they sound abstract.", "Plateauing in work that changes, because learning feels like a chore."] },

  { name: "Liberalism",
    overview: "Liberalism here means psychological, not party-political: how ready you are to question authority, convention and tradition. High scorers want rules justified and are comfortable challenging them. Low scorers respect established ways of doing things and see value in tradition, stability and order. It does predict political leaning, but not perfectly. High scorers often see themselves as the free thinkers and see tradition as mere inertia, but traditions frequently encode hard-won lessons nobody remembers the reason for. Low scorers can mistake 'the way it's always been done' for a reason, and defend unfair arrangements because they're familiar.",
    highGood: ["Reforming systems that are unfair or no longer work.", "Fields where questioning the consensus leads to progress.", "Being open to people and lifestyles that break convention."],
    lowGood: ["Preserving institutions, practices and communities that work.", "Respecting the knowledge built into tradition before tearing it down.", "Providing stability and continuity for families and groups."],
    highWatch: ["Rejecting rules and traditions just because they're old.", "Contempt for people who value tradition, while claiming to be open-minded.", "Breaking things that worked because you didn't understand why they existed."],
    lowWatch: ["Defending unfair arrangements because they're familiar.", "Deferring to authority that hasn't earned it.", "Being left behind when the world changes."] },

  // ---- conscientiousness ----
  { name: "Self-Efficacy",
    overview: "Self-Efficacy is your belief that you can handle things and get them done. High scorers approach problems assuming they'll find a way, which makes them more likely to try, to persist and therefore to succeed. Low scorers doubt their ability, and that doubt often becomes self-fulfilling. It's one of the most useful beliefs a person can have, but it isn't the same as competence. High scorers overestimate themselves, take on too much and are slow to ask for help. And low self-efficacy is sometimes simply accurate, especially in an area you haven't learned yet.",
    highGood: ["Taking on hard, unfamiliar challenges and seeing them through.", "Leadership, where people follow someone who believes it can be done.", "Bouncing back from failure, because you assume next time can be different."],
    lowGood: ["Asking for help and training before charging in.", "Being honest about limits, which keeps people safe.", "Staying humble in areas you really are new to."],
    highWatch: ["Overconfidence: committing to things you can't deliver.", "Not asking for help until it's too late.", "Blaming circumstances when things go wrong, rather than your own ability."],
    lowWatch: ["Never trying, then taking the result as proof you couldn't.", "Letting less capable but more confident people take the opportunities.", "Handing off problems you could have solved."] },

  { name: "Orderliness",
    overview: "Orderliness is a liking for structure: plans, lists, tidy spaces and things being where they belong. High scorers feel calmer and work better when things are organised, and they're the ones who keep shared systems from falling apart. Low scorers are comfortable with mess and improvisation, and often work fine in what looks like chaos to everyone else. It's one of the facets least connected to actual success. Plenty of very orderly people spend their energy organising instead of producing, and plenty of messy people get a lot done. High orderliness can also tip into control, where other people's mess becomes your stress.",
    highGood: ["Running systems, logistics, finances and anything with many moving parts.", "Shared spaces and teams that need someone to keep things findable.", "Reducing mistakes by always doing it the same way."],
    lowGood: ["Improvising when plans fall apart.", "Creative work where mess is part of the process.", "Tolerating other people's chaos without friction."],
    highWatch: ["Organising as procrastination: the desk is perfect and the work isn't done.", "Getting anxious and controlling when things are out of place.", "Friction with partners and housemates over standards they don't share."],
    lowWatch: ["Losing things, missing deadlines and paying late fees.", "Making other people carry the organising you don't do.", "Calling it creative chaos when it's just costing you time."] },

  { name: "Dutifulness",
    overview: "Dutifulness is a strong sense of obligation: keeping promises, following rules and doing what you said you'd do even when you'd rather not. High scorers are reliable and trustworthy, the people you call when it actually matters. Low scorers treat obligations more flexibly and are more likely to put their own needs or judgement first. High dutifulness is a big part of being a good colleague and friend, but it has a dark side: following rules that are wrong, staying in commitments that are harming you, and feeling guilty for every small lapse. Some of the worst things people have done were done out of duty.",
    highGood: ["Roles where trust and reliability are everything.", "Keeping long-term commitments to family, friends and work.", "Following safety rules and procedures that exist for good reasons."],
    lowGood: ["Breaking rules that are unfair or no longer make sense.", "Leaving commitments that have become harmful.", "Prioritising your own wellbeing without drowning in guilt."],
    highWatch: ["Following rules and orders you should have questioned.", "Staying in bad jobs and relationships out of obligation.", "Guilt that's out of proportion to the lapse."],
    lowWatch: ["Being seen as unreliable, which quietly costs you trust and opportunities.", "Breaking promises and telling yourself it didn't matter.", "Treating rules as optional and being surprised by the consequences."] },

  { name: "Achievement-Striving",
    overview: "Achievement-Striving is ambition: the drive to set big goals and work hard to get ahead. High scorers set big targets, push themselves and measure their worth partly by what they accomplish. Low scorers are content with doing enough and put more weight on balance and ease. It's strongly tied to career success, and it's also strongly tied to burnout. High scorers often struggle to rest, feel that nothing they do is ever enough, and can sacrifice health and relationships for goals that turn out not to satisfy them. Low scorers are often happier day to day, but may look back on potential they never used.",
    highGood: ["Careers and fields where effort compounds over years.", "Mastering hard skills that most people give up on.", "Lifting the standards of a team by example."],
    lowGood: ["Enjoying life as it is, instead of always chasing the next thing.", "Protecting time for relationships, rest and play.", "Avoiding the burnout that comes from never being satisfied."],
    highWatch: ["Tying your self-worth to output, so rest feels like failure.", "Sacrificing health and relationships for goals that don't satisfy once reached.", "Judging people who aren't driven as lazy."],
    lowWatch: ["Drifting, and realising years later that you never pushed for anything.", "Being passed over by people who wanted it more.", "Settling for less than you were capable of out of comfort."] },

  { name: "Self-Discipline",
    overview: "Self-Discipline is the ability to start a task and keep going until it's finished, even when it's boring, hard or there's something more fun to do. High scorers can make themselves do things. Low scorers procrastinate, get distracted and struggle to finish what they start without outside pressure. It's one of the strongest predictors of success of any facet, because so much of life rewards simply doing the boring thing. The risk at the high end is that you become very good at pushing through things you should have stopped doing, and so used to overriding your feelings that you stop noticing them.",
    highGood: ["Long, boring, important work like studying, training and saving.", "Working independently without a boss checking in.", "Building habits that pay off over years."],
    lowGood: ["Noticing when a task isn't worth finishing and dropping it.", "Following energy and curiosity to unexpected places.", "Taking breaks before you need them."],
    highWatch: ["Pushing through pain and exhaustion that were warnings.", "Finishing things out of habit that should have been abandoned.", "Impatience with people who struggle with what comes easily to you."],
    lowWatch: ["A trail of unfinished projects and broken resolutions.", "Needing deadlines and other people to make you do anything.", "Knowing exactly what you should do and not doing it, for years."] },

  { name: "Cautiousness",
    overview: "Cautiousness is the habit of thinking before acting: weighing options, considering consequences and not rushing in. High scorers are deliberate and rarely make rash mistakes. Low scorers are impulsive, act on instinct and say what comes to mind. Caution protects you from obvious disasters, but it has a cost that's easy to miss because it's invisible: all the opportunities that passed while you were still deciding. Impulsive people make more mistakes, but they also try more things, and some of those work. The right level depends heavily on how costly mistakes are in what you're doing.",
    highGood: ["High-stakes decisions where mistakes are expensive or permanent.", "Safety-critical work like medicine, engineering and finance.", "Avoiding regret from things said and done in the heat of the moment."],
    lowGood: ["Fast-moving situations where a good decision now beats a perfect one later.", "Seizing opportunities before they disappear.", "Being spontaneous and fun to be around."],
    highWatch: ["Over-thinking until the chance has gone.", "Mistaking indecision for prudence.", "Missing out on experiences because nothing is ever quite safe enough."],
    lowWatch: ["Saying things you can't take back.", "Impulse buys, impulse quits and impulse relationships.", "Repeating the same mistake because you never stopped to think about it."] },

  // ---- extraversion ----
  { name: "Friendliness",
    overview: "Friendliness is about warmth: making friends easily, showing affection openly and making people feel welcome. High scorers are approachable and quickly liked. Low scorers are more reserved and take time to warm up, which can read as cold even when it isn't. High friendliness opens a lot of doors, but it's not the same as depth or loyalty. Some very friendly people have many acquaintances and few close friends, and their warmth can be given so freely that it means less. Reserved people are often misjudged at first, but the friendships they do make can be unusually solid.",
    highGood: ["Meeting new people, networking and making strangers comfortable.", "Customer-facing and caring work.", "Defusing tension and making groups feel welcoming."],
    lowGood: ["Keeping professional distance where it's needed.", "Building a few deep friendships instead of many shallow ones.", "Not needing to be liked by everyone."],
    highWatch: ["Warmth that's wide but shallow, with no one who really knows you.", "Being hurt when people don't return the same level of warmth.", "Getting close to people too fast, before you know whether they're trustworthy."],
    lowWatch: ["Being misread as cold, arrogant or uninterested.", "Missing out on friendships that needed you to make the first move.", "Isolation that creeps up slowly."] },

  { name: "Gregariousness",
    overview: "Gregariousness is a preference for company over solitude: crowds, parties, busy places and doing things with others. High scorers feel flat when alone and lift in a crowd. Low scorers find groups draining and need time alone to recover. This is the facet most people mean when they say introvert or extravert. Neither is a flaw, but each has costs. Highly gregarious people can struggle with solitude and with anything that needs sustained quiet focus, and they can fill their lives with company to avoid their own thoughts. Low scorers can drift into isolation without noticing how much it's costing them.",
    highGood: ["Team-based and social work.", "Building communities, events and shared life.", "Staying connected, which protects mood and health."],
    lowGood: ["Long solitary work, like writing, research and coding.", "Being self-sufficient and content alone.", "Avoiding the drain of constant social obligations."],
    highWatch: ["Needing company to feel okay, and not knowing who you are alone.", "Filling every hour with people to avoid thinking.", "Overcommitting socially and having no time for deep work."],
    lowWatch: ["Gradual isolation that feels like preference but becomes loneliness.", "Missing out on the opportunities that come through people.", "Being seen as standoffish by groups you'd actually like to belong to."] },

  { name: "Assertiveness",
    overview: "Assertiveness is about speaking up, taking charge and influencing what a group does. High scorers state their views, ask for what they want and naturally end up leading. Low scorers hold back, defer and let others set the direction. Assertive people are rewarded in most workplaces and are more likely to be promoted, often beyond what their actual competence justifies. That's the uncomfortable truth here: assertiveness is frequently mistaken for ability. At the high end it can become domineering, and at the low end people end up living by other people's decisions and quietly resenting it.",
    highGood: ["Leading teams and making calls under uncertainty.", "Negotiating, advocating and asking for what you're worth.", "Saying the thing everyone was thinking but nobody said."],
    lowGood: ["Supporting roles where letting others lead works best.", "Listening before deciding, so better ideas get heard.", "Avoiding power struggles that don't matter."],
    highWatch: ["Dominating conversations and decisions, so quieter people stop contributing.", "Leading confidently in the wrong direction.", "Being promoted for confidence and failing for lack of skill."],
    lowWatch: ["Being underpaid, overlooked and talked over.", "Living by other people's decisions, then resenting them for it.", "Knowing the right answer and watching the group go the wrong way."] },

  { name: "Activity Level",
    overview: "Activity Level is about tempo: how fast and busy you like your life to be. High scorers are always doing something, move quickly and fill their schedules. Low scorers prefer a slower, more relaxed pace. Being energetic looks impressive, and busy people often get a lot done, but activity is not the same as progress. Plenty of high-energy people are busy because stopping is uncomfortable, and their speed makes them miss things. Slower people are sometimes seen as lazy when they're actually being deliberate, but low activity can also slide into inertia.",
    highGood: ["Juggling many projects and responsibilities at once.", "Fast-paced environments like startups, events and emergencies.", "Getting a lot done in a short time."],
    lowGood: ["Careful, deliberate work that rushing would spoil.", "Rest, recovery and enjoying the moment.", "Being a calming presence for busy people."],
    highWatch: ["Busyness as avoidance: always moving so you never have to sit with anything.", "Exhausting the people around you.", "Speed that produces careless mistakes."],
    lowWatch: ["Inertia, where slow becomes stopped.", "Being seen as lazy or unmotivated.", "Falling behind in environments that move quickly."] },

  { name: "Excitement-Seeking",
    overview: "Excitement-Seeking is the craving for stimulation, intensity and risk. High scorers are drawn to thrills, speed, loud places and anything that makes their heart race, and they get bored quickly without it. Low scorers prefer calm and find intense stimulation unpleasant. High scorers bring energy and courage, and they're often the ones willing to do what others won't. They also have measurably more accidents, injuries, addictions and financial disasters, because the same drive that makes life exciting makes it dangerous. Low scorers are safer, but can miss experiences that would have been worth the risk.",
    highGood: ["Emergency, adventure and high-adrenaline work.", "Taking risks that others are too comfortable to take.", "Bringing energy to dull situations."],
    lowGood: ["Steady, safe living with fewer accidents and regrets.", "Calm environments where intensity would be a problem.", "Enjoying quiet pleasures that excitement-seekers find boring."],
    highWatch: ["Risk-taking that ends in injury, debt or addiction.", "Constant boredom with stable relationships and jobs.", "Escalating, because the same thrill stops working."],
    lowWatch: ["Turning down experiences you'd have loved because they felt like too much.", "Being seen as dull by people who live faster.", "Never testing what you're capable of under pressure."] },

  { name: "Cheerfulness",
    overview: "Cheerfulness is the tendency to feel and show positive emotion: joy, enthusiasm and fun. High scorers laugh easily, light up a room and recover their good mood quickly. Low scorers are more serious and subdued, which isn't the same as unhappy. Cheerfulness makes people pleasant to be around and is good for health. But cheerful people can be wearing for others when it isn't the time, and constant positivity can be a way of avoiding anything difficult. Low scorers are sometimes more realistic, and their seriousness can be exactly what a situation needs.",
    highGood: ["Lifting the mood of a group, especially in hard times.", "Teaching, hosting and anything where enthusiasm is contagious.", "Enjoying ordinary life, which is most of life."],
    lowGood: ["Serious situations that need gravity, not jokes.", "Seeing problems clearly without forcing a positive spin.", "Being taken seriously in settings that distrust enthusiasm."],
    highWatch: ["Forced positivity that shuts down people who are struggling.", "Laughing things off that needed facing.", "Being seen as lightweight or not serious."],
    lowWatch: ["Being read as cold, grumpy or unapproachable.", "Missing joy that was available.", "Dampening other people's enthusiasm without meaning to."] },

  // ---- agreeableness ----
  { name: "Trust",
    overview: "Trust is your default assumption about other people: that they're honest and mean well. High scorers give people the benefit of the doubt, which makes cooperation easy and relationships warmer. Low scorers are suspicious, look for hidden motives and want proof before they believe. Most people are honest most of the time, so high trust usually pays off, and it makes life far less stressful. But high scorers are also easier to scam, manipulate and take advantage of, and they tend to ignore warning signs. Low trust protects you from the few bad actors at the cost of treating everyone as one.",
    highGood: ["Building teams and partnerships quickly.", "Close relationships, where suspicion would poison things.", "Living without constant vigilance."],
    lowGood: ["Spotting scams, lies and manipulation.", "Auditing, negotiating and investigating.", "Protecting yourself and others from people who really are acting in bad faith."],
    highWatch: ["Being scammed or exploited more than once by the same kind of person.", "Ignoring red flags because noticing them felt unkind.", "Assuming everyone thinks like you."],
    lowWatch: ["Seeing hidden motives that aren't there.", "Pushing people away who were genuinely on your side.", "Exhausting yourself checking everything."] },

  { name: "Morality",
    overview: "Morality, in this model, is about straightforwardness: being frank and genuine rather than manipulative. High scorers say what they mean and don't play games, flatter or scheme. Low scorers are more willing to bend the truth, use charm strategically or work people to get what they want. It's worth being blunt: low scorers often do better in the short term, in sales, politics and negotiation, because a little manipulation works. Over time it erodes trust. High scorers are trusted, but their honesty can be naive, and they can be outmanoeuvred by people who are playing a game they refuse to play.",
    highGood: ["Being trusted, which compounds over a lifetime.", "Relationships without hidden agendas.", "Roles where integrity is the job."],
    lowGood: ["Negotiation, sales and politics, where strategy matters.", "Handling people who are themselves manipulative.", "Diplomacy, where the blunt truth would cause damage."],
    highWatch: ["Being outmanoeuvred by people who don't play fair.", "Blunt honesty that's really just a lack of tact.", "Moral superiority over people who use ordinary social strategy."],
    lowWatch: ["Losing trust when people realise they were being worked.", "Losing track of what you actually think under all the strategy.", "Relationships that feel transactional to the other person."] },

  { name: "Altruism",
    overview: "Altruism is finding satisfaction in helping others: giving time, effort and resources without needing much back. High scorers are generous and often go out of their way for people. Low scorers are more focused on their own needs and expect fair exchange. Altruistic people make communities work, but they're also at real risk of burnout, of being used, and of helping in ways that serve their own need to be needed more than the other person's need. Low scorers can look selfish, but they're also better at protecting their own time, and they often avoid the quiet resentment that over-givers build up.",
    highGood: ["Caring work, volunteering and community building.", "Being the friend people turn to when things go wrong.", "Creating trust and goodwill that comes back in unexpected ways."],
    lowGood: ["Protecting your time and energy for your own priorities.", "Saying no without guilt.", "Avoiding relationships where you give much more than you get."],
    highWatch: ["Burnout from helping everyone except yourself.", "Being used by people who notice you never say no.", "Helping to feel needed, and resenting people who stop needing you."],
    lowWatch: ["Being seen as selfish, and losing the goodwill that generosity builds.", "Keeping score in relationships until they feel like transactions.", "Missing the real satisfaction that comes from helping."] },

  { name: "Cooperation",
    overview: "Cooperation is about avoiding confrontation and being willing to compromise. High scorers prefer harmony, give ground easily and dislike arguments. Low scorers are happy to push back, argue their corner and fight for what they want. Cooperative people make groups run smoothly, but they often pay for that peace themselves: they agree to things they don't want, swallow complaints and avoid conflicts that needed to happen. Low scorers can be difficult, but they're often the ones who stop bad ideas, and their willingness to fight means problems get dealt with rather than buried.",
    highGood: ["Teamwork, mediation and keeping groups together.", "Long relationships where small compromises add up.", "Calming conflicts before they escalate."],
    lowGood: ["Advocating hard for yourself or others.", "Stopping bad decisions that everyone else is too polite to challenge.", "Competitive environments where giving ground costs you."],
    highWatch: ["Agreeing to things you'll resent later.", "Avoiding conflicts until they explode.", "Letting the most stubborn person always get their way."],
    lowWatch: ["Fighting battles that weren't worth it.", "Getting a reputation as difficult, so people stop including you.", "Winning arguments and damaging relationships."] },

  { name: "Modesty",
    overview: "Modesty is not wanting to be the centre of attention or to seem better than others. High scorers downplay their achievements, avoid bragging and are uncomfortable with praise. Low scorers are comfortable talking up what they've done and see themselves as above average. Modest people are generally better liked, but the world often rewards the opposite: people who promote themselves get noticed, credited and promoted. High modesty can also hide low self-worth dressed as humility. Low modesty can be accurate confidence, or it can be arrogance that alienates everyone around it.",
    highGood: ["Being well liked, and easy to work and live with.", "Letting the work speak, in settings that reward it.", "Staying open to learning, because you don't assume you already know."],
    lowGood: ["Getting credit, promotions and opportunities by speaking up for your work.", "Sales, pitching and anything where self-promotion is the job.", "Projecting confidence that reassures others."],
    highWatch: ["Being overlooked while others take credit for your work.", "False modesty that fishes for reassurance.", "Underselling yourself so often that you start believing it."],
    lowWatch: ["Arrogance that people tolerate but don't like.", "Overrating yourself and being blindsided by failure.", "Taking more credit than you earned, and losing trust when people notice."] },

  { name: "Sympathy",
    overview: "Sympathy is about feeling for others and being moved by their suffering. High scorers are tender-hearted, quickly affected by other people's pain and driven to help. Low scorers are more detached and tend to judge situations on logic rather than feeling. Sympathy is a big part of what makes people kind, but it's a poor guide on its own: it responds to vivid individual stories rather than the size of a problem, and it can be exhausting or easily manipulated. Low scorers are sometimes seen as cold, but they can make hard, fair decisions that sympathetic people find impossible.",
    highGood: ["Caring for people who are struggling.", "Noticing suffering that others ignore.", "Building trust because people feel you genuinely care."],
    lowGood: ["Hard decisions, like firing someone or triage, where feeling would get in the way.", "Staying effective around constant suffering, as doctors and responders must.", "Resisting emotional manipulation and sob stories."],
    highWatch: ["Compassion fatigue and burnout.", "Being manipulated by people who know how to tug at you.", "Helping the vivid case instead of the bigger problem."],
    lowWatch: ["Coming across as cold or dismissive when someone is hurting.", "Not noticing that people around you are struggling.", "Making decisions that are logical but cruel."] },

  // ---- neuroticism ----
  { name: "Anxiety",
    overview: "Anxiety is the tendency to worry and feel nervous, often about things that haven't happened and may never happen. High scorers scan for threats, rehearse what could go wrong and find it hard to switch off. Low scorers are relaxed and rarely worry. Some anxiety is genuinely useful: it makes you prepare, check and take risks seriously. But high anxiety mostly costs more than it saves. It drives avoidance, shrinks lives and is exhausting for the anxious person and the people around them. Low scorers, meanwhile, can be so relaxed that they don't prepare for problems that really were coming.",
    highGood: ["Preparing thoroughly and catching problems early.", "Safety-critical work where worrying about failure prevents it.", "Taking other people's concerns seriously."],
    lowGood: ["Staying calm under pressure and thinking clearly.", "Taking reasonable risks without being frozen by what-ifs.", "Enjoying the present instead of rehearsing the future."],
    highWatch: ["Avoiding things because they might go badly, until your life gets small.", "Seeking reassurance that never lasts.", "Treating the feeling of danger as proof of danger."],
    lowWatch: ["Not preparing for problems that were foreseeable.", "Dismissing other people's worries as overreactions.", "Being caught out by risks you didn't take seriously."] },

  { name: "Anger",
    overview: "Anger here means how quickly you feel frustration and irritation, not how often you show it. High scorers are easily provoked, feel injustice sharply and can have a short fuse. Low scorers are slow to anger and hard to rile. Anger has a bad reputation, but it does useful work: it spots unfairness and gives you the energy to push back. The problem is that high-anger people feel it far more often than it's warranted, and what it does to relationships, health and judgement usually outweighs the occasional time it was right. Low scorers keep the peace, but some of them never get angry about things that deserved it.",
    highGood: ["Noticing and fighting injustice.", "Pushing through obstacles with sheer force.", "Setting boundaries people can't miss."],
    lowGood: ["Staying calm in conflict and keeping it from escalating.", "Relationships, where a short temper does lasting damage.", "Thinking clearly when provoked."],
    highWatch: ["Saying and doing things in anger that you can't undo.", "People walking on eggshells around you.", "Feeling righteous when you're actually just irritated."],
    lowWatch: ["Tolerating mistreatment you should have pushed back on.", "Not being taken seriously because you never show you care.", "Anger that's suppressed rather than absent, and comes out as resentment."] },

  { name: "Depression",
    overview: "This facet is about a disposition toward sadness, discouragement and hopelessness, not the clinical illness, though high scores do raise the risk of it. High scorers feel low more easily, take setbacks hard and can struggle to find motivation. Low scorers rarely feel down for long. There's some evidence that mildly low mood makes people see some situations more accurately, but mostly this facet is a burden, and it's one that people often hide. If you score high here and it's affecting your life, that's worth taking seriously and talking to someone about, not just accepting as your personality.",
    highGood: ["Seeing problems realistically, without forced optimism.", "Empathy for people going through dark periods.", "Depth and seriousness in art and reflection."],
    lowGood: ["Bouncing back quickly from setbacks.", "Staying motivated through long, hard stretches.", "Supporting others without being dragged down."],
    highWatch: ["Withdrawing from people and activities that would actually help.", "Interpreting setbacks as proof that things will always be bad.", "Hiding how bad it's got until it's a crisis."],
    lowWatch: ["Not recognising sadness in other people.", "Moving on so fast that you never learn from losses.", "Impatience with people who can't just snap out of it."] },

  { name: "Self-Consciousness",
    overview: "Self-Consciousness is sensitivity to what other people think of you: feeling watched, judged and easily embarrassed. High scorers replay awkward moments, worry about how they come across and feel uncomfortable being the focus. Low scorers are at ease in social situations and don't much care how they look. Some self-awareness keeps you considerate and attuned to others. Too much makes you rigid and inhibited, and it's mostly wasted: other people are thinking about you far less than you think. Very low scorers, on the other hand, can miss when they really are being rude or embarrassing.",
    highGood: ["Being attuned to how you affect others.", "Careful preparation for presentations and social situations.", "Avoiding social mistakes that low scorers make freely."],
    lowGood: ["Public speaking, performance and being the centre of attention.", "Taking social risks like asking, introducing yourself and speaking up.", "Not being held back by fear of looking foolish."],
    highWatch: ["Not doing things because of how they might look.", "Replaying conversations for days.", "Assuming people are judging you when they've already forgotten."],
    lowWatch: ["Not noticing when you're being inappropriate.", "Embarrassing the people you're with.", "Missing feedback that everyone else could see."] },

  { name: "Immoderation",
    overview: "Immoderation is difficulty resisting cravings and urges: food, drink, spending, scrolling, whatever pulls at you. High scorers give in to temptation more easily and later regret it. Low scorers find it relatively easy to say no and stick to limits. This facet links strongly to addiction, debt and health problems, so it's one of the most practically important to know about yourself. High scorers aren't weak-willed in some moral sense, the pull is genuinely stronger for them, which means they need better systems, not more guilt. Low scorers can be so controlled that they deny themselves pleasures that would have done no harm.",
    highGood: ["Enjoying pleasure fully, without guilt or second-guessing.", "Being fun and spontaneous to be around.", "Understanding temptation in others without judging."],
    lowGood: ["Sticking to budgets, diets and health goals.", "Avoiding addiction and debt.", "Delaying gratification for bigger rewards later."],
    highWatch: ["Habits that slide into addiction.", "Debt and health problems built up one small yes at a time.", "Relying on willpower instead of removing the temptation."],
    lowWatch: ["Denying yourself harmless pleasures out of rigid control.", "Judging people who struggle with what's easy for you.", "Joylessness disguised as discipline."] },

  { name: "Vulnerability",
    overview: "Vulnerability is how easily you're overwhelmed under pressure: feeling panicky, helpless or unable to cope when things pile up. High scorers can fall apart in a crisis and depend on others to steady them. Low scorers stay steady and capable when things go wrong. This facet matters most at exactly the moments that matter most, so it's worth being honest about. High scorers are often fine in normal life and only struggle when stress spikes, which means they can be caught out. Low scorers are invaluable in a crisis, but can underestimate how much stress they're carrying until it suddenly shows.",
    highGood: ["Knowing when you need help, and asking for it.", "Avoiding situations that genuinely exceed what you can handle.", "Empathy for people who are overwhelmed."],
    lowGood: ["Emergencies, high-pressure work and anything that needs a cool head.", "Being the steady person others lean on.", "Recovering quickly from stressful periods."],
    highWatch: ["Freezing or panicking exactly when you need to act.", "Avoiding responsibility because pressure feels unbearable.", "Leaning so hard on others that they burn out."],
    lowWatch: ["Taking on more than anyone should, because you can.", "Not noticing your own stress until your body does.", "Impatience with people who are struggling to cope."] },

  // ---- beyond the big five ----
  { name: "Patience",
    overview: "Patience is tolerating delay, difficulty and slowness without getting frustrated. High scorers can wait, repeat and work slowly toward something without needing quick results. Low scorers get frustrated with slowness in people, systems and themselves. Patience is behind a lot of long-term success, in skills, relationships and money, because most good things compound slowly. But patience is easy to confuse with passivity. Some patient people wait for things that are never going to come, and tolerate situations that should have been changed. Impatient people are harder to be around, but they often force things to happen.",
    highGood: ["Teaching, parenting and caring for people who learn slowly.", "Long-term investments in skills, health and money.", "Staying calm through bureaucracy and delays."],
    lowGood: ["Pushing slow systems and people to move faster.", "Refusing to tolerate problems that should be fixed now.", "Fast-paced work that rewards urgency."],
    highWatch: ["Waiting for things that are never going to change.", "Tolerating poor treatment because you can.", "Calling it patience when it's really avoiding action."],
    lowWatch: ["Snapping at people who are doing their best.", "Abandoning things right before they would have paid off.", "Rushing work and making mistakes."] },

  { name: "Resilience",
    overview: "Resilience is the ability to recover from setbacks and keep going through hardship. High scorers get knocked down and get back up, often learning something on the way. Low scorers take longer to recover and can be thrown off course for a long time by a single blow. It overlaps heavily with low Neuroticism, and it's partly a skill that can be built. Resilience is mostly a strength, but very resilient people sometimes keep pushing through situations they should have left, and can be dismissive of people who need more time to recover. Being able to endure something doesn't mean you should.",
    highGood: ["Long, hard pursuits with many failures along the way.", "Recovering from loss, rejection and disappointment.", "Being a stable presence through hard times."],
    lowGood: ["Taking setbacks seriously enough to change course.", "Recognising when something has really hurt you.", "Empathy for people who are struggling to recover."],
    highWatch: ["Enduring things you should have walked away from.", "Pushing on without processing what happened.", "Expecting others to bounce back as fast as you."],
    lowWatch: ["Getting stuck after a setback for much longer than it warranted.", "Avoiding challenges because failing feels unsurvivable.", "Letting one bad experience define a whole area of life."] },

  { name: "Optimism",
    overview: "Optimism is expecting good outcomes. High scorers believe things will work out, and that belief makes them more likely to try, persist and recover. Low scorers, pessimists, expect things to go wrong and plan accordingly. Optimists are generally happier and healthier, and their confidence can be self-fulfilling. But optimists also systematically underestimate risks, costs and timelines, and they're the people who start the business without checking the numbers. Pessimists are less fun, but they're often better calibrated, and their worst-case planning saves projects that optimists would have sunk.",
    highGood: ["Starting hard things that need belief to get going.", "Keeping morale up in a team through bad stretches.", "Recovering from setbacks, because you expect the next try to go better."],
    lowGood: ["Planning for risks and worst cases.", "Spotting flaws in plans that everyone else is excited about.", "Avoiding disappointment by keeping expectations realistic."],
    highWatch: ["Underestimating costs, timelines and risks.", "Ignoring warning signs because they don't fit the story.", "Dismissing people who raise problems as negative."],
    lowWatch: ["Not trying, because you've already decided it won't work.", "Dragging down the mood of everyone around you.", "Pessimism that becomes self-fulfilling."] },

  { name: "Perfectionism",
    overview: "Perfectionism is holding yourself or your work to exacting, sometimes unforgiving standards. It's a blend of high Conscientiousness and high Neuroticism, and the research splits it into two kinds: striving for excellence, which helps, and fear of falling short, which mostly hurts. High scorers produce careful, polished work, but they often produce less of it, procrastinate because starting means risking imperfection, and suffer disproportionately over small flaws. Low scorers ship things, move on and don't agonise. Their work is rougher, but they often get further, because done beats perfect most of the time.",
    highGood: ["Detail-critical work where small mistakes are costly.", "Craft and polish that set work apart.", "High standards that lift a team's quality."],
    lowGood: ["Shipping, iterating and learning from real feedback.", "Getting through large volumes of work.", "Being kind to yourself when things go wrong."],
    highWatch: ["Procrastinating because starting means risking imperfection.", "Agonising over flaws nobody else will notice.", "Holding others to standards that make you impossible to work with."],
    lowWatch: ["Sloppy work that costs time later.", "Settling for good enough when it mattered.", "Being seen as careless in settings that value precision."] },

  { name: "Competitiveness",
    overview: "Competitiveness is wanting to win and measuring yourself against others. High scorers are motivated by rivals, rankings and beating people. Low scorers are motivated by the work itself or by cooperation, and are uncomfortable with zero-sum contests. Competition drives a lot of excellence, and competitive people often achieve more. But it also makes it hard to celebrate other people's success, it turns friends into rivals, and it ties your satisfaction to a comparison you can never win for long. Low scorers can be better collaborators, but may lose out in environments that reward fighting for position.",
    highGood: ["Sports, sales and any field with clear winners.", "Pushing yourself harder because of a rival.", "Not backing down when something's at stake."],
    lowGood: ["Collaboration, where shared success matters more than credit.", "Enjoying activities for their own sake.", "Celebrating other people's wins without envy."],
    highWatch: ["Treating friends and colleagues as rivals.", "Never being satisfied, because someone is always ahead.", "Winning things that didn't matter at the cost of things that did."],
    lowWatch: ["Losing out to people who fought for it.", "Lacking the drive that competition would have given you.", "Being taken advantage of in zero-sum situations."] },

  { name: "Stubbornness",
    overview: "Stubbornness is holding your position or course despite pressure to change. High scorers don't back down easily, and they finish things that others give up on. Low scorers are flexible and change their minds readily. Stubbornness gets a bad name, but determination is just stubbornness pointed at the right thing. The problem is that stubborn people tend to dig in hardest exactly when they're wrong, because being challenged triggers it. Flexible people avoid that trap, but at the low end they can be pushed around, and they rarely see anything difficult through.",
    highGood: ["Seeing hard things through when everyone says to quit.", "Resisting pressure to compromise on what matters.", "Defending a correct position against the crowd."],
    lowGood: ["Changing your mind when the evidence changes.", "Compromise in relationships and teams.", "Adapting quickly when a plan isn't working."],
    highWatch: ["Digging in hardest when you're wrong.", "Treating every disagreement as a fight.", "Sinking more into failing projects because quitting feels like losing."],
    lowWatch: ["Being talked out of good decisions.", "Giving up when it gets hard.", "Having no position of your own, just the last one you heard."] },

  { name: "Independence",
    overview: "Independence is preferring to decide and do things for yourself rather than rely on others. High scorers like autonomy, trust their own judgement and resist being told what to do. Low scorers are comfortable relying on others, working within a team and taking direction. Independence is valuable, but it often hides a difficulty trusting people or asking for help, and very independent people tend to be lonelier than they admit. Low scorers can build stronger networks of mutual support, but at the extreme they can struggle to function without someone else making the call.",
    highGood: ["Self-directed work, freelancing and starting things.", "Making decisions without needing consensus.", "Coping when no one is around to help."],
    lowGood: ["Teamwork and shared decision-making.", "Building strong networks of mutual support.", "Learning from others instead of reinventing everything."],
    highWatch: ["Refusing help until you're overwhelmed.", "Not letting people close because relying on them feels risky.", "Reinventing things others could have shown you."],
    lowWatch: ["Struggling to decide anything alone.", "Depending on people who may not always be there.", "Going along with other people's choices for your own life."] },

  { name: "Boldness",
    overview: "Boldness is acting despite fear or social risk. High scorers speak up, take chances and do the uncomfortable thing. Low scorers hold back, wait for safety and avoid risky moves. Boldness is different from not feeling fear, it's acting anyway. It's behind a lot of what people admire, and a lot of what they regret. Bold people take more shots and so have more wins, but also more embarrassing and costly failures. Low scorers avoid those failures, but they often look back on the conversations they didn't have and the chances they didn't take.",
    highGood: ["Asking for what you want, whether it's a job, a date or a raise.", "Standing up to people with power.", "Taking chances that open doors."],
    lowGood: ["Avoiding needless risks and embarrassments.", "Waiting for the right moment instead of rushing.", "Keeping a low profile when attention would be dangerous."],
    highWatch: ["Reckless moves that you'd have avoided with a moment's thought.", "Confusing courage with not considering consequences.", "Embarrassing yourself and the people with you."],
    lowWatch: ["Regretting the things you didn't do far more than the things you did.", "Letting fear make your decisions.", "Watching bolder people get what you wanted."] },

  { name: "Playfulness",
    overview: "Playfulness is bringing humour, lightness and fun to situations. High scorers joke, tease, invent games and don't take things too seriously. Low scorers are more serious and focused, and prefer to get things done. Playfulness makes people enjoyable to be around and helps groups bond, and playful approaches can lead to creative solutions. But it can also be a way to avoid anything heavy, and constant joking can wear people down or hurt them. Serious people are less fun, but they're often more reliable when it counts, and more trusted with things that matter.",
    highGood: ["Defusing tension and bonding groups.", "Creative work where play leads to new ideas.", "Parenting, teaching and anywhere fun helps people learn."],
    lowGood: ["Serious work and situations that need gravity.", "Being trusted with important responsibilities.", "Focusing without being distracted by fun."],
    highWatch: ["Joking when someone needed you to take them seriously.", "Teasing that hurts more than you realise.", "Never being taken seriously yourself."],
    lowWatch: ["Being seen as stiff or humourless.", "Missing the bonding that play creates.", "Treating everything as serious, which makes it all heavier."] },

  { name: "Sensory Sensitivity",
    overview: "Sensory Sensitivity is how strongly you're affected by noise, light, crowds, textures and subtle cues. High scorers notice things others miss, but are also easily overwhelmed by busy, loud environments. Low scorers can tune out stimulation and function anywhere. High sensitivity is useful for noticing detail, mood and quality, and it often comes with a rich appreciation of art and nature. But much of the modern world is loud and busy, and high scorers can spend a lot of energy just coping with it. Low scorers move through those environments easily, but can miss subtle signals that matter.",
    highGood: ["Noticing details, moods and changes others miss.", "Work involving craft, taste and quality.", "Deep appreciation of music, food and nature."],
    lowGood: ["Loud, busy, chaotic workplaces and cities.", "Staying focused in distracting environments.", "Travel and situations you can't control."],
    highWatch: ["Getting overwhelmed and shutting down in busy places.", "Avoiding situations that would be worth the discomfort.", "Expecting others to accommodate every sensitivity."],
    lowWatch: ["Missing subtle signals, like a shift in someone's mood.", "Not noticing how loud or overwhelming you are to others.", "Overlooking quality and detail."] },

  { name: "Decisiveness",
    overview: "Decisiveness is making choices quickly and committing to them. High scorers decide fast and don't look back. Low scorers deliberate, weigh options and struggle to commit, often worrying they've picked wrong. Decisive people are valued as leaders because groups hate uncertainty, and many decisions matter less than the time spent making them. But fast decisions are wrong more often, and decisive people tend to commit harder to their mistakes. Indecisive people are frustrating to wait for, but on the decisions that really matter, their care can prevent serious errors.",
    highGood: ["Leadership and emergencies, where a decision now beats a perfect one later.", "Keeping projects moving.", "Not wasting energy on choices that don't matter."],
    lowGood: ["Big, irreversible decisions that deserve care.", "Gathering more information before committing.", "Staying open to changing course."],
    highWatch: ["Deciding before you have enough information.", "Committing harder to bad decisions because you made them.", "Steamrolling people who needed time to think."],
    lowWatch: ["Paralysis that makes the decision for you.", "Frustrating everyone waiting on you.", "Second-guessing choices long after they're made."] },

  { name: "Adaptability",
    overview: "Adaptability is adjusting comfortably to change, new circumstances and the unexpected. High scorers roll with it when plans change, move easily between environments and recover quickly from disruption. Low scorers prefer stability and find change stressful. Adaptability is increasingly valuable in a world that changes fast. But very adaptable people can bend so easily that they lose track of what they actually want, and they sometimes adapt to situations they should have resisted. Less adaptable people struggle with change, but they're often more consistent and more clearly themselves.",
    highGood: ["Moving, travelling and changing careers.", "Fast-changing work environments.", "Handling crises and surprises."],
    lowGood: ["Stable roles where consistency matters.", "Resisting changes that are bad, instead of going along with them.", "Keeping a clear sense of self across situations."],
    highWatch: ["Adapting to situations you should have fought.", "Losing track of what you want because you're always fitting in.", "Changing so easily that people don't know where you stand."],
    lowWatch: ["Being thrown by changes everyone else handles.", "Holding on to routines after they stop working.", "Missing opportunities that require leaving your comfort zone."] },

  { name: "Fairness",
    overview: "Fairness is refusing to cheat, exploit or take advantage of others, even when it would pay off. High scorers play by the rules, split things evenly and won't profit at someone else's expense. Low scorers are more willing to take an edge when they can get away with it. Fairness builds trust, and fair people are valued partners. But the uncomfortable truth is that in the short term, unfairness often pays, and fair people can lose out to those who don't share their scruples. High scorers can also become rigid scorekeepers, more focused on fairness than on what actually helps.",
    highGood: ["Being trusted with money, power and shared resources.", "Leading teams that feel fairly treated.", "Long-term relationships and partnerships."],
    lowGood: ["Competitive situations where others aren't playing fair either.", "Pragmatic decisions where strict fairness would help no one.", "Getting ahead in systems that reward taking an edge."],
    highWatch: ["Losing out to people who don't play fair.", "Rigid scorekeeping in relationships.", "Moral outrage that costs more than the unfairness did."],
    lowWatch: ["Gaining in the short term and losing trust for good.", "Rationalising exploitation as how the world works.", "Ending up surrounded by people who treat you the same way."] }

] AS t
MATCH (n:PersonalityTrait {name: t.name})
SET n.overview = t.overview,
    n.highGood = t.highGood, n.lowGood = t.lowGood, n.highWatch = t.highWatch, n.lowWatch = t.lowWatch;


// -----------------------------------------------------------------------------
// 4. Interactions, written from the first trait's point of view
// -----------------------------------------------------------------------------

UNWIND [

  // ---- openness ----
  { from: "Imagination", to: "Self-Discipline", description: "With discipline, imagination turns into finished work. Without it, you get a head full of projects and a desk with nothing done." },
  { from: "Imagination", to: "Anxiety", description: "A vivid imagination gives anxiety better material. High scorers in both can picture disasters in detail and react as if they'd happened." },
  { from: "Imagination", to: "Intellect", description: "Together they make an inventive thinker who can both picture new possibilities and reason about whether they'd work." },
  { from: "Artistic Interests", to: "Sensory Sensitivity", description: "Sensitivity deepens the experience of beauty, but makes ugly, loud and cluttered places harder to bear." },
  { from: "Artistic Interests", to: "Perfectionism", description: "Strong taste plus perfectionism means you can see exactly what's wrong with your own work, which can stop you finishing anything." },
  { from: "Artistic Interests", to: "Emotionality", description: "People high in both are deeply moved by art, and often use it to make sense of what they feel." },
  { from: "Emotionality", to: "Depression", description: "Paying close attention to your feelings helps when you're well. When you're low, it can turn into dwelling on the low." },
  { from: "Emotionality", to: "Sympathy", description: "Knowing your own feelings well makes it easier to recognise them in others, so these often rise together." },
  { from: "Adventurousness", to: "Excitement-Seeking", description: "Adventurousness wants new things, excitement-seeking wants intense ones. High in both, you'll chase new thrills, with the injuries and bills to match." },
  { from: "Adventurousness", to: "Cautiousness", description: "Caution makes adventure survivable. Low caution with high adventurousness is how people end up in the stories nobody wants to be in." },
  { from: "Adventurousness", to: "Adaptability", description: "Adventurous people usually adapt well, but they choose change. Adaptability is coping with change you didn't choose, and it isn't guaranteed." },
  { from: "Adventurousness", to: "Anxiety", description: "High in both is a painful mix: you want new experiences, then worry your way through them, or talk yourself out of going." },
  { from: "Intellect", to: "Decisiveness", description: "Love of ideas can slow decisions down, because there's always another angle to consider. Decisiveness is what gets the thinking to an answer." },
  { from: "Intellect", to: "Modesty", description: "High intellect with low modesty is the person who needs to win every debate. With high modesty, the same mind is a pleasure to learn from." },
  { from: "Intellect", to: "Stubbornness", description: "A clever person who digs in is hard to correct, because they can always find an argument for what they already believe." },
  { from: "Liberalism", to: "Dutifulness", description: "These pull against each other: one questions the rules, the other keeps them. High in both, you'll follow rules you think are wrong and resent it." },
  { from: "Liberalism", to: "Trust", description: "Questioning authority with low trust can tip into seeing conspiracies everywhere. With high trust, it stays healthy scepticism." },
  { from: "Liberalism", to: "Stubbornness", description: "A stubborn rule-breaker can drive real change, or reject every convention just to prove they can." },

  // ---- conscientiousness ----
  { from: "Self-Efficacy", to: "Achievement-Striving", description: "Believing you can do it and wanting to do it big is a strong engine for success, and also for overcommitting." },
  { from: "Self-Efficacy", to: "Modesty", description: "Low modesty plus high self-efficacy can come across as arrogance. High modesty can hide real confidence that people would trust if they could see it." },
  { from: "Self-Efficacy", to: "Vulnerability", description: "Believing you can cope is one of the best buffers against panic. Low self-efficacy and high vulnerability feed each other." },
  { from: "Self-Efficacy", to: "Independence", description: "Together they make someone who handles everything alone, which is impressive until it isn't." },
  { from: "Orderliness", to: "Perfectionism", description: "Order plus perfectionism can turn every space and system into something to control, and every lapse into stress." },
  { from: "Orderliness", to: "Adaptability", description: "Highly orderly people often struggle when plans change. Adaptability is what stops a disrupted plan from feeling like a crisis." },
  { from: "Orderliness", to: "Imagination", description: "Order gives imagination a place to land. Without it, good ideas get lost in the mess." },
  { from: "Dutifulness", to: "Altruism", description: "Duty plus a love of helping makes someone everybody leans on, and who rarely leans back." },
  { from: "Dutifulness", to: "Fairness", description: "Together they make someone deeply principled, who keeps promises and plays straight even when it costs them." },
  { from: "Dutifulness", to: "Self-Consciousness", description: "When self-consciousness is high, duty can become fear of being seen as letting people down, rather than keeping a commitment you believe in." },
  { from: "Achievement-Striving", to: "Perfectionism", description: "Ambition with perfectionism is the classic route to burnout: big goals and no tolerance for falling short of them." },
  { from: "Achievement-Striving", to: "Competitiveness", description: "Competitiveness points ambition at other people. That adds fuel, but makes your success depend on someone else's results." },
  { from: "Achievement-Striving", to: "Self-Discipline", description: "Ambition without discipline is a lot of plans. Discipline without ambition is reliable work toward small goals. Together they get big things done." },
  { from: "Self-Discipline", to: "Immoderation", description: "Discipline is the counterweight to cravings. High immoderation with low discipline is where habits turn into problems." },
  { from: "Self-Discipline", to: "Patience", description: "Together they make someone who can work slowly toward something for years, which is how most hard things get done." },
  { from: "Self-Discipline", to: "Depression", description: "Low mood saps discipline, and failing to keep up feeds the low mood. Each makes the other harder to fix." },
  { from: "Cautiousness", to: "Anxiety", description: "Together they make someone who prepares for everything, and often never starts." },
  { from: "Cautiousness", to: "Decisiveness", description: "These pull in opposite directions. The best decision-makers have both: they think it through, then commit." },
  { from: "Cautiousness", to: "Excitement-Seeking", description: "Low caution with high excitement-seeking is the most accident-prone combination in the model." },
  { from: "Cautiousness", to: "Boldness", description: "Bold and cautious isn't a contradiction. It's taking risks that have been thought through." },

  // ---- extraversion ----
  { from: "Friendliness", to: "Trust", description: "Warmth plus trust makes friends fast, and makes you an easy target for people who fake warmth back." },
  { from: "Friendliness", to: "Gregariousness", description: "These often go together, but not always. Some warm people are happiest one-on-one, and some sociable people like crowds but keep everyone at arm's length." },
  { from: "Friendliness", to: "Morality", description: "Warmth that isn't backed by honesty becomes charm, and people eventually notice." },
  { from: "Gregariousness", to: "Self-Consciousness", description: "Wanting company while worrying how you come across is draining: you seek out groups, then spend the evening monitoring yourself." },
  { from: "Gregariousness", to: "Independence", description: "Independent people who love company want people around but not in charge, which can confuse those trying to get close." },
  { from: "Assertiveness", to: "Cooperation", description: "Assertive and cooperative is the effective leader: clear about what they want, willing to give ground. Assertive and uncooperative is the bully." },
  { from: "Assertiveness", to: "Anger", description: "Assertiveness plus a short fuse makes someone who's hard to argue with, and harder to work for." },
  { from: "Assertiveness", to: "Self-Efficacy", description: "When assertiveness runs ahead of self-efficacy, you lead with confidence you don't feel. When it lags, you know the answer and don't say it." },
  { from: "Assertiveness", to: "Modesty", description: "High assertiveness with high modesty is rare and valuable: someone who takes charge without needing the credit." },
  { from: "Activity Level", to: "Patience", description: "High-tempo people often find patience hard. Together, they make someone energetic who can still wait for things to pay off." },
  { from: "Activity Level", to: "Cautiousness", description: "Speed plus caution is rare. More often, high activity means fast and occasionally sloppy." },
  { from: "Activity Level", to: "Vulnerability", description: "A busy life with low stress tolerance is fragile: it works until one more thing lands, then everything tips over." },
  { from: "Excitement-Seeking", to: "Immoderation", description: "The thrill-seeker who can't resist urges is at serious risk of addiction and debt. This is the combination to watch most closely." },
  { from: "Excitement-Seeking", to: "Boldness", description: "Excitement-seekers enjoy risk. Bold people act despite it. Together, risk stops feeling like a reason to stop." },
  { from: "Excitement-Seeking", to: "Patience", description: "Craving intensity makes slow, steady progress feel unbearable, so long-term goals suffer." },
  { from: "Cheerfulness", to: "Optimism", description: "Cheerful optimists are a joy to be around, and the most likely to underestimate a real problem." },
  { from: "Cheerfulness", to: "Depression", description: "These aren't simple opposites. Some people are cheerful in company and low in private, and the cheerfulness hides it." },
  { from: "Cheerfulness", to: "Playfulness", description: "Together they make a natural mood-lifter, as long as they can read when the room needs something else." },

  // ---- agreeableness ----
  { from: "Trust", to: "Anxiety", description: "Low trust plus high anxiety can become suspicion that feels like insight: you're certain people are against you." },
  { from: "Trust", to: "Altruism", description: "Trusting and generous makes you a gift to good people and a target for bad ones." },
  { from: "Trust", to: "Cautiousness", description: "Caution is what keeps high trust from being exploited: you give the benefit of the doubt, but you still check." },
  { from: "Morality", to: "Assertiveness", description: "Honesty plus assertiveness says the hard thing out loud. Honesty without it says nothing, which isn't quite the same as being honest." },
  { from: "Morality", to: "Fairness", description: "Straightforward and fair is the person everyone trusts to hold the money and settle disputes." },
  { from: "Morality", to: "Competitiveness", description: "Competitiveness tempts people to bend the rules. High morality is what stops them." },
  { from: "Altruism", to: "Self-Efficacy", description: "Generous people who believe they can fix things take on everyone's problems, and can't understand why they're exhausted." },
  { from: "Altruism", to: "Resilience", description: "Resilience lets givers keep giving through hard times. Without it, altruism burns out fast." },
  { from: "Altruism", to: "Modesty", description: "High in both, you give without asking for thanks, and can be badly taken for granted." },
  { from: "Cooperation", to: "Stubbornness", description: "Cooperative people who are also stubborn give way on small things and won't move on big ones, which is often exactly right." },
  { from: "Cooperation", to: "Anger", description: "Avoiding conflict while getting angry easily is a pressure cooker: the anger builds up instead of being dealt with." },
  { from: "Cooperation", to: "Assertiveness", description: "High cooperation with low assertiveness means you'll be agreeable to a fault and nobody will know what you actually wanted." },
  { from: "Modesty", to: "Achievement-Striving", description: "Ambitious and modest people do great work and let others take the credit, which they often then resent." },
  { from: "Modesty", to: "Self-Consciousness", description: "Sometimes modesty is humility, and sometimes it's fear of being noticed. Self-consciousness is often the difference." },
  { from: "Modesty", to: "Competitiveness", description: "Low modesty with high competitiveness can make every interaction about who's better." },
  { from: "Sympathy", to: "Vulnerability", description: "Feeling others' pain while being easily overwhelmed means other people's crises become yours." },
  { from: "Sympathy", to: "Fairness", description: "Sympathy wants to help the person in front of you. Fairness wants the same rules for everyone. They often disagree." },
  { from: "Sympathy", to: "Altruism", description: "Sympathy feels the pain, altruism does something about it. You can have one without the other." },

  // ---- neuroticism ----
  { from: "Anxiety", to: "Perfectionism", description: "Anxious perfectionists are driven by fear of failing rather than desire to excel, and it shows in procrastination and exhaustion." },
  { from: "Anxiety", to: "Optimism", description: "Anxiety and low optimism feed each other: you expect the worst, then worry about it." },
  { from: "Anxiety", to: "Boldness", description: "Boldness is how anxious people still live full lives. It doesn't remove the fear, it just stops it from deciding." },
  { from: "Anger", to: "Cooperation", description: "Anger with low cooperation leads to open conflict. With high cooperation, it gets swallowed and turns into resentment." },
  { from: "Anger", to: "Fairness", description: "People with a strong sense of fairness get angry at injustice. That can drive change, or make you exhausting to be around." },
  { from: "Anger", to: "Patience", description: "Patience is what gives anger time to cool before it does damage." },
  { from: "Depression", to: "Resilience", description: "Resilience is how quickly you climb out. Low mood plus low resilience means you can stay down for a long time." },
  { from: "Depression", to: "Gregariousness", description: "Low mood makes company feel like effort, but withdrawing usually makes it worse." },
  { from: "Self-Consciousness", to: "Assertiveness", description: "Self-consciousness is one of the main things that holds back people who'd otherwise speak up." },
  { from: "Self-Consciousness", to: "Perfectionism", description: "Worrying how you look plus high standards means everything you show people has to be flawless, so you show them less." },
  { from: "Self-Consciousness", to: "Playfulness", description: "Playfulness needs a willingness to look silly. Self-conscious people often have the humour but not the freedom to use it." },
  { from: "Immoderation", to: "Excitement-Seeking", description: "Together they're the strongest predictor of risky habits in this model. If you're high in both, build guardrails." },
  { from: "Immoderation", to: "Anxiety", description: "Many cravings are attempts to calm worry. Fixing the urge often means dealing with the anxiety underneath it." },
  { from: "Immoderation", to: "Depression", description: "Low mood makes urges harder to resist, and giving in often makes the low mood worse." },
  { from: "Vulnerability", to: "Resilience", description: "Vulnerability is how hard stress hits. Resilience is how fast you recover. You can be high in both: you fall apart, then pull yourself back together." },
  { from: "Vulnerability", to: "Orderliness", description: "Structure protects people who are easily overwhelmed. When the routine breaks, they can struggle more than most." },
  { from: "Vulnerability", to: "Independence", description: "Highly independent people who are easily overwhelmed often hit crisis alone, because they never built a support network." },

  // ---- beyond the big five ----
  { from: "Patience", to: "Achievement-Striving", description: "Patience is what lets ambition survive the long boring middle of any big goal." },
  { from: "Patience", to: "Assertiveness", description: "Patient people with low assertiveness can wait forever for something they never asked for." },
  { from: "Patience", to: "Cooperation", description: "Patience plus cooperation makes a great teammate, and someone who'll tolerate a bad situation far too long." },
  { from: "Resilience", to: "Optimism", description: "Optimism helps you get back up, because you expect the next try to go better." },
  { from: "Resilience", to: "Stubbornness", description: "Resilience plus stubbornness can endure anything, including things that should have been abandoned." },
  { from: "Resilience", to: "Emotionality", description: "Resilient people who are also aware of their feelings recover without pretending it didn't hurt." },
  { from: "Optimism", to: "Cautiousness", description: "Caution is the counterweight to optimism's blind spots: expect it to work, and plan for when it doesn't." },
  { from: "Optimism", to: "Self-Efficacy", description: "Optimism is about the world, self-efficacy is about you. Together they make someone who'll try almost anything." },
  { from: "Optimism", to: "Trust", description: "Optimistic and trusting people expect the best from situations and people alike, and are let down more often than they expect." },
  { from: "Perfectionism", to: "Decisiveness", description: "Perfectionism slows decisions, because every option has flaws. Decisive perfectionists commit and then fret." },
  { from: "Perfectionism", to: "Self-Discipline", description: "Disciplined perfectionists produce excellent work. Undisciplined ones produce excellent plans and no work." },
  { from: "Perfectionism", to: "Depression", description: "When standards are unreachable, every result feels like failing, and over time that wears mood down." },
  { from: "Competitiveness", to: "Friendliness", description: "Warm competitors can be rivals and friends. Without warmth, competition crowds friendship out." },
  { from: "Competitiveness", to: "Fairness", description: "Competitive and fair people want to win, but only properly. Without fairness, winning is all that counts." },
  { from: "Competitiveness", to: "Anger", description: "Competitive people with short fuses take losses personally, and make others pay for them." },
  { from: "Stubbornness", to: "Self-Discipline", description: "Stubbornness plus discipline is determination: the person who finishes a marathon on a broken toe." },
  { from: "Stubbornness", to: "Cooperation", description: "Low cooperation and high stubbornness makes someone almost impossible to work with in a disagreement." },
  { from: "Stubbornness", to: "Intellect", description: "Smart, stubborn people are the hardest to change your mind, because they argue well for what they already think." },
  { from: "Independence", to: "Trust", description: "Independence is sometimes just low trust in disguise: you do it yourself because you don't believe others will." },
  { from: "Independence", to: "Liberalism", description: "Independent people who question authority are hard to manage, and often happiest working for themselves." },
  { from: "Independence", to: "Gregariousness", description: "Independent people can love company, they just don't want it making their decisions." },
  { from: "Boldness", to: "Self-Consciousness", description: "Boldness is acting anyway. For self-conscious people, that's what turns fear of judgement into something they can push through." },
  { from: "Boldness", to: "Assertiveness", description: "Bold and assertive people are the ones who ask, push and lead, and are sometimes wrong in front of everyone." },
  { from: "Boldness", to: "Cautiousness", description: "Bold without caution is reckless. Bold with it is brave." },
  { from: "Playfulness", to: "Sympathy", description: "Playfulness with sympathy knows when to stop joking. Without it, humour can hurt people at their lowest." },
  { from: "Playfulness", to: "Imagination", description: "Playful, imaginative people invent games and stories and see fun ideas others don't." },
  { from: "Playfulness", to: "Dutifulness", description: "Playful and dutiful people get the work done and make it fun, which is rarer than it should be." },
  { from: "Sensory Sensitivity", to: "Gregariousness", description: "Wanting company but being overwhelmed by crowds means you'll seek people out, then need to escape." },
  { from: "Sensory Sensitivity", to: "Vulnerability", description: "Sensitive people who are easily overwhelmed can hit their limit quickly in loud, busy places." },
  { from: "Sensory Sensitivity", to: "Sympathy", description: "Sensitivity to subtle cues helps you notice others' feelings, which is often where sympathy starts." },
  { from: "Decisiveness", to: "Stubbornness", description: "Decisive and stubborn is fast to decide and slow to admit it was wrong." },
  { from: "Decisiveness", to: "Anxiety", description: "Anxiety slows decisions because every option has a downside to worry about." },
  { from: "Decisiveness", to: "Assertiveness", description: "Together they make someone who naturally takes charge, and who others follow quickly." },
  { from: "Adaptability", to: "Stubbornness", description: "Adaptable people can still be stubborn about what matters. That's the healthy version: flexible on how, firm on why." },
  { from: "Adaptability", to: "Resilience", description: "Adaptability lets you adjust to change, resilience lets you recover from it. Together they're the best protection against a world that keeps changing." },
  { from: "Adaptability", to: "Cooperation", description: "Highly adaptable, cooperative people can bend so much they lose track of what they wanted." },
  { from: "Fairness", to: "Trust", description: "Fair people often assume others are fair too, and are shocked when they're not." },
  { from: "Fairness", to: "Altruism", description: "Fairness says everyone gets the same. Altruism says give more than you have to. They can make you either rigid or generous." },
  { from: "Fairness", to: "Morality", description: "Fair and straightforward people are trusted, and often outmanoeuvred by those who are neither." }

] AS i
MATCH (a:PersonalityTrait {name: i.from}), (b:PersonalityTrait {name: i.to})
MERGE (a)-[r:INTERACTS_WITH]->(b)
SET r.description = i.description;
