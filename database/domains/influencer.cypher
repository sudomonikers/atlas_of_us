// Domain: Influencer
// Generated: 2025-11-16
// Description: The practice of building an audience and creating content to influence, engage, and monetize through social media platforms

// ============================================================
// DOMAIN: Influencer
// Generated: 2025-11-16
// Agent 1: Domain Structure
// ============================================================

// Create Domain
CREATE (d:Domain {
  name: 'Influencer',
  description: 'The practice of building an audience and creating content to influence, engage, and monetize through social media platforms. This domain encompasses audience growth, content creation, community management, brand partnerships, and monetization strategies across platforms.',
  level_count: 5,
  created_date: date(),
  scope_included: ['audience building and growth strategies', 'content creation and production', 'social media platform expertise', 'community engagement and management', 'brand partnerships and sponsorships', 'monetization strategies', 'analytics and audience insights', 'personal branding', 'consistency and scheduling', 'platform-specific optimization', 'storytelling and narrative building', 'collaboration with other creators'],
  scope_excluded: ['general social media use (separate domain)', 'graphic design or video production as standalone professions (separate domains)', 'marketing strategy and campaigns (separate domain - broader business context)', 'e-commerce or product sales (separate domain)', 'professional content creation without audience focus (separate domain)', 'public speaking or presentation skills (separate domain)']
});

// Create Domain Levels
CREATE (level1:Domain_Level {
  level: 1,
  name: 'Influencer Novice',
  description: 'Beginning to understand social media platforms, learning basic content creation, starting to build initial audience awareness. Creating simple posts, experimenting with different content types, and learning platform mechanics.'
});

CREATE (level2:Domain_Level {
  level: 2,
  name: 'Influencer Developing',
  description: 'Building consistent content rhythm, growing engaged audience, learning audience analytics, beginning to develop personal brand voice. Creating varied content formats, establishing posting schedules, and understanding audience preferences.'
});

CREATE (level3:Domain_Level {
  level: 3,
  name: 'Influencer Competent',
  description: 'Maintaining steady audience growth with quality content, understanding platform algorithms, managing community relationships, attracting first brand partnerships. Producing high-quality content consistently, leveraging analytics to guide decisions, and engaging meaningfully with followers.'
});

CREATE (level4:Domain_Level {
  level: 4,
  name: 'Influencer Advanced',
  description: 'Commanding significant engaged audience, negotiating brand deals and sponsorships, optimizing monetization, mentoring emerging creators. Creating trendsetting content, building strategic partnerships, and establishing multiple revenue streams.'
});

CREATE (level5:Domain_Level {
  level: 5,
  name: 'Influencer Master',
  description: 'Operating at the highest levels of influence with large audience impact, setting trends across platforms, leading industry collaborations, advancing the creator economy. Shaping culture, mentoring other influencers, and expanding influence across multiple platforms and ventures.'
});

// Connect Domain to Levels
MATCH (d:Domain {name: 'Influencer'})
MATCH (level1:Domain_Level {name: 'Influencer Novice'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level1);

MATCH (d:Domain {name: 'Influencer'})
MATCH (level2:Domain_Level {name: 'Influencer Developing'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level2);

MATCH (d:Domain {name: 'Influencer'})
MATCH (level3:Domain_Level {name: 'Influencer Competent'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level3);

MATCH (d:Domain {name: 'Influencer'})
MATCH (level4:Domain_Level {name: 'Influencer Advanced'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level4);

MATCH (d:Domain {name: 'Influencer'})
MATCH (level5:Domain_Level {name: 'Influencer Master'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level5);

// ============================================================
// Agent 2b: Skill Nodes
// ============================================================

// Basic Content Creation Skills (Novice Level)

MERGE (s:Skill {name: 'Content Planning and Ideation'})
ON CREATE SET s.description = 'The ability to generate content ideas, plan what to create, and organize ideas into a content calendar. This foundational skill enables consistent content production and prevents creative block.',
              s.how_to_develop = 'Spend 15 minutes daily brainstorming content ideas. Keep an ideas notebook or digital folder. Study 10 successful creators in your niche and document their content themes. Create a content calendar for 2 weeks. Expected time: 2-3 weeks.',
              s.novice_level = 'Can generate some basic content ideas. Relies on inspiration in the moment. Ideas are scattered and unorganized. To progress: Start an ideas list and plan content weekly.',
              s.advanced_beginner_level = 'Generates ideas consistently but planning is still reactive. Can plan 1-2 weeks ahead. Beginning to identify content themes. To progress: Develop systematic brainstorming methods.',
              s.competent_level = 'Produces steady stream of relevant ideas and maintains 2-4 week content calendar. Can identify gaps in content mix. Plans content strategically. To progress: Develop themed content series and batching.',
              s.proficient_level = 'Ideas flow naturally aligned with audience needs and trends. Plans 6-8 weeks ahead with content themes and series. Integrates analytics into planning intuitively. To progress: Experiment with content experimentation cycles.',
              s.expert_level = 'Generates innovative ideas that align perfectly with audience and platform trends. Content planning is strategic and predictive. Can pivot quickly while maintaining consistency. Planning is second nature.';

MERGE (s:Skill {name: 'Basic Video Recording'})
ON CREATE SET s.description = 'The ability to record basic video content using smartphone or camera, including framing, lighting basics, and audio quality. Essential for all video-based platforms.',
              s.how_to_develop = 'Record 20 videos using your smartphone. Practice different locations and lighting conditions. Study filming basics in YouTube tutorials. Review your recordings for improvements. Expected time: 2-3 weeks.',
              s.novice_level = 'Can record videos but quality is inconsistent. Often out of focus or poorly lit. Audio is sometimes unclear. To progress: Learn smartphone camera settings and basic lighting principles.',
              s.advanced_beginner_level = 'Videos are mostly in focus with decent lighting. Framing is improving but composition is inconsistent. Audio is usually clear. To progress: Study composition rules and consistent framing.',
              s.competent_level = 'Records technically sound videos with good focus, lighting, and audio. Frames content appropriately for platform. Knows when to reshoot. To progress: Develop signature visual style.',
              s.proficient_level = 'Recording is automatic and high quality. Adjusts framing and lighting quickly for different settings. Anticipates technical issues. Visual style is consistent and professional. To progress: Experiment with advanced equipment.',
              s.expert_level = 'Creates visually compelling videos with professional quality. Lighting, framing, and audio are instinctively excellent. Adapts quickly to any environment. Video recording is no longer a limitation.';

MERGE (s:Skill {name: 'Caption and Hashtag Writing'})
ON CREATE SET s.description = 'The ability to write engaging captions that complement content and strategically use hashtags to improve discoverability. Captions drive engagement and context.',
              s.how_to_develop = 'Write captions for 30+ posts and track which get better engagement. Study caption styles of top creators in your niche. Learn hashtag research using platform tools. Test different caption lengths. Expected time: 3-4 weeks.',
              s.novice_level = 'Captions are basic and sometimes unclear. Hashtags are random or copied from others. Captions don\'t add value to content. To progress: Study engagement-driving caption formulas.',
              s.advanced_beginner_level = 'Captions are clear but sometimes generic. Hashtag choices are improving but inconsistent. Beginning to see which caption styles work. To progress: Develop personal caption voice and hashtag strategy.',
              s.competent_level = 'Writes captions that add context and spark engagement. Uses strategic hashtag combinations that attract relevant followers. Understands what works for your audience. To progress: Develop caption hooks and storytelling.',
              s.proficient_level = 'Captions feel natural and engaging, with strong voice. Hashtag strategy is refined and data-driven. Caption length and style optimize for each post type. To progress: Experiment with caption formats and hooks.',
              s.expert_level = 'Captions are compelling and authentic, driving significant engagement. Hashtag strategy is sophisticated and continuously optimized. Captions enhance content without feeling forced. Written voice is instantly recognizable.';

MERGE (s:Skill {name: 'Basic Photo Editing'})
ON CREATE SET s.description = 'The ability to edit photos using basic tools for brightness, contrast, color correction, and simple effects. Ensures visual consistency and professional appearance.',
              s.how_to_develop = 'Edit 50 photos using Canva, Lightroom Mobile, or Snapseed. Learn brightness, contrast, saturation, and temperature adjustments. Create 3-5 preset styles. Expected time: 2-3 weeks.',
              s.novice_level = 'Can use basic filters but edits are inconsistent or overdone. Colors and lighting aren\'t always balanced. To progress: Learn color correction and restraint in editing.',
              s.advanced_beginner_level = 'Edits improve photo quality with better colors and lighting. Developing a consistent editing style. Sometimes over-edits. To progress: Study professional editing and restraint.',
              s.competent_level = 'Consistently edits photos with good color, brightness, and clarity. Visual style is recognizable. Knows when to use filters vs. manual adjustments. To progress: Develop signature filter presets.',
              s.proficient_level = 'Edits photos intuitively with professional quality. Has refined presets that create instant brand recognition. Edits enhance without transforming. Visual consistency is automatic. To progress: Experiment with advanced techniques.',
              s.expert_level = 'Photos are edited to professional standards with cohesive aesthetic. Preset system is refined and instantly recognizable. Editing enhances content while maintaining authenticity. Visual brand is unmistakable.';

MERGE (s:Skill {name: 'Platform Navigation and Feature Familiarity'})
ON CREATE SET s.description = 'The ability to navigate social media platforms and understand their features, from posting to analytics to settings. Foundation for all platform-specific activities.',
              s.how_to_develop = 'Spend 1 hour exploring each platform\'s features. Try every major feature (stories, reels, polls, etc.). Read platform help documentation. Practice with test posts. Expected time: 1-2 weeks.',
              s.novice_level = 'Can find main features but sometimes gets confused about where things are. Doesn\'t know all features available. To progress: Systematically explore all platform features.',
              s.advanced_beginner_level = 'Navigates platform smoothly and knows most major features. May miss lesser-used features or updates. To progress: Stay current with platform changes.',
              s.competent_level = 'Navigates effortlessly and knows all major features. Understands where to find settings, analytics, and tools. Stays aware of platform updates. To progress: Learn advanced feature combinations.',
              s.proficient_level = 'Completely fluent on platform. Knows all features and how they interact. Adapts quickly to platform changes. Can find solutions intuitively. To progress: Master lesser-used features.',
              s.expert_level = 'Expert knowledge of all platform features and their interactions. Anticipates platform changes. Can leverage obscure features creatively. Platform navigation is unconscious.';

// Intermediate Communication and Engagement Skills

MERGE (s:Skill {name: 'Authentic Community Engagement'})
ON CREATE SET s.description = 'The ability to respond to followers meaningfully, create genuine conversations, and build relationships rather than just collecting followers. Creates loyal community.',
              s.how_to_develop = 'Spend 30 minutes daily engaging with your community. Respond to every comment for 30 days. Ask questions that encourage replies. Reply personally (not with generic responses). Track which engagement types build best relationships. Expected time: 6-8 weeks.',
              s.novice_level = 'Engages occasionally but responses feel forced or generic. Engagement is sporadic. To progress: Practice personalized responses and genuine curiosity.',
              s.advanced_beginner_level = 'Responds to most comments with more thought. Engagement is more frequent. Beginning to build recognizable personalities. To progress: Develop genuine conversation skills.',
              s.competent_level = 'Engages authentically and meaningfully with most followers. Responses feel personal and genuine. Community relationships are developing. To progress: Build deeper one-on-one relationships.',
              s.proficient_level = 'Engagement feels natural and builds strong community bonds. Followers feel valued and known. Community dynamics are healthy and supportive. To progress: Scale engagement without losing authenticity.',
              s.expert_level = 'Creates thriving community with strong sense of belonging. Engagement is authentically personal at scale. Followers feel directly connected to you. Community becomes self-sustaining.';

MERGE (s:Skill {name: 'Hook Writing and Attention Capture'})
ON CREATE SET s.description = 'The ability to create opening statements or visual hooks that stop scrolling and grab attention. Critical for algorithm distribution and engagement.',
              s.how_to_develop = 'Analyze hooks in 50 high-performing posts from creators in your niche. Document what hooks they use. Write 3-5 hook variations for each content idea. A/B test hooks on different posts. Expected time: 4-6 weeks.',
              s.novice_level = 'Creates basic opening lines but content doesn\'t stand out. Doesn\'t understand what stops scrolling. To progress: Study successful hooks and practice writing variations.',
              s.advanced_beginner_level = 'Some hooks work better than others. Beginning to understand attention-grabbing patterns. To progress: Analyze your best-performing openings.',
              s.competent_level = 'Consistently creates hooks that stop scrolling. Understands which hook types work for your audience. Uses them strategically. To progress: Develop signature hook styles.',
              s.proficient_level = 'Hooks feel natural and are highly effective. Intuitively knows what will stop scrolling for your audience. Hook effectiveness is reliable. To progress: Innovate hook styles ahead of trends.',
              s.expert_level = 'Creates hooks that are almost impossible to scroll past. Hook writing is intuitive and consistently effective. Hooks feel authentic while being compelling. Attention capture is effortless.';

MERGE (s:Skill {name: 'Visual Consistency and Branding'})
ON CREATE SET s.description = 'The ability to maintain consistent visual aesthetic across all posts. Creates recognizable brand identity and professional appearance.',
              s.how_to_develop = 'Create a visual style guide with colors, fonts, and filters. Edit all posts through same preset system. Review your feed as a cohesive whole. Take screenshots of competitor feeds for inspiration. Expected time: 4-6 weeks.',
              s.novice_level = 'Posts don\'t have consistent visual style. Colors and filters vary widely. Feed doesn\'t look cohesive. To progress: Choose a color palette and commit to it.',
              s.advanced_beginner_level = 'Attempting consistency but not all posts follow the style. Some visual themes present. Feed is starting to look cohesive. To progress: Develop preset system and discipline.',
              s.competent_level = 'Visual style is consistent and recognizable. Color palette and filters are uniform. Feed looks professional and intentional. To progress: Refine and personalize the style.',
              s.proficient_level = 'Visual brand is instantly recognizable and professional. Consistency is automatic. Aesthetic is refined and cohesive across all content. To progress: Evolve style while maintaining recognition.',
              s.expert_level = 'Visual brand is unmistakable and aspirational. Consistency is effortless and perfect. Aesthetic sets trends in your niche. Visual identity is deeply personal.';

MERGE (s:Skill {name: 'Trending Audio and Music Selection'})
ON CREATE SET s.description = 'The ability to identify and use trending sounds and music that align with content and resonate with audience. Trending audio boosts algorithmic distribution.',
              s.how_to_develop = 'Check trending sounds daily on TikTok and Instagram. Use 10+ trending sounds in your content. Track which trending sounds get best engagement. Build personal library of audio. Expected time: 4-6 weeks.',
              s.novice_level = 'Uses some trending audio but choices are inconsistent. Doesn\'t understand which audio fits content. To progress: Study trending audio charts regularly.',
              s.advanced_beginner_level = 'Uses trending audio more often with better fit. Beginning to understand audio-to-content pairing. To progress: Develop ear for what works with your content.',
              s.competent_level = 'Selects trending audio that fits content and boosts engagement. Understands audio timing and cuts well. Knows which trends are fading vs. rising. To progress: Predict trends ahead of peak.',
              s.proficient_level = 'Audio selection is strategic and perfectly timed. Instinctively knows which sounds work for your audience. Can use trending audio authentically. To progress: Mix trending with timeless audio.',
              s.expert_level = 'Audio selection maximizes engagement while feeling natural. Predicts trending audio before peak. Can make any audio trend in your niche. Audio intuition is sophisticated.';

// Advanced Platform and Algorithm Skills

MERGE (s:Skill {name: 'Algorithm Optimization and Distribution'})
ON CREATE SET s.description = 'The ability to understand and leverage platform algorithms to maximize content distribution. Includes understanding ranking factors and content structure optimization.',
              s.how_to_develop = 'Study platform algorithm documentation and creator blogs. Analyze which of your posts get algorithmic boosts. Test different content structures. Track 50+ posts and their performance. Expected time: 10-12 weeks.',
              s.novice_level = 'Doesn\'t understand how algorithms work. Posts seem to have inconsistent reach. To progress: Learn about engagement rate, video completion, and algorithm ranking factors.',
              s.advanced_beginner_level = 'Beginning to understand algorithm basics. Recognizing that engagement affects distribution. Making first attempts at optimization. To progress: Study your best-performing content.',
              s.competent_level = 'Understands algorithm principles and optimizes content structure. Consistently creates content that gets good algorithmic distribution. Makes deliberate choices to boost reach. To progress: Develop predictive understanding.',
              s.proficient_level = 'Algorithm optimization is intuitive and highly effective. Quickly adjusts to algorithm changes. Creates content that reliably gets algorithmic boost. To progress: Stay ahead of algorithm trends.',
              s.expert_level = 'Deeply understands algorithm mechanics and exploits them authentically. Predicts algorithm changes and adapts fluidly. Consistently achieves maximum algorithmic distribution. Algorithm strategy is sophisticated.';

MERGE (s:Skill {name: 'Multi-Platform Content Adaptation'})
ON CREATE SET s.description = 'The ability to adapt the same content across multiple platforms while respecting platform-specific differences and audience expectations.',
              s.how_to_develop = 'Create same content in multiple formats (TikTok, Instagram Reel, YouTube Short). Track performance differences. Document platform-specific adjustments. Maintain presence on 4+ platforms. Expected time: 12-16 weeks.',
              s.novice_level = 'Copies content between platforms without adaptation. Results are inconsistent. To progress: Study how successful creators adapt across platforms.',
              s.advanced_beginner_level = 'Making some platform-specific adjustments. Beginning to understand platform differences. Results improving. To progress: Develop platform-specific best practices.',
              s.competent_level = 'Adapts content effectively for each platform. Understands platform-specific audience expectations and algorithm preferences. Content performs well across platforms. To progress: Develop signature cross-platform strategies.',
              s.proficient_level = 'Content adaptation is seamless and automatic. Each platform version feels native while maintaining coherent message. Audiences on different platforms feel served. To progress: Create platform-unique content.',
              s.expert_level = 'Content strategy is sophisticated across platforms. Each platform version is optimized yet unified. Can grow audiences simultaneously across multiple platforms. Cross-platform execution is flawless.';

MERGE (s:Skill {name: 'Analytics Deep Dive and Interpretation'})
ON CREATE SET s.description = 'The ability to analyze platform and audience analytics deeply, identifying patterns and insights that inform strategy. Goes beyond surface metrics.',
              s.how_to_develop = 'Export and analyze 100+ posts from your analytics. Create tracking spreadsheets for metrics. Identify correlations between content variables and performance. Use analytics tools like Later or Buffer. Expected time: 10-12 weeks.',
              s.novice_level = 'Views analytics but doesn\'t understand what data means. Can\'t extract actionable insights. To progress: Learn what each metric indicates.',
              s.advanced_beginner_level = 'Understands basic metrics. Occasionally finds patterns. Beginning to make strategy adjustments based on data. To progress: Develop systematic analysis processes.',
              s.competent_level = 'Analyzes data regularly and finds actionable insights. Makes deliberate strategy adjustments based on analytics. Understands correlations between variables. To progress: Develop predictive analytics skills.',
              s.proficient_level = 'Analytics interpretation is second nature. Quickly identifies patterns and anomalies. Makes intuitive, data-informed decisions. Explains insights clearly. To progress: Develop predictive models.',
              s.expert_level = 'Sophisticated analytics interpretation reveals hidden patterns. Predictive understanding of audience behavior. Uses data to drive sophisticated strategy. Analytics expertise is industry-level.';

MERGE (s:Skill {name: 'Content Batching and Production Systems'})
ON CREATE SET s.description = 'The ability to produce content in batches efficiently, maintaining quality and consistency while scaling output. Enables sustainable, high-volume production.',
              s.how_to_develop = 'Design a content production schedule. Batch create 20+ pieces of content. Implement batching for filming, editing, and scheduling. Document your process. Measure time savings. Expected time: 8-10 weeks.',
              s.novice_level = 'Produces content one at a time. Production is sporadic and slow. To progress: Start batching content even just 2 weeks ahead.',
              s.advanced_beginner_level = 'Beginning to batch content with mixed results. Process is not yet optimized. To progress: Systematize your batching workflow.',
              s.competent_level = 'Batches content regularly and maintains quality. Production is more efficient. Can sustain regular posting schedule easily. To progress: Develop pre-batching systems.',
              s.proficient_level = 'Batching process is efficient and automatic. Quality remains consistently high. Can produce multiple weeks of content in dedicated sessions. To progress: Implement team systems.',
              s.expert_level = 'Production systems are optimized and scalable. Batching process allows massive output without quality loss. Can manage 3-4x normal production volume. Systems are sophisticated.';

// Expert-Level Strategic Skills

MERGE (s:Skill {name: 'Brand Partnership Proposal and Negotiation'})
ON CREATE SET s.description = 'The ability to identify partnership opportunities, create compelling proposals, and negotiate fair terms. Essential for monetization and growth.',
              s.how_to_develop = 'Research 20+ brand partnerships in your niche. Create 3-5 partnership proposal templates. Outreach to 10+ potential brand partners. Negotiate 3+ partnerships. Study contract terms. Expected time: 16-20 weeks.',
              s.novice_level = 'Doesn\'t know how to approach brand partnerships. Unfamiliar with proposal structure. To progress: Study brand partnership case studies.',
              s.advanced_beginner_level = 'Beginning to understand partnership opportunities. Made first outreach attempts. Needs development in negotiation. To progress: Study negotiation and proposal writing.',
              s.competent_level = 'Creates solid partnership proposals and negotiates reasonable terms. Understands fair market rates. Manages partnerships professionally. To progress: Develop predictive business strategy.',
              s.proficient_level = 'Partnership proposals are compelling and frequently accepted. Negotiation is smooth and results in good terms. Manages partnerships intuitively. To progress: Scale partnership opportunities.',
              s.expert_level = 'Negotiation is sophisticated and consistently achieves favorable terms. Identifies opportunities others miss. Partnership strategy is central to revenue. Can command premium rates.';

MERGE (s:Skill {name: 'Trend Anticipation and Prediction'})
ON CREATE SET s.description = 'The ability to identify emerging trends before they peak, predict trend trajectory, and know when to create trend-based content. Enables first-mover advantage.',
              s.how_to_develop = 'Track emerging trends daily for 12+ weeks. Document trend lifecycles. Create trend content at different stages. Analyze which positions (early vs. peak vs. late) perform best. Expected time: 16-20 weeks.',
              s.novice_level = 'Jumps on trends after they\'ve peaked. Trend timing is usually wrong. To progress: Track trends more carefully and jump in earlier.',
              s.advanced_beginner_level = 'Catches some trends at reasonable time. Still misses many opportunities. Beginning to understand trend timing. To progress: Use trend tracking tools consistently.',
              s.competent_level = 'Identifies trends before peak and creates timely content. Understands trend lifecycles. Rarely misses major trends. To progress: Predict emerging trends.',
              s.proficient_level = 'Trends are identified early consistently. Can sense emerging trends through observation. Trend timing is nearly perfect. To progress: Lead trends rather than follow.',
              s.expert_level = 'Anticipates trends before they fully emerge. Intuitive understanding of cultural timing. Often first to trends in your niche. Can shape trends rather than just ride them.';

MERGE (s:Skill {name: 'Influence Monetization and Revenue Diversification'})
ON CREATE SET s.description = 'The ability to develop and manage multiple revenue streams from influence: sponsorships, affiliate marketing, digital products, consulting. Creates sustainable income.',
              s.how_to_develop = 'Implement 3-5 different monetization methods. Track revenue from each stream. Optimize each stream for 6+ months. Study revenue diversification strategies. Expected time: 20-24 weeks.',
              s.novice_level = 'Beginning to explore monetization options. May have one small revenue stream. To progress: Implement second and third revenue streams.',
              s.advanced_beginner_level = 'Has 2-3 revenue streams but optimization is basic. Income is modest. To progress: Develop strategy to optimize each stream.',
              s.competent_level = 'Manages 3-4 revenue streams professionally. Income is meaningful. Understands optimization for each stream. To progress: Develop integrated revenue strategy.',
              s.proficient_level = 'Revenue streams are balanced and optimized. Multiple streams provide solid income. Understands which streams to emphasize. To progress: Create sophisticated revenue products.',
              s.expert_level = 'Monetization strategy is sophisticated and diversified. Multiple revenue streams are substantial and sustainable. Can predict and optimize income growth. Revenue expertise is sophisticated.';

MERGE (s:Skill {name: 'Crisis Management and Reputation Protection'})
ON CREATE SET s.description = 'The ability to handle negative feedback, manage controversies, and protect reputation during challenges. Essential for long-term influence sustainability.',
              s.how_to_develop = 'Study 10+ creator controversy case studies. Develop response protocols for different scenarios. Monitor feedback patterns. Handle 3-5 negative situations professionally. Expected time: 8-12 weeks.',
              s.novice_level = 'Avoids or mishandles criticism. Doesn\'t have crisis protocols. To progress: Study crisis communication best practices.',
              s.advanced_beginner_level = 'Responds to criticism but sometimes defensive. Beginning to develop response strategies. To progress: Work on transparency and empathy.',
              s.competent_level = 'Handles negative feedback professionally and appropriately. Has basic crisis response protocols. Protects reputation effectively. To progress: Develop sophisticated response strategies.',
              s.proficient_level = 'Crisis response is balanced and effective. Instinctively knows when to engage vs. ignore. Protects reputation while maintaining authenticity. To progress: Prevent crises proactively.',
              s.expert_level = 'Crisis management is sophisticated and effective. Turns challenges into opportunities for authenticity. Reputation strengthens even through difficulties. Rarely faces reputational damage.';

MERGE (s:Skill {name: 'Audience Psychological Insight and Manipulation'})
ON CREATE SET s.description = 'The ability to understand audience psychology and leverage it ethically for engagement and loyalty. Includes understanding emotional triggers and community dynamics.',
              s.how_to_develop = 'Study psychology and behavioral economics. Analyze audience comments for emotional patterns. Conduct audience surveys. Experiment with psychological triggers in content. Track response. Expected time: 16-20 weeks.',
              s.novice_level = 'Limited understanding of what motivates audience. Content performance seems random. To progress: Study psychology and observe audience patterns.',
              s.advanced_beginner_level = 'Beginning to recognize emotional patterns. Making first attempts to understand audience psychology. To progress: Formalize psychological framework.',
              s.competent_level = 'Understands key psychological drivers of engagement. Creates content that resonates emotionally. Engagement is deliberate and increasing. To progress: Develop ethical psychological frameworks.',
              s.proficient_level = 'Psychological understanding is intuitive and sophisticated. Content reliably drives emotional engagement. Community dynamics are healthy and loyal. To progress: Use psychology for growth.',
              s.expert_level = 'Deep psychological insight informs all content strategy. Engagement is driven by genuine emotional connection. Community loyalty is strong and resilient. Psychological expertise is evident.';

MERGE (s:Skill {name: 'Creator Community Leadership and Mentoring'})
ON CREATE SET s.description = 'The ability to mentor other creators, contribute to creator community, and lead within the influencer space. Positions you as industry authority.',
              s.how_to_develop = 'Mentor 3-5 emerging creators formally. Contribute to creator communities through sharing. Create educational content about your journey. Speak at creator events. Expected time: 20-24 weeks.',
              s.novice_level = 'Beginning to share knowledge but mentoring is informal. To progress: Take on formal mentorship relationships.',
              s.advanced_beginner_level = 'Has mentored 1-2 creators. Sharing some knowledge with community. To progress: Develop systematic mentoring approach.',
              s.competent_level = 'Actively mentors emerging creators. Contributes meaningfully to creator community. Teaching shapes your own growth. To progress: Build mentorship reputation.',
              s.proficient_level = 'Mentoring is sophisticated and creates impact. Recognized as thoughtful mentor within community. Leadership role in creator space. To progress: Create mentorship programs.',
              s.expert_level = 'Leadership presence is felt across creator community. Mentorship creates meaningful impact on many creators. Recognized as industry authority and thought leader. Legacy includes community development.';

// ============================================================
// Agent 2a: Knowledge Nodes
// ============================================================

// Foundational Knowledge (Novice Level)

MERGE (k:Knowledge {name: 'Social Media Platform Fundamentals'})
ON CREATE SET k.description = 'Understanding the basic mechanics and interfaces of major social media platforms including Instagram, TikTok, YouTube, Twitter/X, and LinkedIn. This encompasses platform features, user navigation, content posting mechanics, and platform-specific terminology.',
              k.how_to_learn = 'Create accounts on each major platform and spend 2-3 weeks exploring all features. Follow tutorials for new features. Join platform-specific creator communities and forums. Expected time: 3-4 weeks of hands-on exploration.',
              k.remember_level = 'Recall platform names, basic features (feed, stories, reels, feeds), navigation menus, and content types available on each platform',
              k.understand_level = 'Explain how each platform works, differences between platforms, where content appears, and what types of content perform differently on each',
              k.apply_level = 'Create and post content on multiple platforms using native platform features like stories, reels, and live streaming',
              k.analyze_level = 'Compare platform algorithms and user behaviors across different platforms to determine which platform suits your content',
              k.evaluate_level = 'Judge which platforms are most suitable for your niche and audience demographics based on platform strengths',
              k.create_level = 'Develop platform-specific content strategies that leverage unique features of each platform';

MERGE (k:Knowledge {name: 'Basic Content Creation Concepts'})
ON CREATE SET k.description = 'Foundational understanding of what constitutes good content: clarity, relevance, visual appeal, and basic storytelling. Covers simple content planning, basic photography/videography principles, and content organization.',
              k.how_to_learn = 'Study content from successful creators in your niche. Take a beginner photography or videography course. Practice creating 50+ pieces of content with feedback. Read beginner content creation guides. Expected time: 2-3 months.',
              k.remember_level = 'Recall basic composition rules (rule of thirds, lighting importance), content types (carousel, video, static posts), and what makes content engaging',
              k.understand_level = 'Explain why certain content performs better, how to frame shots for mobile viewing, and basic principles of visual storytelling',
              k.apply_level = 'Create visually appealing content using basic photography/videography techniques and apply simple composition rules',
              k.analyze_level = 'Analyze why certain pieces of content resonate with audiences by examining composition, messaging, and timing',
              k.evaluate_level = 'Judge content quality and predict engagement potential before posting based on content principles',
              k.create_level = 'Design original content formats and creative concepts that stand out within your niche';

MERGE (k:Knowledge {name: 'Audience Basics'})
ON CREATE SET k.description = 'Understanding what an audience is, how followers differ from engaged followers, and the importance of knowing your audience demographics. Basic concepts of audience building and the purpose of audience metrics.',
              k.how_to_learn = 'Observe successful creators and their audience interactions. Analyze your own followers using platform analytics. Take beginner marketing courses covering audience understanding. Expected time: 2-3 weeks.',
              k.remember_level = 'Recall what followers are, difference between reach and engagement, basic demographic information (age, location), and why audience matters',
              k.understand_level = 'Explain the difference between follower count and engaged audience, how audience interests guide content decisions, and why audience building is a process',
              k.apply_level = 'Create content that targets your emerging audience and engage with follower comments to build community',
              k.analyze_level = 'Examine your audience demographics and engagement patterns to identify content preferences',
              k.evaluate_level = 'Judge whether your content resonates with your intended audience based on engagement metrics',
              k.create_level = 'Develop audience personas and create targeted content strategies for specific audience segments';

MERGE (k:Knowledge {name: 'Personal Branding Essentials'})
ON CREATE SET k.description = 'Basic concepts of personal branding: who you are, what you represent, and how to present yourself consistently. Includes developing a unique voice, choosing a niche, and establishing brand identity.',
              k.how_to_learn = 'Analyze personal brands of successful influencers in your niche. Define your core values and interests. Create brand guidelines for yourself. Experiment with your voice in 30+ pieces of content. Expected time: 4-6 weeks.',
              k.remember_level = 'Recall what a personal brand is, your core values, and your chosen niche',
              k.understand_level = 'Explain what makes your personal brand unique, how your values align with your niche, and why consistency matters in branding',
              k.apply_level = 'Apply your personal brand consistently across all platforms and in all content you create',
              k.analyze_level = 'Analyze how successful influencers build their personal brands and identify elements you can adapt',
              k.evaluate_level = 'Evaluate whether your content aligns with your personal brand positioning',
              k.create_level = 'Develop a comprehensive personal brand strategy including visual identity, voice, and core messaging';

MERGE (k:Knowledge {name: 'Content Scheduling and Consistency'})
ON CREATE SET k.description = 'Understanding the importance of posting schedules, content calendars, and consistency in building audience. Covers basic planning tools and establishing sustainable posting routines.',
              k.how_to_learn = 'Use free planning tools like Canva Calendar or Google Calendar. Plan content 2 weeks in advance. Maintain a posting schedule for 8+ weeks. Track what time/frequency works best. Expected time: 4-6 weeks.',
              k.remember_level = 'Recall common posting schedules (daily, 3x weekly, weekly), tools for content planning, and why consistency matters',
              k.understand_level = 'Explain why consistent posting builds audience habits, how content calendars help organization, and factors affecting posting frequency',
              k.apply_level = 'Create and maintain a content calendar and stick to a consistent posting schedule for 2+ months',
              k.analyze_level = 'Analyze how your posting frequency and timing affects engagement rates',
              k.evaluate_level = 'Determine optimal posting frequency for your specific audience and niche',
              k.create_level = 'Develop a sustainable content production and distribution system that maintains consistency';

MERGE (k:Knowledge {name: 'Platform Analytics Interpretation'})
ON CREATE SET k.description = 'Basic understanding of platform analytics: impressions, reach, engagement, follower growth, and what these metrics mean. Understanding analytics dashboards and how to extract insights from basic metrics.',
              k.how_to_learn = 'Access your platform analytics and spend time understanding each metric. Compare metrics across 10+ posts. Read platform-specific analytics guides. Take beginner analytics courses. Expected time: 3-4 weeks.',
              k.remember_level = 'Recall what impressions, reach, engagement, and saves mean and how they differ',
              k.understand_level = 'Explain what each metric indicates about performance and content resonance with audience',
              k.apply_level = 'Use analytics to identify your best-performing content types and adjust future content accordingly',
              k.analyze_level = 'Compare performance across content types, posting times, and audience segments',
              k.evaluate_level = 'Judge content effectiveness by analyzing analytics and identifying patterns',
              k.create_level = 'Design custom dashboards and reporting systems to track metrics relevant to your goals';

// Core Knowledge (Developing/Competent Levels)

MERGE (k:Knowledge {name: 'Hashtag Strategy and Discovery'})
ON CREATE SET k.description = 'Understanding hashtag mechanics, hashtag research, and using hashtags strategically to increase discoverability. Covers hashtag categories, optimal hashtag mixing, and platform-specific hashtag behaviors.',
              k.how_to_learn = 'Research hashtags in your niche using platform tools and third-party tools like Hashtagify. Test 100+ hashtag combinations. Analyze which hashtags bring engaged followers vs inactive ones. Track hashtag performance monthly. Expected time: 6-8 weeks.',
              k.remember_level = 'Recall different hashtag categories (broad, niche, trending) and recommended hashtag counts for each platform',
              k.understand_level = 'Explain how hashtag algorithms work, why mixing hashtag sizes matters, and how hashtags improve discoverability',
              k.apply_level = 'Research and implement strategic hashtag combinations that attract your target audience',
              k.analyze_level = 'Analyze hashtag performance to identify which hashtags bring quality followers versus vanity metrics',
              k.evaluate_level = 'Judge hashtag relevance and predict engagement impact before posting',
              k.create_level = 'Develop a branded hashtag strategy including custom hashtags and strategic hashtag campaigns';

MERGE (k:Knowledge {name: 'Community Engagement Techniques'})
ON CREATE SET k.description = 'Strategies for meaningful engagement with audience and community: responding to comments, creating conversation, building relationships with followers, and fostering community identity.',
              k.how_to_learn = 'Study engagement patterns of successful creators in your niche. Spend 30+ minutes daily engaging with community. Respond to every comment for 30 days. Join creator communities and practice engagement. Expected time: 8-10 weeks.',
              k.remember_level = 'Recall engagement types (comments, DMs, mentions, tags) and basic etiquette for responding to followers',
              k.understand_level = 'Explain why engagement matters for algorithm ranking, how community building increases loyalty, and psychological principles behind meaningful interaction',
              k.apply_level = 'Engage daily with followers through comments, DMs, and collaborations while maintaining authenticity',
              k.analyze_level = 'Analyze which types of engagement create strongest community bonds and predict future content needs based on community feedback',
              k.evaluate_level = 'Judge community health and follower satisfaction through engagement patterns and sentiment analysis',
              k.create_level = 'Design community engagement programs, challenges, and initiatives that deepen follower loyalty';

MERGE (k:Knowledge {name: 'Algorithm Understanding and Optimization'})
ON CREATE SET k.description = 'Understanding how social media algorithms rank and recommend content, key ranking factors, and how to create content optimized for algorithm distribution. Covers platform-specific algorithm principles.',
              k.how_to_learn = 'Read platform research and creator blogs about algorithm changes. Analyze which of your posts get boosted by algorithm. Conduct A/B testing on content formats. Track algorithm changes for 3+ months. Expected time: 10-12 weeks.',
              k.remember_level = 'Recall key algorithm ranking factors (engagement rate, video completion, shares, saves) and how they differ by platform',
              k.understand_level = 'Explain how algorithms prioritize content, why engagement happens early in post visibility, and how consistency affects algorithm treatment',
              k.apply_level = 'Create content specifically optimized for algorithm ranking with hooks, retention tactics, and call-to-actions',
              k.analyze_level = 'Compare your content performance with algorithm-expected outcomes and identify optimization opportunities',
              k.evaluate_level = 'Judge which content changes would improve algorithm visibility based on recent platform updates',
              k.create_level = 'Develop algorithm optimization frameworks specific to your niche and audience behavior patterns';

MERGE (k:Knowledge {name: 'Content Format Specialization'})
ON CREATE SET k.description = 'In-depth knowledge of different content formats (Reels, TikToks, carousel posts, long-form videos, Stories, Shorts) and their unique requirements, optimal lengths, and performance characteristics.',
              k.how_to_learn = 'Create 50+ pieces of content in each major format. Study format-specific successful creators. Track performance by format. Develop proficiency in editing software. Expected time: 12-16 weeks.',
              k.remember_level = 'Recall technical specifications for each format (video lengths, aspect ratios, frame rates) and optimal structure for each',
              k.understand_level = 'Explain why certain formats perform better for different content types and audiences, and format-specific retention patterns',
              k.apply_level = 'Create high-quality content in multiple formats using native editing tools or professional software',
              k.analyze_level = 'Compare format performance and identify which formats resonate best with your specific audience',
              k.evaluate_level = 'Judge which formats are best suited for specific content topics and audience segments',
              k.create_level = 'Develop format-specific content production templates and systems that optimize quality and efficiency';

MERGE (k:Knowledge {name: 'Influencer Niche Definition'})
ON CREATE SET k.description = 'Defining a content niche, understanding niche specificity, and evaluating niche viability. Covers how to choose a niche, assessing competition, and maintaining niche authenticity while allowing growth.',
              k.how_to_learn = 'Research 50+ creators to understand niche dynamics. Document niche opportunities and gaps. Define your niche with specific criteria. Monitor niche trends for 8+ weeks. Expected time: 6-8 weeks.',
              k.remember_level = 'Recall your niche definition, sub-niches within your space, competitor creators, and niche audience demographics',
              k.understand_level = 'Explain why niche focus matters for growth, how niche specificity affects audience loyalty, and trade-offs between niche breadth and depth',
              k.apply_level = 'Stay consistently within your niche while creating unique content variations that appeal to your audience',
              k.analyze_level = 'Analyze niche trends and competitor strategies to identify content gaps and opportunities',
              k.evaluate_level = 'Judge whether content opportunities fit within your niche and will resonate with your audience',
              k.create_level = 'Develop comprehensive niche strategies that evolve with trends while maintaining authentic positioning';

MERGE (k:Knowledge {name: 'Collaboration and Cross-Promotion'})
ON CREATE SET k.description = 'Understanding collaboration benefits, identifying collaboration partners, executing joint content projects, and cross-promoting with other creators to expand reach.',
              k.how_to_learn = 'Identify 20+ potential collaboration partners in complementary niches. Execute 5+ collaborations. Document collaboration outcomes. Analyze which collaborations bring best results. Expected time: 8-12 weeks.',
              k.remember_level = 'Recall types of collaborations (duets, stitches, joint videos, guest appearances), collaboration outreach etiquette, and platform-specific collaboration tools',
              k.understand_level = 'Explain how collaborations expand reach, why audience overlap matters, and how to ensure mutually beneficial partnerships',
              k.apply_level = 'Reach out to collaborators, co-create content, and cross-promote effectively across platforms',
              k.analyze_level = 'Evaluate collaboration impact and identify which partnership types bring the best audience growth',
              k.evaluate_level = 'Judge collaboration fit based on audience alignment and content synergy',
              k.create_level = 'Design collaboration strategies and multi-creator campaigns that expand reach across communities';

MERGE (k:Knowledge {name: 'Analytics-Driven Content Strategy'})
ON CREATE SET k.description = 'Using analytics data to inform content decisions, identifying patterns in performance data, and creating data-driven content strategies. Covers advanced analytics interpretation and strategic planning based on metrics.',
              k.how_to_learn = 'Analyze 100+ pieces of your content using analytics. Create spreadsheets tracking performance metrics. Test hypotheses about content performance. Track correlations between content variables and metrics. Expected time: 10-12 weeks.',
              k.remember_level = 'Recall which metrics indicate content success, how to identify top-performing content patterns, and baseline performance expectations',
              k.understand_level = 'Explain correlations between content characteristics and performance metrics, and how to use data to predict content success',
              k.apply_level = 'Create content roadmaps based on analytics data and adjust strategy monthly based on new performance insights',
              k.analyze_level = 'Perform detailed analysis of content performance factors and identify patterns across successful content',
              k.evaluate_level = 'Judge content strategy effectiveness and predict future performance based on historical data patterns',
              k.create_level = 'Develop sophisticated analytics frameworks and create custom dashboards for ongoing strategy optimization';

// Advanced Knowledge (Advanced Level)

MERGE (k:Knowledge {name: 'Brand Partnership Negotiation'})
ON CREATE SET k.description = 'Understanding brand partnerships, negotiating sponsorship deals, creating partnership proposals, and maintaining authentic brand alignment. Covers fair pricing, contract understanding, and partnership structure.',
              k.how_to_learn = 'Study 20+ brand partnerships from creators in your niche. Understand industry rate cards and pricing models. Negotiate 5+ partnerships. Join creator economy groups discussing deals. Expected time: 12-16 weeks.',
              k.remember_level = 'Recall types of brand partnerships (sponsored posts, affiliate marketing, ambassador programs), standard contract terms, and industry rate ranges',
              k.understand_level = 'Explain how to value your influence, why brand alignment matters, how to structure partnership proposals, and negotiation strategies',
              k.apply_level = 'Create partnership proposals, negotiate rates professionally, and execute high-quality sponsored content',
              k.analyze_level = 'Evaluate brand fit and partnership terms to ensure mutual value and authentic alignment',
              k.evaluate_level = 'Judge fair compensation based on audience size, engagement rate, and brand positioning',
              k.create_level = 'Develop partnership strategy frameworks and create templated processes for handling brand opportunities';

MERGE (k:Knowledge {name: 'Monetization Strategies and Revenue Optimization'})
ON CREATE SET k.description = 'Understanding multiple revenue streams for influencers: ad revenue sharing, affiliate marketing, sponsorships, digital products, and consulting. Covers optimization of each revenue stream and portfolio approach.',
              k.how_to_learn = 'Implement 3-5 different monetization methods on your channels. Track revenue from each stream. Study revenue models of successful creators. Join monetization education programs. Expected time: 16-20 weeks.',
              k.remember_level = 'Recall different monetization methods (ad revenue, affiliates, sponsorships, digital products), platform requirements for each, and income potential ranges',
              k.understand_level = 'Explain how each monetization method works, which methods suit different niches, and how to optimize each revenue stream',
              k.apply_level = 'Implement and manage multiple revenue streams while maintaining content quality and audience trust',
              k.analyze_level = 'Compare revenue streams and identify optimization opportunities based on audience behavior and platform changes',
              k.evaluate_level = 'Judge which monetization methods are most sustainable long-term for your niche and audience size',
              k.create_level = 'Develop comprehensive monetization strategies that diversify income and create growth opportunities';

MERGE (k:Knowledge {name: 'Audience Psychology and Behavioral Insights'})
ON CREATE SET k.description = 'Deep understanding of audience psychology: motivation, emotional triggers, community dynamics, and behavioral patterns. Covers psychological principles that drive engagement and loyalty.',
              k.how_to_learn = 'Study psychology, social dynamics, and behavioral economics. Analyze your audience comments for patterns. Survey your audience about preferences. Track psychological triggers in successful content. Expected time: 16-20 weeks.',
              k.remember_level = 'Recall psychological principles (reciprocity, social proof, FOMO), emotional triggers, and audience motivation types',
              k.understand_level = 'Explain psychological drivers of engagement, emotional connections in storytelling, and community psychology principles',
              k.apply_level = 'Create content using psychological principles to drive engagement while maintaining ethical standards',
              k.analyze_level = 'Analyze audience psychology through comments, engagement patterns, and behavioral feedback',
              k.evaluate_level = 'Judge content impact on audience emotions and community dynamics',
              k.create_level = 'Develop psychological frameworks for content creation that drive authentic engagement and build loyalty';

MERGE (k:Knowledge {name: 'Crisis Management and Reputation Protection'})
ON CREATE SET k.description = 'Strategies for handling negative feedback, controversies, platform issues, and reputation damage. Covers proactive reputation building and reactive crisis response protocols.',
              k.how_to_learn = 'Study case studies of creator controversies and recovery strategies. Monitor feedback patterns in your community. Develop response protocols. Handle 5+ negative feedback situations professionally. Expected time: 8-10 weeks.',
              k.remember_level = 'Recall common controversy types for creators, basic crisis communication principles, and platform reporting mechanisms',
              k.understand_level = 'Explain how to respond to criticism professionally, when to engage vs. ignore, and how damage control prevents reputation decline',
              k.apply_level = 'Respond to negative feedback professionally and implement transparency protocols when mistakes occur',
              k.analyze_level = 'Analyze reputation risks and identify potential controversy sources before they occur',
              k.evaluate_level = 'Judge appropriate response strategies based on severity and nature of criticism',
              k.create_level = 'Develop comprehensive crisis response frameworks and reputation protection strategies';

MERGE (k:Knowledge {name: 'Trend Anticipation and Content Trend Riding'})
ON CREATE SET k.description = 'Understanding how trends develop, predicting emerging trends, knowing when to jump on trends vs. stay authentic, and riding trends without losing brand identity. Covers trend analytics and timing.',
              k.how_to_learn = 'Track emerging trends daily using TikTok, YouTube, and trend forecasting tools. Document trend lifecycles. Successfully ride 10+ trends. Study how top creators adapt trends. Expected time: 12-16 weeks.',
              k.remember_level = 'Recall current trend sources (FYP, trending pages, trend forecasting tools), trend lifecycle stages, and trend terminology',
              k.understand_level = 'Explain how trends develop and spread, when trends offer opportunity vs. oversaturation, and how to adapt trends authentically',
              k.apply_level = 'Identify timely trends and create original trend-based content that aligns with your brand',
              k.analyze_level = 'Track trend lifecycle and determine optimal time to create trend content before saturation',
              k.evaluate_level = 'Judge trend fit and predict whether a trend suits your brand and audience',
              k.create_level = 'Develop trend strategy frameworks that balance timely content with evergreen content for sustainable growth';

// Specialized Knowledge (Master Level)

MERGE (k:Knowledge {name: 'Creator Economy Industry Landscape'})
ON CREATE SET k.description = 'Comprehensive understanding of the creator economy: platform evolution, industry trends, economic structures, emerging opportunities, and future direction of influencer marketing.',
              k.how_to_learn = 'Study industry reports from firms like McKinsey and Influencer Marketing Hub. Follow creator economy thought leaders. Participate in industry conferences. Contribute to industry discussions. Expected time: ongoing education.',
              k.remember_level = 'Recall major creators, platform market shares, emerging platforms, industry statistics, and key industry trends',
              k.understand_level = 'Explain creator economy structure, platform dynamics, emerging opportunities, and how trends shape creator strategies',
              k.apply_level = 'Adapt your strategy based on industry trends and emerging platforms before they become mainstream',
              k.analyze_level = 'Analyze industry trends to predict future platform developments and creator opportunities',
              k.evaluate_level = 'Judge industry shifts and position yourself strategically ahead of market changes',
              k.create_level = 'Contribute to industry thought leadership through teaching, speaking, and advancing creator economy practices';

MERGE (k:Knowledge {name: 'Audience Segmentation and Targeting'})
ON CREATE SET k.description = 'Advanced techniques for segmenting audiences into distinct groups, creating targeted content for segments, understanding sub-community dynamics, and personalizing experience at scale.',
              k.how_to_learn = 'Analyze audience data across 500+ followers to identify segments. Create targeted content for 5+ audience segments. Use advanced analytics tools. Track segment-specific engagement. Expected time: 16-20 weeks.',
              k.remember_level = 'Recall major audience segments, demographic/psychographic characteristics, segment size and engagement potential',
              k.understand_level = 'Explain how audiences segment naturally, why different segments need different content, and how to communicate with multiple segments simultaneously',
              k.apply_level = 'Create multi-layered content that speaks to multiple audience segments without alienating any group',
              k.analyze_level = 'Perform detailed segmentation analysis and identify unique needs and preferences for each segment',
              k.evaluate_level = 'Judge content effectiveness for each audience segment and predict segment-specific performance',
              k.create_level = 'Design sophisticated segmentation strategies and create personalization systems that scale across audience growth';

MERGE (k:Knowledge {name: 'Content Production Systems and Scaling'})
ON CREATE SET k.description = 'Building scalable content production systems: team building, delegation, content batching, automation, systems thinking, and maintaining quality while scaling production volume.',
              k.how_to_learn = 'Document your content production process. Hire and train 2-3 team members. Implement production tools and automations. Scale to 2-3x your current output. Expected time: 20-24 weeks.',
              k.remember_level = 'Recall production phases, tools available for automation, team roles needed for scaling, and quality metrics for scaled production',
              k.understand_level = 'Explain how to organize production workflows, what tasks to delegate vs. keep, bottlenecks in production, and how to scale without losing quality',
              k.apply_level = 'Build and manage content production systems and teams that maintain quality while increasing output',
              k.analyze_level = 'Identify inefficiencies in current production and redesign systems for better scalability',
              k.evaluate_level = 'Judge which production tasks should be automated vs. delegated vs. handled personally',
              k.create_level = 'Design end-to-end content production systems that scale with your growth while maintaining brand consistency';

MERGE (k:Knowledge {name: 'Strategic Audience Growth and Retention'})
ON CREATE SET k.description = 'Advanced strategies for sustainable audience growth, preventing follower churn, building community loyalty, and maintaining engagement as audience scales. Covers growth trajectory analysis and retention economics.',
              k.how_to_learn = 'Study growth patterns across 50+ creators. Implement 5+ growth initiatives and track results. Analyze audience retention metrics monthly. Build systems for retention. Expected time: 20-24 weeks.',
              k.remember_level = 'Recall growth stage phases, retention metrics (churn rate, loyalty indicators), growth acceleration triggers, and retention best practices',
              k.understand_level = 'Explain sustainable growth models, why retention matters more than growth rate, and how to balance growth with quality',
              k.apply_level = 'Execute multi-faceted growth strategies that build sustainable, loyal audiences without artificial metrics',
              k.analyze_level = 'Analyze your growth trajectory and identify bottlenecks, retention issues, or optimization opportunities',
              k.evaluate_level = 'Judge growth quality and predict long-term audience viability based on retention patterns',
              k.create_level = 'Develop sophisticated growth strategies that optimize for lifetime value and community quality over raw follower numbers';

MERGE (k:Knowledge {name: 'Personal Brand Evolution and Reinvention'})
ON CREATE SET k.description = 'Managing personal brand over time, evolving with changing interests and market conditions, navigating reinvention while retaining audience, and building timeless brand foundations.',
              k.how_to_learn = 'Study how major creators have evolved their brands. Document your brand identity and values. Plan for 2+ brand evolution phases. Navigate at least one significant content shift. Expected time: 24+ weeks.',
              k.remember_level = 'Recall your brand evolution history, core values that are unchanging, areas of brand flexibility, and audience expectations',
              k.understand_level = 'Explain the difference between brand evolution and brand betrayal, how to shift content while retaining audience, and brand resilience principles',
              k.apply_level = 'Evolve your brand strategically while communicating changes clearly and maintaining audience trust',
              k.analyze_level = 'Track audience reactions to brand evolution and adjust strategy based on community feedback',
              k.evaluate_level = 'Judge which changes strengthen vs. weaken your brand foundation',
              k.create_level = 'Design long-term brand strategies that allow evolution and growth while maintaining core identity and audience trust';

MERGE (k:Knowledge {name: 'Cross-Platform Ecosystem Strategy'})
ON CREATE SET k.description = 'Building cohesive presence across multiple platforms, understanding platform-specific audiences, cross-promoting strategically, and leveraging platform strengths to create unified brand ecosystem.',
              k.how_to_learn = 'Actively maintain presence on 4-5 platforms. Develop platform-specific strategies. Build audience on new platforms. Cross-promote strategically. Expected time: 24+ weeks.',
              k.remember_level = 'Recall platform demographics, strengths, content type preferences, and audience overlap between platforms',
              k.understand_level = 'Explain how to leverage platform differences, why audiences differ between platforms, and optimal cross-promotion timing',
              k.apply_level = 'Create platform-specific content and cross-promote authentically to grow audiences across ecosystem',
              k.analyze_level = 'Analyze audience behavior across platforms and identify opportunities for ecosystem synergy',
              k.evaluate_level = 'Judge platform investment priority based on audience potential and growth trajectory',
              k.create_level = 'Design unified brand strategies across platforms that optimize reach while maintaining platform-specific authenticity';

// ============================================================
// Agent 2c: Trait Nodes
// ============================================================

// Inherent characteristics that significantly impact influencer success

MERGE (t:Trait {name: 'Extraversion'})
ON CREATE SET t.description = 'Natural tendency to seek social interaction, enjoy being the center of attention, and feel energized by engaging with others. Core to comfort with public attention and community engagement in the influencer space.',
              t.measurement_criteria = 'Assessed through comfort in social situations and desire for audience interaction. Low (0-25): Prefers private interactions, anxious with public attention, avoids spotlight. Moderate (26-50): Comfortable in social situations but doesn\'t naturally seek large audiences. High (51-75): Enjoys social interaction and feeling part of communities. Exceptional (76-100): Thrives on public engagement, energized by large audiences, naturally charismatic.';

MERGE (t:Trait {name: 'Creativity'})
ON CREATE SET t.description = 'Natural ability to generate original ideas, see novel connections, and produce unique content that stands out. Fundamental to creating content that captures attention and differentiates from competitors.',
              t.measurement_criteria = 'Assessed through originality of ideas and uniqueness of expression. Low (0-25): Struggles to generate original ideas, relies heavily on copying others. Moderate (26-50): Can adapt existing ideas, generates ideas with prompting. High (51-75): Consistently produces original ideas, naturally innovative within domain. Exceptional (76-100): Generates groundbreaking original concepts, ideas feel fresh and unique, sets trends.';

MERGE (t:Trait {name: 'Emotional Intelligence'})
ON CREATE SET t.description = 'Ability to understand, interpret, and respond to emotions in oneself and others. Critical for authentic community connection, managing audience psychology, and handling controversies.',
              t.measurement_criteria = 'Assessed through empathy, awareness of emotional impacts, and ability to navigate social dynamics. Low (0-25): Struggles to recognize emotions in others, responses often miss emotional context. Moderate (26-50): Basic emotional awareness, sometimes responds appropriately to emotional feedback. High (51-75): Good understanding of emotions, responses are generally empathetic and appropriate. Exceptional (76-100): Sophisticated emotional awareness, intuitively reads audiences, naturally empathetic responses.';

MERGE (t:Trait {name: 'Resilience'})
ON CREATE SET t.description = 'Ability to bounce back from setbacks, handle criticism, and maintain motivation through challenges. Essential for sustaining through content flops, negative feedback, and algorithm changes.',
              t.measurement_criteria = 'Assessed through response to failure and ability to maintain effort after disappointment. Low (0-25): Easily discouraged by setbacks, difficulty recovering from criticism. Moderate (26-50): Bounces back from setbacks with effort, occasional discouragement. High (51-75): Handles setbacks well, maintains motivation through challenges. Exceptional (76-100): Treats setbacks as learning opportunities, maintains drive through persistent challenges.';

MERGE (t:Trait {name: 'Focus'})
ON CREATE SET t.description = 'Ability to concentrate on content strategy and consistent execution despite distractions and algorithm changes. Essential for maintaining long-term vision and sustained content production.',
              t.measurement_criteria = 'Assessed through consistency in execution and ability to stay on strategy. Low (0-25): Frequently distracted, difficulty maintaining focus on long-term goals. Moderate (26-50): Can focus with effort, occasionally gets sidetracked. High (51-75): Maintains focus on goals, can work through distractions. Exceptional (76-100): Maintains unwavering focus despite chaos, execution is consistent and disciplined.';

MERGE (t:Trait {name: 'Conscientiousness'})
ON CREATE SET t.description = 'Natural tendency toward organization, reliability, and attention to detail. Important for maintaining consistent posting schedules, quality control, and fulfilling brand partnerships.',
              t.measurement_criteria = 'Assessed through organization, follow-through on commitments, and attention to detail. Low (0-25): Disorganized, inconsistent follow-through, poor attention to details. Moderate (26-50): Generally organized, usually follows through on commitments. High (51-75): Well-organized, reliable, pays attention to quality details. Exceptional (76-100): Impeccably organized, meticulous follow-through, quality control is automatic.';

MERGE (t:Trait {name: 'Risk Tolerance'})
ON CREATE SET t.description = 'Comfort with trying new content formats, platforms, and strategies that might fail. Critical for experimentation and staying ahead of trends in the fast-moving influencer space.',
              t.measurement_criteria = 'Assessed through willingness to try new approaches and comfort with potential failure. Low (0-25): Avoids trying new things, prefers safe proven approaches. Moderate (26-50): Willing to try new approaches with hesitation. High (51-75): Comfortable experimenting with new content and strategies. Exceptional (76-100): Eagerly experiments with new approaches, treats failures as learning opportunities.';

MERGE (t:Trait {name: 'Openness to Feedback'})
ON CREATE SET t.description = 'Receptiveness to criticism and willingness to adjust based on audience and analytics input. Enables continuous improvement and adaptation to audience needs.',
              t.measurement_criteria = 'Assessed through receptiveness to critique and willingness to change. Low (0-25): Defensive to criticism, resists feedback. Moderate (26-50): Hears feedback but slow to act on it. High (51-75): Receptive to feedback, regularly adjusts based on input. Exceptional (76-100): Eagerly seeks feedback, quickly implements improvements, views feedback as essential growth tool.';

// ============================================================
// Agent 2d: Milestone Nodes
// ============================================================

// Novice Level Milestones (1-2)

MERGE (m:Milestone {name: 'Post First Content'})
ON CREATE SET m.description = 'Successfully publish your first piece of content across any social media platform. This foundational milestone marks the beginning of your influencer journey and overcomes initial hesitation about public sharing.',
              m.how_to_achieve = 'Choose a platform that feels comfortable (Instagram, TikTok, YouTube, etc.). Create a simple piece of content (photo with caption, short video, or written post). Post it publicly. Expected time: 1-3 days.';

MERGE (m:Milestone {name: 'Reach 100 Followers'})
ON CREATE SET m.description = 'Accumulate your first 100 followers across a single platform. Demonstrates initial ability to engage others and build a small community interested in your content.',
              m.how_to_achieve = 'Post consistently (3-5 times per week) with good captions and hashtags. Engage authentically with others\' content daily (30+ minutes). Follow accounts in your niche. Respond to every comment. Expected time: 4-12 weeks depending on niche and consistency.';

// Developing Level Milestones (2-3)

MERGE (m:Milestone {name: 'Establish Consistent Posting Schedule'})
ON CREATE SET m.description = 'Maintain a consistent posting schedule for 12+ consecutive weeks without missing a single scheduled post. Demonstrates commitment to audience and foundational discipline.',
              m.how_to_achieve = 'Create a content calendar for 3 months. Plan content in advance using tools like Canva Calendar or Notion. Set posting times and stick to them religiously. Track your posts. Expected time: 12 weeks of consistent execution.';

MERGE (m:Milestone {name: 'Reach 1000 Followers'})
ON CREATE SET m.description = 'Build your audience to 1,000 engaged followers. Marks transition from purely personal account to emerging creator with meaningful audience reach.',
              m.how_to_achieve = 'Continue consistent posting schedule. Optimize hashtags and captions based on engagement data. Engage authentically with community daily. Collaborate with 2-3 creators in your niche. Expected time: 3-6 months of focused effort.';

MERGE (m:Milestone {name: 'Develop Recognizable Visual Style'})
ON CREATE SET m.description = 'Create and maintain a consistent, recognizable visual aesthetic across all posts. Your feed is instantly identifiable by your color palette, filters, and composition style.',
              m.how_to_achieve = 'Create a visual style guide with specific colors, filters, and composition rules. Edit all new content through your preset system. Review your full feed for cohesion. Refine until your aesthetic is instantly recognizable. Expected time: 6-8 weeks.';

// Competent Level Milestones (2-4)

MERGE (m:Milestone {name: 'Hit 10000 Followers'})
ON CREATE SET m.description = 'Grow your audience to 10,000 followers. Qualifies you as a micro-influencer and opens eligibility for many brand partnership opportunities.',
              m.how_to_achieve = 'Maintain consistent posting and engagement. Optimize content based on analytics data. Identify your best-performing content and create variations. Collaborate with other creators. Engage in trending content strategically. Expected time: 4-12 months depending on niche.';

MERGE (m:Milestone {name: 'Secure First Brand Partnership'})
ON CREATE SET m.description = 'Successfully negotiate and execute your first paid brand sponsorship or partnership. Demonstrates ability to monetize influence and deliver value to brands.',
              m.how_to_achieve = 'Document your audience statistics and engagement rates. Create a one-page media kit. Research brands aligned with your niche. Send professional partnership proposals to 10-20 potential brands. Negotiate terms and create high-quality sponsored content. Expected time: 8-16 weeks.';

MERGE (m:Milestone {name: 'Create Viral Content'})
ON CREATE SET m.description = 'Create a single piece of content that significantly exceeds your typical engagement metrics, reaching 10,000+ impressions or receiving 100+ meaningful engagements.',
              m.how_to_achieve = 'Analyze your top-performing content. Identify patterns in high-engagement posts. Create content using these patterns but with original twist. Use trending audio or hooks. Post at optimal times for your audience. Expected time: ongoing attempts until achieved.';

MERGE (m:Milestone {name: 'Establish Authentic Community'})
ON CREATE SET m.description = 'Build a community where followers recognize and engage with each other, comment thoughtfully on posts, and feel like they belong. Community feels organic and supportive rather than transactional.',
              m.how_to_achieve = 'Respond personally to every comment for 2+ months. Ask genuine questions that encourage replies. Share vulnerable or authentic content. Celebrate followers\' achievements. Foster conversations between followers. Create a sense of inside jokes or shared values. Expected time: 6-12 weeks of deliberate community building.';

// Advanced Level Milestones (2-4)

MERGE (m:Milestone {name: 'Reach 100000 Followers'})
ON CREATE SET m.description = 'Build your audience to 100,000 followers. Qualifies as a mid-tier influencer and opens access to premium brand partnership opportunities and monetization features.',
              m.how_to_achieve = 'Maintain content quality while scaling output. Leverage analytics to optimize content strategy continuously. Collaborate with other established creators. Stay ahead of platform trends. Build emotional connection with audience. Expected time: 12-24 months depending on strategy.';

MERGE (m:Milestone {name: 'Launch Digital Product'})
ON CREATE SET m.description = 'Create and successfully launch a digital product (online course, guide, template, coaching program, or membership) that serves your audience.',
              m.how_to_achieve = 'Identify specific problem your audience faces. Create comprehensive solution (course outline, templates, coaching curriculum). Set up sales funnel and payment system. Market product to your audience. Achieve first 10-20 sales. Expected time: 8-16 weeks from conception to launch.';

MERGE (m:Milestone {name: 'Establish Multiple Revenue Streams'})
ON CREATE SET m.description = 'Generate income from at least 3 different monetization sources (brand sponsorships, affiliate marketing, digital products, ad revenue, consulting, etc.).',
              m.how_to_achieve = 'Implement affiliate links for relevant products. Execute 5+ brand partnerships. Launch a digital product or service. Apply for platform ad revenue programs. Document revenue from each stream. Expected time: 12-20 weeks.';

MERGE (m:Milestone {name: 'Successfully Navigate Platform Algorithm Change'})
ON CREATE SET m.description = 'Maintain or grow your audience and engagement when a major platform algorithm change impacts content distribution.',
              m.how_to_achieve = 'Stay informed about algorithm updates. Quickly analyze how changes affect your content. Adapt content strategy to new algorithm. Test new content formats. Maintain engagement through transition. Expected time: 4-8 weeks of active adaptation.';

// Master Level Milestones (2-5)

MERGE (m:Milestone {name: 'Reach 1000000 Followers'})
ON CREATE SET m.description = 'Build your audience to 1,000,000+ followers. Qualifies as a major influencer with significant cultural impact and access to the highest-tier monetization opportunities.',
              m.how_to_achieve = 'Maintain exceptional content quality while managing massive scale. Continue authentic community engagement despite scale. Adapt strategy as rapidly as trends evolve. Expand across multiple platforms. Likely requires sustained effort over years. Expected time: 24+ months of strategic growth.';

MERGE (m:Milestone {name: 'Mentor Emerging Creator to Success'})
ON CREATE SET m.description = 'Mentor another creator who reaches 10,000+ followers through your guidance and support. Demonstrates ability to teach others and contribute to creator community.',
              m.how_to_achieve = 'Identify emerging creator aligned with your values. Commit to regular mentoring (weekly calls/messages for 6+ months). Share your strategies and connections. Provide accountability and feedback. Help them develop their unique voice. Expected time: 6-12 months of mentorship.';

MERGE (m:Milestone {name: 'Execute Multi-Creator Campaign'})
ON CREATE SET m.description = 'Lead or organize a campaign involving 10+ creators that creates measurable impact (combined reach of 500,000+, successful product launch, cultural moment, etc.).',
              m.how_to_achieve = 'Identify collaborative opportunity or product. Recruit 10+ creators with complementary audiences. Coordinate content strategy and timing. Ensure quality and consistency across creators. Measure and report on campaign impact. Expected time: 8-16 weeks from concept to execution.';

MERGE (m:Milestone {name: 'Establish Industry Authority'})
ON CREATE SET m.description = 'Become recognized as a thought leader and authority in your niche through teaching, speaking, or publishing. Other creators and brands look to you for guidance.',
              m.how_to_achieve = 'Create educational content about your journey and expertise. Speak at creator events or conferences. Publish guides or articles in industry publications. Contribute meaningfully to creator communities. Build reputation for honest, valuable insights. Expected time: 18-36 months.';

MERGE (m:Milestone {name: 'Expand Successfully to New Platform'})
ON CREATE SET m.description = 'Successfully launch and grow a significant audience on a new platform that you did not previously dominate, demonstrating adaptability and multi-platform mastery.',
              m.how_to_achieve = 'Choose a platform with growth potential aligned with your content. Adapt your content to platform norms and audience. Build to 50,000+ followers on new platform. Integrate with existing audience. Expected time: 12-18 months.';

// ============================================================
// Agent 3: Relationships
// ============================================================

// ============================================================
// Level 1 (Influencer Novice) Requirements
// ============================================================

MATCH (level1:Domain_Level {level: 1, name: 'Influencer Novice'})
MATCH (k:Knowledge {name: 'Social Media Platform Fundamentals'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Influencer Novice'})
MATCH (k:Knowledge {name: 'Basic Content Creation Concepts'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Influencer Novice'})
MATCH (k:Knowledge {name: 'Audience Basics'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Influencer Novice'})
MATCH (k:Knowledge {name: 'Personal Branding Essentials'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Influencer Novice'})
MATCH (s:Skill {name: 'Content Planning and Ideation'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Influencer Novice'})
MATCH (s:Skill {name: 'Basic Video Recording'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Influencer Novice'})
MATCH (s:Skill {name: 'Basic Photo Editing'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Influencer Novice'})
MATCH (s:Skill {name: 'Platform Navigation and Feature Familiarity'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Influencer Novice'})
MATCH (t:Trait {name: 'Extraversion'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 25}]->(t);

MATCH (level1:Domain_Level {level: 1, name: 'Influencer Novice'})
MATCH (t:Trait {name: 'Creativity'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 20}]->(t);

MATCH (level1:Domain_Level {level: 1, name: 'Influencer Novice'})
MATCH (m:Milestone {name: 'Post First Content'})
CREATE (level1)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

// ============================================================
// Level 2 (Influencer Developing) Requirements
// ============================================================

MATCH (level2:Domain_Level {level: 2, name: 'Influencer Developing'})
MATCH (k:Knowledge {name: 'Social Media Platform Fundamentals'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Influencer Developing'})
MATCH (k:Knowledge {name: 'Basic Content Creation Concepts'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Influencer Developing'})
MATCH (k:Knowledge {name: 'Audience Basics'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Influencer Developing'})
MATCH (k:Knowledge {name: 'Personal Branding Essentials'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Influencer Developing'})
MATCH (k:Knowledge {name: 'Content Scheduling and Consistency'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Influencer Developing'})
MATCH (k:Knowledge {name: 'Platform Analytics Interpretation'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Influencer Developing'})
MATCH (s:Skill {name: 'Content Planning and Ideation'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Influencer Developing'})
MATCH (s:Skill {name: 'Caption and Hashtag Writing'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Influencer Developing'})
MATCH (s:Skill {name: 'Visual Consistency and Branding'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Influencer Developing'})
MATCH (s:Skill {name: 'Authentic Community Engagement'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Influencer Developing'})
MATCH (s:Skill {name: 'Trending Audio and Music Selection'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Influencer Developing'})
MATCH (t:Trait {name: 'Extraversion'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 35}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Influencer Developing'})
MATCH (t:Trait {name: 'Creativity'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 35}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Influencer Developing'})
MATCH (t:Trait {name: 'Conscientiousness'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 40}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Influencer Developing'})
MATCH (m:Milestone {name: 'Reach 100 Followers'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level2:Domain_Level {level: 2, name: 'Influencer Developing'})
MATCH (m:Milestone {name: 'Establish Consistent Posting Schedule'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level2:Domain_Level {level: 2, name: 'Influencer Developing'})
MATCH (m:Milestone {name: 'Develop Recognizable Visual Style'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

// ============================================================
// Level 3 (Influencer Competent) Requirements
// ============================================================

MATCH (level3:Domain_Level {level: 3, name: 'Influencer Competent'})
MATCH (k:Knowledge {name: 'Basic Content Creation Concepts'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Influencer Competent'})
MATCH (k:Knowledge {name: 'Platform Analytics Interpretation'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Influencer Competent'})
MATCH (k:Knowledge {name: 'Content Scheduling and Consistency'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Influencer Competent'})
MATCH (k:Knowledge {name: 'Hashtag Strategy and Discovery'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Influencer Competent'})
MATCH (k:Knowledge {name: 'Community Engagement Techniques'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Influencer Competent'})
MATCH (k:Knowledge {name: 'Algorithm Understanding and Optimization'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Influencer Competent'})
MATCH (k:Knowledge {name: 'Content Format Specialization'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Influencer Competent'})
MATCH (s:Skill {name: 'Content Planning and Ideation'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Influencer Competent'})
MATCH (s:Skill {name: 'Caption and Hashtag Writing'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Influencer Competent'})
MATCH (s:Skill {name: 'Visual Consistency and Branding'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Influencer Competent'})
MATCH (s:Skill {name: 'Authentic Community Engagement'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Influencer Competent'})
MATCH (s:Skill {name: 'Hook Writing and Attention Capture'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Influencer Competent'})
MATCH (s:Skill {name: 'Algorithm Optimization and Distribution'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Influencer Competent'})
MATCH (t:Trait {name: 'Extraversion'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 45}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Influencer Competent'})
MATCH (t:Trait {name: 'Creativity'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Influencer Competent'})
MATCH (t:Trait {name: 'Conscientiousness'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Influencer Competent'})
MATCH (t:Trait {name: 'Resilience'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 40}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Influencer Competent'})
MATCH (m:Milestone {name: 'Reach 1000 Followers'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'Influencer Competent'})
MATCH (m:Milestone {name: 'Establish Authentic Community'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

// ============================================================
// Level 4 (Influencer Advanced) Requirements
// ============================================================

MATCH (level4:Domain_Level {level: 4, name: 'Influencer Advanced'})
MATCH (k:Knowledge {name: 'Algorithm Understanding and Optimization'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Influencer Advanced'})
MATCH (k:Knowledge {name: 'Content Format Specialization'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Influencer Advanced'})
MATCH (k:Knowledge {name: 'Influencer Niche Definition'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Influencer Advanced'})
MATCH (k:Knowledge {name: 'Collaboration and Cross-Promotion'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Influencer Advanced'})
MATCH (k:Knowledge {name: 'Analytics-Driven Content Strategy'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Influencer Advanced'})
MATCH (k:Knowledge {name: 'Brand Partnership Negotiation'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Influencer Advanced'})
MATCH (k:Knowledge {name: 'Monetization Strategies and Revenue Optimization'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Influencer Advanced'})
MATCH (s:Skill {name: 'Hook Writing and Attention Capture'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Influencer Advanced'})
MATCH (s:Skill {name: 'Algorithm Optimization and Distribution'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Influencer Advanced'})
MATCH (s:Skill {name: 'Multi-Platform Content Adaptation'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Influencer Advanced'})
MATCH (s:Skill {name: 'Analytics Deep Dive and Interpretation'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Influencer Advanced'})
MATCH (s:Skill {name: 'Content Batching and Production Systems'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Influencer Advanced'})
MATCH (s:Skill {name: 'Brand Partnership Proposal and Negotiation'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Influencer Advanced'})
MATCH (s:Skill {name: 'Audience Psychological Insight and Manipulation'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Influencer Advanced'})
MATCH (t:Trait {name: 'Creativity'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 60}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Influencer Advanced'})
MATCH (t:Trait {name: 'Emotional Intelligence'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Influencer Advanced'})
MATCH (t:Trait {name: 'Resilience'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 55}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Influencer Advanced'})
MATCH (t:Trait {name: 'Risk Tolerance'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 50}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Influencer Advanced'})
MATCH (m:Milestone {name: 'Hit 10000 Followers'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'Influencer Advanced'})
MATCH (m:Milestone {name: 'Secure First Brand Partnership'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'Influencer Advanced'})
MATCH (m:Milestone {name: 'Create Viral Content'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

// ============================================================
// Level 5 (Influencer Master) Requirements
// ============================================================

MATCH (level5:Domain_Level {level: 5, name: 'Influencer Master'})
MATCH (k:Knowledge {name: 'Audience Psychology and Behavioral Insights'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Influencer Master'})
MATCH (k:Knowledge {name: 'Crisis Management and Reputation Protection'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Influencer Master'})
MATCH (k:Knowledge {name: 'Trend Anticipation and Content Trend Riding'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Influencer Master'})
MATCH (k:Knowledge {name: 'Creator Economy Industry Landscape'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Influencer Master'})
MATCH (k:Knowledge {name: 'Audience Segmentation and Targeting'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Influencer Master'})
MATCH (k:Knowledge {name: 'Content Production Systems and Scaling'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Influencer Master'})
MATCH (k:Knowledge {name: 'Strategic Audience Growth and Retention'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Influencer Master'})
MATCH (k:Knowledge {name: 'Personal Brand Evolution and Reinvention'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Influencer Master'})
MATCH (k:Knowledge {name: 'Cross-Platform Ecosystem Strategy'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Influencer Master'})
MATCH (s:Skill {name: 'Trend Anticipation and Prediction'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Influencer Master'})
MATCH (s:Skill {name: 'Influence Monetization and Revenue Diversification'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Influencer Master'})
MATCH (s:Skill {name: 'Crisis Management and Reputation Protection'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Influencer Master'})
MATCH (s:Skill {name: 'Creator Community Leadership and Mentoring'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Influencer Master'})
MATCH (t:Trait {name: 'Emotional Intelligence'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 70}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Influencer Master'})
MATCH (t:Trait {name: 'Focus'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 70}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Influencer Master'})
MATCH (t:Trait {name: 'Openness to Feedback'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 65}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Influencer Master'})
MATCH (m:Milestone {name: 'Reach 100000 Followers'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Influencer Master'})
MATCH (m:Milestone {name: 'Launch Digital Product'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Influencer Master'})
MATCH (m:Milestone {name: 'Establish Multiple Revenue Streams'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Influencer Master'})
MATCH (m:Milestone {name: 'Successfully Navigate Platform Algorithm Change'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

// ============================================================
// Component Prerequisites
// ============================================================

// Knowledge Prerequisites
MATCH (k1:Knowledge {name: 'Hashtag Strategy and Discovery'})
MATCH (k2:Knowledge {name: 'Social Media Platform Fundamentals'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Community Engagement Techniques'})
MATCH (k2:Knowledge {name: 'Personal Branding Essentials'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Algorithm Understanding and Optimization'})
MATCH (k2:Knowledge {name: 'Platform Analytics Interpretation'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Content Format Specialization'})
MATCH (k2:Knowledge {name: 'Basic Content Creation Concepts'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Collaboration and Cross-Promotion'})
MATCH (k2:Knowledge {name: 'Personal Branding Essentials'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Analytics-Driven Content Strategy'})
MATCH (k2:Knowledge {name: 'Platform Analytics Interpretation'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Brand Partnership Negotiation'})
MATCH (k2:Knowledge {name: 'Personal Branding Essentials'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Monetization Strategies and Revenue Optimization'})
MATCH (k2:Knowledge {name: 'Brand Partnership Negotiation'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Audience Psychology and Behavioral Insights'})
MATCH (k2:Knowledge {name: 'Audience Basics'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Crisis Management and Reputation Protection'})
MATCH (k2:Knowledge {name: 'Community Engagement Techniques'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Trend Anticipation and Content Trend Riding'})
MATCH (k2:Knowledge {name: 'Content Format Specialization'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Audience Segmentation and Targeting'})
MATCH (k2:Knowledge {name: 'Audience Psychology and Behavioral Insights'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Content Production Systems and Scaling'})
MATCH (k2:Knowledge {name: 'Content Scheduling and Consistency'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Strategic Audience Growth and Retention'})
MATCH (k2:Knowledge {name: 'Audience Basics'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Personal Brand Evolution and Reinvention'})
MATCH (k2:Knowledge {name: 'Personal Branding Essentials'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Cross-Platform Ecosystem Strategy'})
MATCH (k2:Knowledge {name: 'Algorithm Understanding and Optimization'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

// Skill Prerequisites
MATCH (s1:Skill {name: 'Caption and Hashtag Writing'})
MATCH (s2:Skill {name: 'Content Planning and Ideation'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s2);

MATCH (s1:Skill {name: 'Visual Consistency and Branding'})
MATCH (s2:Skill {name: 'Basic Photo Editing'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s1:Skill {name: 'Hook Writing and Attention Capture'})
MATCH (k:Knowledge {name: 'Basic Content Creation Concepts'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Algorithm Optimization and Distribution'})
MATCH (k:Knowledge {name: 'Algorithm Understanding and Optimization'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s1:Skill {name: 'Multi-Platform Content Adaptation'})
MATCH (k:Knowledge {name: 'Content Format Specialization'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Analytics Deep Dive and Interpretation'})
MATCH (s2:Skill {name: 'Algorithm Optimization and Distribution'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Content Batching and Production Systems'})
MATCH (s2:Skill {name: 'Content Planning and Ideation'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Brand Partnership Proposal and Negotiation'})
MATCH (k:Knowledge {name: 'Brand Partnership Negotiation'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s1:Skill {name: 'Trend Anticipation and Prediction'})
MATCH (k:Knowledge {name: 'Trend Anticipation and Content Trend Riding'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Influence Monetization and Revenue Diversification'})
MATCH (k:Knowledge {name: 'Monetization Strategies and Revenue Optimization'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Crisis Management and Reputation Protection'})
MATCH (k:Knowledge {name: 'Crisis Management and Reputation Protection'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s1:Skill {name: 'Audience Psychological Insight and Manipulation'})
MATCH (k:Knowledge {name: 'Audience Psychology and Behavioral Insights'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s1:Skill {name: 'Creator Community Leadership and Mentoring'})
MATCH (s2:Skill {name: 'Authentic Community Engagement'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

// Milestone Prerequisites
MATCH (m1:Milestone {name: 'Reach 100 Followers'})
MATCH (m2:Milestone {name: 'Post First Content'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Establish Consistent Posting Schedule'})
MATCH (m2:Milestone {name: 'Reach 100 Followers'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Reach 1000 Followers'})
MATCH (m2:Milestone {name: 'Establish Consistent Posting Schedule'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Develop Recognizable Visual Style'})
MATCH (m2:Milestone {name: 'Establish Consistent Posting Schedule'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Create Viral Content'})
MATCH (m2:Milestone {name: 'Reach 1000 Followers'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Establish Authentic Community'})
MATCH (m2:Milestone {name: 'Reach 1000 Followers'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Hit 10000 Followers'})
MATCH (m2:Milestone {name: 'Establish Authentic Community'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Secure First Brand Partnership'})
MATCH (m2:Milestone {name: 'Hit 10000 Followers'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Reach 100000 Followers'})
MATCH (m2:Milestone {name: 'Hit 10000 Followers'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Launch Digital Product'})
MATCH (m2:Milestone {name: 'Hit 10000 Followers'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Establish Multiple Revenue Streams'})
MATCH (m2:Milestone {name: 'Secure First Brand Partnership'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Successfully Navigate Platform Algorithm Change'})
MATCH (m2:Milestone {name: 'Hit 10000 Followers'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Mentor Emerging Creator to Success'})
MATCH (m2:Milestone {name: 'Reach 100000 Followers'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Execute Multi-Creator Campaign'})
MATCH (m2:Milestone {name: 'Reach 100000 Followers'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Establish Industry Authority'})
MATCH (m2:Milestone {name: 'Reach 100000 Followers'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Expand Successfully to New Platform'})
MATCH (m2:Milestone {name: 'Reach 100000 Followers'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

