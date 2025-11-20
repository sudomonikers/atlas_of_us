// Domain: Social Media
// Generated: 2025-11-16
// Description: The practice of creating, sharing, and engaging with content and communities through digital platforms

// ============================================================
// DOMAIN: Social Media
// Generated: 2025-11-16
// Agent 1: Domain Structure
// ============================================================

// Create Domain
CREATE (d:Domain {
  name: 'Social Media',
  description: 'The practice of creating, sharing, and engaging with content and communities through digital platforms. Encompasses understanding platform mechanics, crafting compelling content, building authentic communities, and developing personal or professional presence online.',
  level_count: 5,
  created_date: date(),
  scope_included: ['platform literacy and navigation', 'content creation across formats (text, images, video, audio)', 'community engagement and relationship building', 'audience growth and audience management', 'content strategy and planning', 'personal branding and identity development', 'understanding platform algorithms and trends', 'analytics and performance tracking', 'authentic communication and authenticity', 'cross-platform presence management'],
  scope_excluded: ['professional advertising and marketing campaigns (separate domain)', 'graphic design and visual art creation (separate domain)', 'video production and filmmaking (separate domain)', 'web development and coding (separate domain)', 'mental health and social wellness (separate domain)', 'cybersecurity and privacy protection (separate domain)', 'journalism and news media (separate domain)']
});

// Create Domain Levels
CREATE (level1:Domain_Level {
  level: 1,
  name: 'Social Media Novice',
  description: 'Learning platform basics, creating initial content with simple formats, following others, and beginning to understand community norms'
});

CREATE (level2:Domain_Level {
  level: 2,
  name: 'Social Media Developing',
  description: 'Building consistent posting habits, experimenting with different content types, developing a recognizable voice, and actively engaging with communities'
});

CREATE (level3:Domain_Level {
  level: 3,
  name: 'Social Media Competent',
  description: 'Maintaining active presence across platforms, creating quality content regularly, building engaged audience, understanding basic analytics, and communicating authentically'
});

CREATE (level4:Domain_Level {
  level: 4,
  name: 'Social Media Advanced',
  description: 'Developing distinctive personal brand, mentoring others in content creation, understanding platform dynamics deeply, responding to trends strategically, and creating content that resonates widely'
});

CREATE (level5:Domain_Level {
  level: 5,
  name: 'Social Media Master',
  description: 'Building significant influence and reach, shaping discourse in areas of expertise, consistently creating viral or highly engaging content, leading community conversations, and advancing social media practices'
});

// Connect Domain to Levels
MATCH (d:Domain {name: 'Social Media'})
MATCH (level1:Domain_Level {name: 'Social Media Novice'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level1);

MATCH (d:Domain {name: 'Social Media'})
MATCH (level2:Domain_Level {name: 'Social Media Developing'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level2);

MATCH (d:Domain {name: 'Social Media'})
MATCH (level3:Domain_Level {name: 'Social Media Competent'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level3);

MATCH (d:Domain {name: 'Social Media'})
MATCH (level4:Domain_Level {name: 'Social Media Advanced'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level4);

MATCH (d:Domain {name: 'Social Media'})
MATCH (level5:Domain_Level {name: 'Social Media Master'})
CREATE (d)-[:HAS_DOMAIN_LEVEL]->(level5);

// ============================================================
// Agent 2a: Knowledge Nodes
// ============================================================

// Foundational Knowledge Nodes - Novice Level

MERGE (k:Knowledge {name: 'Social Media Platform Fundamentals'})
ON CREATE SET k.description = 'Basic understanding of major social media platforms: Facebook, Instagram, Twitter/X, TikTok, LinkedIn, YouTube. Knowing the core purpose, user demographics, and primary features of each platform.',
              k.how_to_learn = 'Create accounts on 3-5 major platforms and spend 1-2 weeks exploring each. Follow tutorials on platform features. Read official platform help documentation. Observe how different creators use each platform. Expected time: 2-3 weeks.',
              k.remember_level = 'Name major platforms and recall their primary purposes, user demographics, and basic features',
              k.understand_level = 'Explain what each platform is designed for and which audiences use which platforms most actively',
              k.apply_level = 'Choose appropriate platforms for specific content types and audiences based on platform strengths',
              k.analyze_level = 'Compare platform mechanics and identify why certain content types perform better on specific platforms',
              k.evaluate_level = 'Assess whether a platform is suitable for your specific goals and target audience',
              k.create_level = 'Design a multi-platform strategy that leverages each platform\'s unique strengths for your goals';

MERGE (k:Knowledge {name: 'Content Format Basics'})
ON CREATE SET k.description = 'Understanding different content formats: text posts, photos, videos, reels, stories, live streams, carousels, and threads. Knowing the technical requirements and best practices for each format.',
              k.how_to_learn = 'Create sample content in each format on test accounts. Study how successful creators use different formats. Experiment with posting the same message in different formats and observe engagement differences. Expected time: 2-3 weeks.',
              k.remember_level = 'Recall the names and basic characteristics of different content formats',
              k.understand_level = 'Explain the strengths and weaknesses of each format for different messaging goals',
              k.apply_level = 'Choose and create appropriate content formats for your message and audience',
              k.analyze_level = 'Break down successful posts to understand how format choices contributed to engagement',
              k.evaluate_level = 'Judge which formats will resonate best with your specific audience',
              k.create_level = 'Design innovative content formats or combinations that serve your unique message';

MERGE (k:Knowledge {name: 'Social Media Terminology'})
ON CREATE SET k.description = 'Essential vocabulary: hashtags, handles, followers, engagement, algorithms, viral, trending, impressions, reach, CTR, metrics, captions, and other commonly used terms in social media contexts.',
              k.how_to_learn = 'Read glossaries and tutorials about social media terminology. Follow industry discussions and observe how terms are used in context. Create a personal glossary. Expected time: 1 week.',
              k.remember_level = 'Recall definitions of key social media terms and acronyms',
              k.understand_level = 'Explain what each term means and how different metrics relate to content performance',
              k.apply_level = 'Use terminology correctly when discussing social media strategy and analyzing content',
              k.analyze_level = 'Examine how different metrics connect to understand overall content performance',
              k.evaluate_level = 'Assess the importance and relevance of specific metrics for your goals',
              k.create_level = 'Develop frameworks for understanding and teaching social media metrics to others';

MERGE (k:Knowledge {name: 'Basic Community Norms'})
ON CREATE SET k.description = 'Understanding unwritten rules of different communities: appropriate tone, posting frequency, content expectations, responding etiquette, and what behaviors are welcomed versus rejected.',
              k.how_to_learn = 'Join 5-10 different communities and observe interactions for 1-2 weeks before participating. Read community guidelines. Note successful versus unsuccessful posts. Talk with community members about norms. Expected time: 3-4 weeks.',
              k.remember_level = 'Recall common community guidelines and behavioral norms',
              k.understand_level = 'Explain why different communities have different norms and how those norms serve the community',
              k.apply_level = 'Adapt your communication style appropriately for different communities',
              k.analyze_level = 'Examine community dynamics to understand what behaviors are valued versus discouraged',
              k.evaluate_level = 'Judge whether your content aligns with community values and norms',
              k.create_level = 'Help establish and communicate norms for new communities you build';

MERGE (k:Knowledge {name: 'Basic Account Setup and Security'})
ON CREATE SET k.description = 'Creating accounts with strong passwords, setting privacy preferences, enabling two-factor authentication, understanding profile visibility settings, and protecting personal information online.',
              k.how_to_learn = 'Set up accounts on multiple platforms following platform security recommendations. Enable all available security features. Read privacy guides for each platform. Expected time: 3-5 days.',
              k.remember_level = 'Recall security best practices and available privacy settings on different platforms',
              k.understand_level = 'Explain why different privacy settings matter and what information you should protect',
              k.apply_level = 'Configure accounts with appropriate security and privacy settings for your comfort level',
              k.analyze_level = 'Examine platform policies to understand how your data is used and what settings protect your privacy',
              k.evaluate_level = 'Assess privacy risks and choose settings that balance accessibility with security',
              k.create_level = 'Design privacy and security guidelines for groups or organizations you manage';

// Core Knowledge Nodes - Developing/Competent Levels

MERGE (k:Knowledge {name: 'Authentic Communication'})
ON CREATE SET k.description = 'Communicating genuinely, sharing real stories, being vulnerable when appropriate, avoiding inauthenticity, maintaining consistency between online and offline personality, and building trust through honesty.',
              k.how_to_learn = 'Study creators known for authenticity and analyze what makes their communication genuine. Journal about your authentic story and values. Practice sharing personal stories gradually. Get feedback on whether your communication feels genuine to others. Expected time: 4-6 weeks.',
              k.remember_level = 'Recall characteristics of authentic versus inauthentic communication',
              k.understand_level = 'Explain why audiences respond better to authentic communication and what builds trust',
              k.apply_level = 'Share authentic stories and perspectives in your posts while maintaining comfort boundaries',
              k.analyze_level = 'Examine successful creators to identify what makes their communication feel genuine',
              k.evaluate_level = 'Judge whether your communication authentically represents your values and personality',
              k.create_level = 'Develop your authentic voice and help others discover theirs';

MERGE (k:Knowledge {name: 'Visual Composition Principles'})
ON CREATE SET k.description = 'Basic visual design concepts: color theory, composition, framing, white space, hierarchy, contrast, and balance. Understanding how visual elements guide attention and affect emotional responses.',
              k.how_to_learn = 'Take a basic visual design or photography course. Study high-performing posts and analyze their visual composition. Practice creating images and getting feedback. Experiment with design tools like Canva. Expected time: 3-4 weeks.',
              k.remember_level = 'Recall basic visual design principles and their names',
              k.understand_level = 'Explain how visual elements like color and composition affect viewer perception and emotion',
              k.apply_level = 'Apply design principles when creating or selecting images for posts',
              k.analyze_level = 'Break down successful posts to understand how visual composition contributed to engagement',
              k.evaluate_level = 'Judge whether visual composition effectively supports your message',
              k.create_level = 'Design visually compelling content that stands out in feeds';

MERGE (k:Knowledge {name: 'Audience Identification and Understanding'})
ON CREATE SET k.description = 'Defining who your target audience is: demographics, psychographics, interests, pain points, aspirations. Understanding what content resonates with specific audience segments.',
              k.how_to_learn = 'Interview 10-15 people in your target audience about their interests and problems. Use analytics to understand follower demographics. Join communities where your audience spends time. Read audience interests and common questions. Expected time: 4-6 weeks.',
              k.remember_level = 'Recall demographic and psychographic characteristics of your target audience',
              k.understand_level = 'Explain what problems and aspirations drive your audience\'s interests',
              k.apply_level = 'Create content specifically addressing your audience\'s interests and needs',
              k.analyze_level = 'Examine audience behavior patterns to understand what content resonates most',
              k.evaluate_level = 'Judge whether content effectively speaks to your target audience\'s values',
              k.create_level = 'Develop deep audience personas and use them to guide content strategy';

MERGE (k:Knowledge {name: 'Hashtag Strategy'})
ON CREATE SET k.description = 'Understanding hashtags: how they work, what they do, finding relevant hashtags, using hashtags strategically, avoiding hashtag mistakes, and optimizing hashtag placement for discoverability.',
              k.how_to_learn = 'Research hashtag strategy by studying high-performing posts in your niche. Test different hashtag combinations on your own posts and track results. Use hashtag research tools. Follow trends in your niche. Expected time: 3-4 weeks.',
              k.remember_level = 'Recall how hashtags function and basic hashtag best practices',
              k.understand_level = 'Explain why hashtags matter for discoverability and how platforms use them',
              k.apply_level = 'Research and use relevant hashtags to increase post visibility',
              k.analyze_level = 'Examine hashtag performance data to identify which hashtags drive engagement',
              k.evaluate_level = 'Judge hashtag quality and relevance for your content and audience',
              k.create_level = 'Develop hashtag strategies for specific campaigns and content series';

MERGE (k:Knowledge {name: 'Engagement Mechanics'})
ON CREATE SET k.description = 'Understanding how engagement works: likes, comments, shares, saves, replies, algorithmic amplification based on engagement, and how to encourage meaningful interaction.',
              k.how_to_learn = 'Track engagement patterns on your own posts and others\' posts for 4-6 weeks. Experiment with different engagement-driving tactics. Read platform research about how algorithms prioritize content. Study high-engagement posts and analyze engagement patterns. Expected time: 4-6 weeks.',
              k.remember_level = 'Recall different types of engagement metrics and what they indicate',
              k.understand_level = 'Explain how engagement signals affect content visibility and reach',
              k.apply_level = 'Create content designed to encourage meaningful engagement from your audience',
              k.analyze_level = 'Examine engagement patterns to understand what types of content resonate most',
              k.evaluate_level = 'Judge whether engagement on your content is meaningful or superficial',
              k.create_level = 'Design engagement strategies that build community around your content';

MERGE (k:Knowledge {name: 'Algorithm Basics'})
ON CREATE SET k.description = 'Understanding that platforms use algorithms to decide what content to show, that algorithms prioritize certain engagement metrics, and how algorithm changes affect content visibility.',
              k.how_to_learn = 'Read official platform documentation about how their algorithms work. Follow industry commentary about algorithm updates. Observe your own content performance patterns. Join creator communities discussing algorithm impacts. Expected time: 3-4 weeks.',
              k.remember_level = 'Recall that platforms use algorithms and key factors algorithms consider',
              k.understand_level = 'Explain how algorithms prioritize certain content and how they impact reach',
              k.apply_level = 'Create content with algorithm principles in mind while maintaining authenticity',
              k.analyze_level = 'Examine how algorithm changes affect content visibility and reach patterns',
              k.evaluate_level = 'Judge how much to optimize for algorithms versus audience authenticity',
              k.create_level = 'Develop strategies that work with platform algorithms while staying authentic';

// Advanced Knowledge Nodes - Advanced Level

MERGE (k:Knowledge {name: 'Content Strategy and Planning'})
ON CREATE SET k.description = 'Creating comprehensive content strategies: defining goals, planning content calendars, ensuring content variety, batching content creation, maintaining consistency, and adapting strategy based on performance.',
              k.how_to_learn = 'Study content strategies of successful creators in your niche for 2-3 weeks. Create a detailed content calendar for 1-3 months. Track how well you execute the plan and what adjustments help. Learn from industry experts about strategic planning. Expected time: 6-8 weeks.',
              k.remember_level = 'Recall elements of effective content strategies and planning frameworks',
              k.understand_level = 'Explain how content planning supports long-term audience growth and goals',
              k.apply_level = 'Develop a content calendar and strategy aligned with your goals',
              k.analyze_level = 'Examine successful content strategies to understand what makes them work',
              k.evaluate_level = 'Judge whether your strategy is working and identify needed adjustments',
              k.create_level = 'Design innovative content strategies that differentiate your presence';

MERGE (k:Knowledge {name: 'Personal Brand Development'})
ON CREATE SET k.description = 'Developing a distinctive personal or professional brand: identifying your unique value, defining your brand voice, choosing visual aesthetics, building recognition, and maintaining brand consistency across platforms.',
              k.how_to_learn = 'Analyze personal brands you admire for 2-3 weeks. Define your values, strengths, and unique perspectives. Experiment with different brand aesthetics and voices. Get feedback from audience members about how they perceive your brand. Iterate based on feedback. Expected time: 8-12 weeks.',
              k.remember_level = 'Recall elements of strong personal brands and brand identity components',
              k.understand_level = 'Explain why strong personal branding creates audience loyalty and opportunities',
              k.apply_level = 'Develop consistent visual identity and brand voice across platforms',
              k.analyze_level = 'Examine successful brands to understand what makes them distinctive',
              k.evaluate_level = 'Judge whether your brand clearly communicates your unique value',
              k.create_level = 'Design a comprehensive personal brand strategy and visual identity';

MERGE (k:Knowledge {name: 'Advanced Analytics Interpretation'})
ON CREATE SET k.description = 'Understanding detailed analytics: audience demographics, content performance metrics, engagement rates, reach patterns, follower growth trends, optimal posting times, and using data to optimize strategy.',
              k.how_to_learn = 'Explore analytics dashboards for 4-6 weeks. Learn what different metrics mean and how they connect. Study posts with different performance levels and analyze what drove results. Take courses on social media analytics. Expected time: 6-8 weeks.',
              k.remember_level = 'Recall what different analytics metrics mean and how they\'re calculated',
              k.understand_level = 'Explain how analytics reveal audience behavior and content preferences',
              k.apply_level = 'Use analytics data to optimize posting times, content types, and strategies',
              k.analyze_level = 'Break down analytics to identify patterns and connections between variables',
              k.evaluate_level = 'Judge data quality and accuracy, and assess what it reveals about performance',
              k.create_level = 'Develop analytics frameworks for tracking progress toward specific goals';

MERGE (k:Knowledge {name: 'Trend Awareness and Adoption'})
ON CREATE SET k.description = 'Identifying emerging trends early, understanding trend cycles, deciding which trends align with your brand, adapting trends for your authentic voice, and participating in trends without losing authenticity.',
              k.how_to_learn = 'Follow trending sections on platforms daily for 4-6 weeks. Join creator communities discussing emerging trends. Analyze trend adoption timelines of successful creators. Experiment with adopting trends in your voice. Expected time: 6-8 weeks.',
              k.remember_level = 'Recall recent trends and understand what makes something trendy',
              k.understand_level = 'Explain trend cycles and how to identify trends early',
              k.apply_level = 'Adopt trending formats or topics in ways that align with your brand and voice',
              k.analyze_level = 'Examine how successful creators adapt trends and what makes trend participation effective',
              k.evaluate_level = 'Judge which trends are worth your time and effort based on audience fit',
              k.create_level = 'Develop strategies for trend adoption that maintain brand authenticity';

MERGE (k:Knowledge {name: 'Community Building'})
ON CREATE SET k.description = 'Building engaged, loyal communities: creating safe spaces for discourse, encouraging conversation, facilitating connections between community members, addressing conflict, and fostering belonging.',
              k.how_to_learn = 'Study communities you admire for 4-6 weeks and observe leadership practices. Start building a community and experiment with different engagement approaches. Get feedback from community members. Read books about community building. Expected time: 8-12 weeks.',
              k.remember_level = 'Recall elements of healthy communities and community-building practices',
              k.understand_level = 'Explain how strong communities form and why people want to belong',
              k.apply_level = 'Create and nurture a community around your content and message',
              k.analyze_level = 'Examine community dynamics to understand what drives member engagement',
              k.evaluate_level = 'Judge community health and identify areas for improvement',
              k.create_level = 'Design comprehensive community strategies and governance structures';

MERGE (k:Knowledge {name: 'Cross-Platform Presence Management'})
ON CREATE SET k.description = 'Managing a presence across multiple platforms: adapting content for platform differences, maintaining consistency while being platform-specific, repurposing content strategically, and managing time efficiently.',
              k.how_to_learn = 'Develop presence on 3-4 platforms and practice adapting content for each for 6-8 weeks. Use scheduling tools and content repurposing strategies. Track effort versus returns on each platform. Expected time: 8-10 weeks.',
              k.remember_level = 'Recall platform strengths and how to adapt content formats',
              k.understand_level = 'Explain platform-specific best practices and content adaptation strategies',
              k.apply_level = 'Repurpose and adapt content across multiple platforms efficiently',
              k.analyze_level = 'Examine performance across platforms to understand where your audience is most active',
              k.evaluate_level = 'Judge which platforms deserve your attention based on ROI',
              k.create_level = 'Design multi-platform strategies that leverage unique strengths of each platform';

// Specialized Knowledge Nodes - Master Level

MERGE (k:Knowledge {name: 'Influence and Thought Leadership'})
ON CREATE SET k.description = 'Building influence in a domain: establishing expertise, creating original insights, shaping discourse, mentoring others, and becoming a recognized voice in your area of focus.',
              k.how_to_learn = 'Study thought leaders in your niche for 2-3 months and analyze their paths. Develop original perspectives through deep research and experience. Build public intellectual presence by sharing insights. Engage in meaningful discourse. Help others develop their voices. Expected time: 12+ months.',
              k.remember_level = 'Recall characteristics of recognized thought leaders and influence paths',
              k.understand_level = 'Explain how thought leaders build credibility and shape discourse',
              k.apply_level = 'Create original content that contributes to discourse in your domain',
              k.analyze_level = 'Examine thought leadership strategies to understand what creates lasting influence',
              k.evaluate_level = 'Judge whether your contributions meaningfully advance discourse',
              k.create_level = 'Develop comprehensive thought leadership strategy and share frameworks with others';

MERGE (k:Knowledge {name: 'Viral Content Mechanics'})
ON CREATE SET k.description = 'Understanding what makes content spread: psychological triggers, emotional resonance, shareability, novelty, cultural relevance, and timing. Creating content with viral potential while maintaining authenticity.',
              k.how_to_learn = 'Analyze viral content in your niche for 4-6 weeks and identify patterns. Study psychological research about sharing behavior. Create content intentionally designed to be shareable. Track what actually goes viral. Study failed attempts to understand what doesn\'t work. Expected time: 8-12 weeks.',
              k.remember_level = 'Recall factors that influence content shareability and virality',
              k.understand_level = 'Explain psychological and social factors that drive content sharing',
              k.apply_level = 'Create compelling content that naturally encourages sharing',
              k.analyze_level = 'Break down viral content to understand what triggered sharing',
              k.evaluate_level = 'Judge whether content has viral potential while assessing authenticity',
              k.create_level = 'Design content frameworks that balance virality with brand integrity';

MERGE (k:Knowledge {name: 'Platform Evolution and Innovation'})
ON CREATE SET k.description = 'Understanding how platforms evolve, anticipating changes, adapting to new features early, experimenting with emerging platforms, and staying ahead of the curve in social media landscape.',
              k.how_to_learn = 'Follow platform news and updates closely for 3+ months. Join beta programs for new features. Experiment with emerging platforms early. Study how successful creators adapt to platform changes. Predict likely future changes based on current trends. Expected time: Ongoing (12+ months of active practice).',
              k.remember_level = 'Recall major platform changes and new features as they emerge',
              k.understand_level = 'Explain why platforms evolve and how to anticipate likely changes',
              k.apply_level = 'Adapt strategies quickly when platforms change and experiment with new features',
              k.analyze_level = 'Examine platform evolution patterns to predict future directions',
              k.evaluate_level = 'Judge which platform changes are significant and how to respond',
              k.create_level = 'Develop forward-thinking strategies that work across platform evolution';

MERGE (k:Knowledge {name: 'Social Impact and Responsibility'})
ON CREATE SET k.description = 'Understanding influence\'s ethical implications: responsible use of reach, avoiding misinformation, considering social impact, addressing harassment, thinking about long-term consequences, and leading by example.',
              k.how_to_learn = 'Study ethical frameworks for social media influence. Observe how respected creators handle responsibility. Engage in discussions about platform ethics. Consider impact of your own content. Research cases of harmful influence. Get feedback on your impact. Expected time: Ongoing (12+ months of reflection).',
              k.remember_level = 'Recall ethical considerations for social media influence and responsibility frameworks',
              k.understand_level = 'Explain why creators with influence have ethical obligations',
              k.apply_level = 'Make intentional choices about what you share based on potential impact',
              k.analyze_level = 'Examine how influential creators handle responsibility and impact',
              k.evaluate_level = 'Judge whether your content creates positive or negative impacts',
              k.create_level = 'Develop comprehensive ethical guidelines for responsible influence';

// ============================================================
// Agent 2b: Skill Nodes
// ============================================================

// Basic Skills - Novice Level

MERGE (s:Skill {name: 'Platform Navigation'})
ON CREATE SET s.description = 'The ability to navigate social media platforms efficiently, find key features, understand interface layouts, and perform basic platform operations like posting, scrolling, and searching.',
              s.how_to_develop = 'Create accounts on multiple platforms and spend 1-2 weeks exploring each. Follow tutorials on platform interfaces. Practice basic actions repeatedly: posting, commenting, messaging, searching. Take screenshots of common tasks and practice them daily. Expected time: 1-2 weeks.',
              s.novice_level = 'Unfamiliar with platform interface. Takes time to find basic features. Often gets lost in menus. To progress: Use platform daily for basic tasks.',
              s.advanced_beginner_level = 'Can find main features but occasionally needs to search for less common functions. Understands basic navigation but may miss shortcuts. To progress: Explore less obvious features and menu systems.',
              s.competent_level = 'Navigates confidently through all common platform features. Understands menu structures and can find most functions without searching. To progress: Learn platform shortcuts and hidden features.',
              s.proficient_level = 'Navigates intuitively with full understanding of platform structure. Uses keyboard shortcuts automatically. Understands platform design logic. To progress: Teach others platform navigation.',
              s.expert_level = 'Complete mastery of platform interface including hidden features and beta tools. Can navigate any platform quickly regardless of interface design. Teaches others advanced navigation techniques.';

MERGE (s:Skill {name: 'Basic Content Writing'})
ON CREATE SET s.description = 'The ability to write clear, concise posts for social media including captions, descriptions, and text-based content. Focuses on clarity, grammar, and appropriate length for the medium.',
              s.how_to_develop = 'Write 10-20 posts daily for 2-3 weeks on a test account. Study high-performing posts and analyze their writing. Take a social media writing course. Get feedback from experienced creators. Practice editing your own work. Expected time: 2-3 weeks.',
              s.novice_level = 'Writing is often unclear or too long. Struggles with platform conventions (hashtag placement, caption length). Grammar may have errors. To progress: Write more frequently and study successful posts.',
              s.advanced_beginner_level = 'Writes clearly with mostly correct grammar. Beginning to understand platform conventions. Posts may still be too long or lack engagement hooks. To progress: Study engagement-driving writing techniques.',
              s.competent_level = 'Consistently writes clear, well-edited posts at appropriate length. Understands platform conventions and can write for different platforms. To progress: Develop distinctive voice and personality.',
              s.proficient_level = 'Writes with clarity and personality. Intuitively understands platform conventions. Posts are concise, engaging, and well-structured. To progress: Develop unique voice that stands out.',
              s.expert_level = 'Writing is compelling, authentic, and engaging. Intuitively crafts captions that drive engagement. Can adapt writing style for different platforms and audiences seamlessly.';

MERGE (s:Skill {name: 'Image Selection and Posting'})
ON CREATE SET s.description = 'The ability to choose appropriate images for social media, ensure they meet platform technical requirements, and post them correctly with proper formatting and sizing.',
              s.how_to_develop = 'Post images daily for 2-3 weeks, testing different image types, sizes, and formats. Learn platform image specifications from official documentation. Experiment with image quality and sizing. Study how professional creators use images. Expected time: 2-3 weeks.',
              s.novice_level = 'Struggles with image sizing. Posts low-quality or inappropriately sized images. Takes time to understand platform image requirements. To progress: Learn platform image specifications.',
              s.advanced_beginner_level = 'Can select reasonable images but sizing sometimes needs adjustment. Beginning to understand image quality requirements. To progress: Study high-performing image posts.',
              s.competent_level = 'Selects appropriate images, understands platform requirements, and posts correctly. Images are properly sized and reasonably good quality. To progress: Learn visual composition principles.',
              s.proficient_level = 'Selects images intuitively based on what will work well. Understanding of composition and image quality. Images support your message effectively. To progress: Develop signature visual style.',
              s.expert_level = 'Selects images with sophisticated understanding of composition, color, and brand fit. Images consistently attract engagement. Can explain visual choices and their impact.';

MERGE (s:Skill {name: 'Profile Setup and Optimization'})
ON CREATE SET s.description = 'The ability to create and optimize social media profiles, including bio writing, profile picture selection, and initial profile setup with good practices.',
              s.how_to_develop = 'Set up 3-5 accounts from scratch, using best practices guides. Study profile setups of creators in your niche. Write and revise multiple versions of bios. Get feedback on your profiles. Expected time: 1-2 weeks.',
              s.novice_level = 'Profile is incomplete or unclear. Bio is vague or poorly written. Picture and formatting are basic. To progress: Study successful profile examples.',
              s.advanced_beginner_level = 'Profile is complete with clear bio. Basic profile picture. Shows understanding of what information is important. To progress: Study high-performing profiles.',
              s.competent_level = 'Profile is clear and professional with good bio. Appropriate profile picture. All relevant information included. To progress: Optimize for SEO and discoverability.',
              s.proficient_level = 'Profile is polished and optimized. Bio is clear and compelling. Picture and design choices support brand. Profile invites engagement. To progress: Create unique profile aesthetic.',
              s.expert_level = 'Profile instantly communicates value and creates strong first impression. Bio is compelling and benefits-focused. Profile design and picture support brand perfectly.';

MERGE (s:Skill {name: 'Comment Etiquette'})
ON CREATE SET s.description = 'The ability to write meaningful, respectful comments on others\' posts. Understanding commenting norms and best practices for building community connections.',
              s.how_to_develop = 'Read 50+ posts from creators in your niche and observe good comments. Write 100+ thoughtful comments over 2-3 weeks. Reflect on responses and adjust approach. Learn from community guidelines. Expected time: 3-4 weeks.',
              s.novice_level = 'Comments are often generic ("nice!") or miss the point. Doesn\'t understand commenting norms. To progress: Write more thoughtful, specific comments.',
              s.advanced_beginner_level = 'Comments are generally relevant but sometimes generic. Beginning to understand what creators appreciate. To progress: Ask questions and add genuine insights.',
              s.competent_level = 'Writes thoughtful, relevant comments regularly. Shows genuine interest. Follows community commenting norms. To progress: Build relationships through consistent, quality commenting.',
              s.proficient_level = 'Comments are insightful and often get responses. Shows deep engagement with content. Builds meaningful connections through comments. To progress: Help create community conversations.',
              s.expert_level = 'Comments are valued and often spark important conversations. Respected for thoughtful, authentic engagement. Comments build community and strengthen relationships.';

MERGE (s:Skill {name: 'Hashtag Research and Usage'})
ON CREATE SET s.description = 'The ability to find relevant hashtags, understand hashtag dynamics, and use hashtags strategically to increase post visibility and reach target audiences.',
              s.how_to_develop = 'Research hashtags in your niche for 2-3 weeks. Test different hashtag combinations on 20+ posts and track results. Use hashtag research tools. Study hashtag strategies of successful creators. Expected time: 3-4 weeks.',
              s.novice_level = 'Uses generic or irrelevant hashtags. Struggles to find appropriate hashtags. Hashtag placement may be awkward. To progress: Research hashtags more systematically.',
              s.advanced_beginner_level = 'Finds mostly relevant hashtags but selection is hit-or-miss. Beginning to understand hashtag strategy. To progress: Use hashtag research tools and track results.',
              s.competent_level = 'Researches and uses relevant hashtags consistently. Understands hashtag strategy basics. Hashtag use supports post visibility. To progress: Develop more sophisticated hashtag strategies.',
              s.proficient_level = 'Uses hashtags strategically with good understanding of reach and niche fit. Hashtag selection supports visibility goals. Tracks what works. To progress: Create signature hashtag strategies.',
              s.expert_level = 'Hashtag selection is sophisticated and highly effective. Understands hashtag ecosystems and trends. Can predict which hashtags will perform well.';

// Intermediate Skills - Developing/Competent Levels

MERGE (s:Skill {name: 'Engagement Response'})
ON CREATE SET s.description = 'The ability to respond thoughtfully to comments on your posts, engage in conversations, and build relationships with your audience through meaningful interactions.',
              s.how_to_develop = 'Post content and commit to responding to all comments for 4-6 weeks. Study how successful creators respond to engagement. Experiment with different response styles. Track which responses generate more conversation. Expected time: 4-6 weeks.',
              s.novice_level = 'Responds inconsistently. Responses are brief or generic. Doesn\'t understand how to build conversations. To progress: Respond to every comment thoughtfully.',
              s.advanced_beginner_level = 'Responds to most comments with adequate replies. Some responses show personality. Beginning to understand engagement patterns. To progress: Make responses more personal and specific.',
              s.competent_level = 'Responds consistently and thoughtfully. Responses show genuine interest and personality. Builds some conversations in comments. To progress: Deepen relationship building through responses.',
              s.proficient_level = 'Responses feel natural and often extend conversations. Shows authentic interest in audience. Builds genuine relationships. To progress: Use responses to deepen community bonds.',
              s.expert_level = 'Responses are warm, authentic, and often delightful. Consistently builds strong relationships through engagement. Responses feel personal even at large scale.';

MERGE (s:Skill {name: 'Storytelling Through Posts'})
ON CREATE SET s.description = 'The ability to tell compelling stories in social media formats, creating narrative arcs in captions, using hooks to grab attention, and building emotional connections through narrative.',
              s.how_to_develop = 'Write 30+ story-based posts over 4-6 weeks. Study storytelling in successful posts and analyze narrative techniques. Take a storytelling course. Get feedback on your stories. Reflect on which stories resonate most. Expected time: 6-8 weeks.',
              s.novice_level = 'Posts are mostly factual without much narrative. Struggles with attention hooks. Stories don\'t flow well. To progress: Study how successful posts tell stories.',
              s.advanced_beginner_level = 'Posts have some narrative elements but lack polish. May have weak hooks or unclear story arcs. To progress: Study and practice narrative structure.',
              s.competent_level = 'Posts tell clear stories with recognizable arcs. Good hooks to grab attention. Stories are relatable but may lack depth. To progress: Develop more sophisticated storytelling.',
              s.proficient_level = 'Stories are compelling and emotionally resonant. Strong hooks and narrative structure. Stories feel authentic and personal. To progress: Develop signature storytelling style.',
              s.expert_level = 'Stories are powerful and moving. Instantly grabs attention and holds it. Creates deep emotional connections through narrative. Stories become signature part of brand.';

MERGE (s:Skill {name: 'Content Batching and Scheduling'})
ON CREATE SET s.description = 'The ability to create multiple pieces of content at once, schedule them for later posting, and maintain consistent posting schedules without daily scrambling.',
              s.how_to_develop = 'Create 1-2 weeks of content in a single session. Use scheduling tools to schedule posts. Track posting consistency over 4-6 weeks. Experiment with batching different amounts of content. Expected time: 4-6 weeks.',
              s.novice_level = 'Posts sporadically without advance planning. Struggles with tools and scheduling. Posting is inconsistent. To progress: Try batching content weekly.',
              s.advanced_beginner_level = 'Can batch some content but may still post inconsistently. Learning scheduling tools. Batching is inefficient. To progress: Develop batching system and process.',
              s.competent_level = 'Batches content regularly and maintains consistent posting schedule. Scheduling tools are familiar and used effectively. To progress: Optimize batching efficiency.',
              s.proficient_level = 'Batching process is streamlined and efficient. Maintains consistent schedule across platforms. Batching frees time for other activities. To progress: Scale batching process.',
              s.expert_level = 'Batching process is highly efficient and adaptable. Can quickly create months of content if needed. Maintains perfect consistency while being flexible.';

MERGE (s:Skill {name: 'Analytics Interpretation'})
ON CREATE SET s.description = 'The ability to read and understand social media analytics, interpret data about post performance, audience engagement, and growth metrics, and use data to inform decisions.',
              s.how_to_develop = 'Review analytics dashboards daily for 4-6 weeks. Document performance of different post types. Compare analytics to actual content. Take a social media analytics course. Look for patterns and correlations. Expected time: 6-8 weeks.',
              s.novice_level = 'Confused by analytics dashboards. Doesn\'t understand what metrics mean. To progress: Learn what each metric represents.',
              s.advanced_beginner_level = 'Understands basic metrics like followers and engagement count. Struggles with more complex analytics. To progress: Learn analytics interpretation methods.',
              s.competent_level = 'Reads analytics reports and understands performance data. Can identify top-performing posts. Makes basic data-informed decisions. To progress: Find deeper insights in analytics.',
              s.proficient_level = 'Quickly identifies patterns in analytics. Understands what data reveals about audience. Uses insights to optimize strategy. To progress: Develop sophisticated analytics frameworks.',
              s.expert_level = 'Analytics interpretation is sophisticated and insightful. Sees connections others miss. Uses data to drive strategy with accuracy and nuance.';

MERGE (s:Skill {name: 'Video Content Creation'})
ON CREATE SET s.description = 'The ability to plan, shoot, and post video content for social media including short-form videos, selfie videos, and simple video editing.',
              s.how_to_develop = 'Create and post 20+ videos over 4-6 weeks. Learn basic video shooting techniques (lighting, framing, audio). Practice video editing in simple tools. Study high-performing videos in your niche. Get comfortable on camera. Expected time: 6-8 weeks.',
              s.novice_level = 'Video quality is poor or shaky. Lighting and audio are problematic. Uncomfortable on camera. To progress: Practice shooting and watch professional videos.',
              s.advanced_beginner_level = 'Can shoot watchable videos but with some quality issues. Beginning to understand video best practices. To progress: Study video composition and editing.',
              s.competent_level = 'Shoots clear, watchable videos with decent quality. Understands basic camera angles and framing. Comfortable on camera. To progress: Improve video editing skills.',
              s.proficient_level = 'Videos are well-shot with good lighting and clear audio. Comfortable and natural on camera. Basic editing is smooth. To progress: Develop more sophisticated video production.',
              s.expert_level = 'Videos are polished and engaging. Excellent technical quality and on-camera presence. Video production feels effortless and looks professional.';

MERGE (s:Skill {name: 'Collaborative Content Creation'})
ON CREATE SET s.description = 'The ability to create content with other creators through duets, collaborations, comments, shoutouts, and co-created posts. Building partnerships through collaboration.',
              s.how_to_develop = 'Collaborate with 3-5 creators over 6-8 weeks. Study successful collaborations. Reach out with collaboration ideas. Execute 5-10 collaborative pieces. Reflect on what works. Expected time: 6-8 weeks.',
              s.novice_level = 'Uncomfortable initiating collaboration. Struggles with collaborative process. Collaborations feel awkward or unequal. To progress: Study successful collaborations.',
              s.advanced_beginner_level = 'Can participate in collaborations initiated by others. Learning collaborative process. Some collaborations work well. To progress: Develop collaborative skills.',
              s.competent_level = 'Comfortable collaborating and initiating partnerships. Creates good collaborative content. Manages logistics effectively. To progress: Build strong creator partnerships.',
              s.proficient_level = 'Collaborations feel natural and energized. Creates engaging collaborative content. Builds strong creator relationships. To progress: Mentor other creators in collaboration.',
              s.expert_level = 'Collaborations are inspiring and highly engaging. Creates magic with other creators. Partnerships generate opportunities and growth for all involved.';

MERGE (s:Skill {name: 'Trend Participation'})
ON CREATE SET s.description = 'The ability to identify emerging trends, understand trend timing, and participate in trends in ways that align with your brand while maintaining authenticity.',
              s.how_to_develop = 'Track trending sections daily for 4-6 weeks. Participate in 15-20 trends in your authentic voice. Study trend adoption timelines. Analyze which trends drive engagement for you. Expected time: 6-8 weeks.',
              s.novice_level = 'Unaware of most trends. When participating, feels forced or off-brand. Poor timing on trend adoption. To progress: Watch trending sections daily.',
              s.advanced_beginner_level = 'Notices some trends but may miss many. Trend participation feels somewhat awkward. To progress: Practice trend participation in your voice.',
              s.competent_level = 'Recognizes most trends and can participate authentically. Good timing on trend adoption. Balances trend participation with original content. To progress: Develop strategic trend adoption.',
              s.proficient_level = 'Identifies trends early and participates naturally and effectively. Trends feel integrated into your brand. Trend participation drives engagement. To progress: Lead trend creation.',
              s.expert_level = 'Trend participation is sophisticated and effective. Can adopt any trend and make it your own. Often sets trends rather than following them.';

// Advanced Skills - Advanced Level

MERGE (s:Skill {name: 'Personal Brand Development'})
ON CREATE SET s.description = 'The ability to develop a distinctive personal or professional brand on social media, including visual identity, voice consistency, value proposition clarity, and brand recognition across platforms.',
              s.how_to_develop = 'Study 10 personal brands you admire for 4-6 weeks. Define your values and unique perspectives. Develop visual identity (colors, fonts, aesthetics). Experiment with brand voice. Get feedback from audience. Iterate based on results. Expected time: 12-16 weeks.',
              s.novice_level = 'No clear personal brand. Presence feels generic or scattered. Voice is inconsistent. To progress: Define your unique value and perspective.',
              s.advanced_beginner_level = 'Emerging personal brand with some consistency. Voice is developing. Visual identity is starting to form. To progress: Strengthen brand consistency.',
              s.competent_level = 'Clear personal brand with recognizable voice and visual identity. Some brand recognition among followers. To progress: Deepen brand distinctiveness.',
              s.proficient_level = 'Strong personal brand with distinctive voice and aesthetic. Brand recognition growing. Followers know what to expect. To progress: Become iconic in your niche.',
              s.expert_level = 'Iconic personal brand instantly recognizable. Distinctive voice that stands out. Strong brand loyalty and passionate following. Brand is unique and memorable.';

MERGE (s:Skill {name: 'Audience Community Building'})
ON CREATE SET s.description = 'The ability to build engaged, loyal communities around your content by fostering connections, creating spaces for dialogue, facilitating member relationships, and cultivating belonging.',
              s.how_to_develop = 'Actively build community for 12-16 weeks through consistent engagement, creating discussion opportunities, and facilitating connections. Study community-focused creators. Experiment with different community-building tactics. Track community health metrics. Expected time: 12+ weeks.',
              s.novice_level = 'Followers are passive. Limited engagement and conversation. No sense of community. To progress: Actively engage and create discussion opportunities.',
              s.advanced_beginner_level = 'Some community forming but still mostly passive audience. Some conversations happening. To progress: Intentionally build community identity.',
              s.competent_level = 'Community is forming with regular engagement and conversation. Members feel some sense of belonging. To progress: Deepen community bonds.',
              s.proficient_level = 'Strong community with active engagement and member-to-member connections. Sense of belonging and shared values. To progress: Create community rituals and identity.',
              s.expert_level = 'Thriving community with high engagement and strong bonds. Members see themselves as part of something. Community has its own culture and identity.';

MERGE (s:Skill {name: 'Cross-Platform Content Adaptation'})
ON CREATE SET s.description = 'The ability to adapt content effectively across different platforms while maintaining consistency, understanding platform-specific best practices, and optimizing for each platform\'s unique algorithms and audiences.',
              s.how_to_develop = 'Maintain active presence on 3-4 platforms for 8-12 weeks. Practice adapting same content for different platforms. Track performance on each platform. Study what works best on each platform. Use scheduling tools with platform-specific features. Expected time: 8-12 weeks.',
              s.novice_level = 'Same content on all platforms. Doesn\'t understand platform differences. Poor adaptation. To progress: Study platform-specific best practices.',
              s.advanced_beginner_level = 'Attempts platform adaptation but inconsistent. Some platform-specific optimization. To progress: Deepen understanding of each platform.',
              s.competent_level = 'Adapts content for different platforms effectively. Understands platform best practices. Maintains consistent messaging across platforms. To progress: Optimize adaptation process.',
              s.proficient_level = 'Content adaptation is seamless and natural. Perfect balance of consistency and platform optimization. Strong results on all platforms. To progress: Create platform-specific content strategies.',
              s.expert_level = 'Platform adaptation is sophisticated and highly effective. Content feels native on each platform while maintaining brand identity. Maximizes each platform\'s potential.';

MERGE (s:Skill {name: 'Performance Optimization'})
ON CREATE SET s.description = 'The ability to analyze performance data, identify what\'s working and what isn\'t, test variations, and systematically improve content performance and growth metrics.',
              s.how_to_develop = 'Run A/B tests on 20-30 posts over 8-12 weeks. Track detailed performance metrics. Document what works and why. Make hypothesis-driven changes. Study optimization strategies of successful creators. Expected time: 8-12 weeks.',
              s.novice_level = 'Posts casually without analyzing performance. Doesn\'t test variations. Doesn\'t optimize based on data. To progress: Start tracking and testing.',
              s.advanced_beginner_level = 'Notices performance differences but doesn\'t systematically optimize. Some testing done. To progress: Develop testing and optimization process.',
              s.competent_level = 'Tests variations and makes data-driven improvements. Understands what affects performance. Seeing gradual improvement. To progress: Develop more sophisticated testing.',
              s.proficient_level = 'Optimization is systematic and effective. Tests multiple variations. Drives consistent improvement in metrics. To progress: Share optimization learnings with others.',
              s.expert_level = 'Optimization is sophisticated and often ahead of platform trends. Small improvements compound to major results. Can teach optimization frameworks to others.';

MERGE (s:Skill {name: 'Authentic Voice Development'})
ON CREATE SET s.description = 'The ability to discover and develop your authentic voice on social media, express genuine thoughts and perspectives, share real stories and vulnerability, and communicate in ways that feel true to yourself.',
              s.how_to_develop = 'Write personal essays for 8-12 weeks exploring your values and perspective. Share progressively more authentic stories. Get feedback on authenticity. Study creators known for authenticity. Reflect on where you\'re inauthentic. Expected time: 12-16 weeks.',
              s.novice_level = 'Voice feels generic or forced. Struggles with authenticity. Afraid of being real. To progress: Share more personal stories.',
              s.advanced_beginner_level = 'Voice is developing with some personality. Some authentic moments. Still guarded in places. To progress: Share deeper stories and perspectives.',
              s.competent_level = 'Voice is consistent and reasonably authentic. Willing to share some personal content. Followers feel they know you. To progress: Deepen vulnerability and honesty.',
              s.proficient_level = 'Voice is distinctly authentic and recognizable. Comfortable with appropriate vulnerability. Followers feel genuine connection. To progress: Become an authenticity exemplar.',
              s.expert_level = 'Voice is powerfully authentic and deeply engaging. Comfortable being fully yourself. Creates deep trust and connection through genuine communication.';

MERGE (s:Skill {name: 'Audience Insight Gathering'})
ON CREATE SET s.description = 'The ability to understand your audience through formal and informal research, including interviews, surveys, observation, analytics, and direct conversation to understand needs, interests, and preferences.',
              s.how_to_develop = 'Interview 20-30 audience members over 6-8 weeks. Create and distribute surveys. Closely read comments and DMs. Analyze analytics for behavior patterns. Join communities where your audience hangs out. Document insights. Expected time: 8-12 weeks.',
              s.novice_level = 'Assumes you know audience but doesn\'t research. Doesn\'t ask questions or gather real insights. To progress: Interview some audience members.',
              s.advanced_beginner_level = 'Does some audience research but inconsistently. Beginning to understand audience better. To progress: Create more formal research process.',
              s.competent_level = 'Regularly gathers audience insights through surveys and interviews. Understanding audience interests and needs. To progress: Develop deeper insight gathering.',
              s.proficient_level = 'Deep understanding of audience from multi-method research. Can anticipate audience needs and interests. Insights inform strategy. To progress: Develop audience personas and frameworks.',
              s.expert_level = 'Deep nuanced understanding of audience motivations and desires. Can predict what audience will respond to. Insights are sophisticated and actionable.';

// Expert Skills - Master Level

MERGE (s:Skill {name: 'Influence and Impact'})
ON CREATE SET s.description = 'The ability to build significant influence on social media, create content that shapes conversations and opinions, inspire action, and use your platform responsibly for positive impact.',
              s.how_to_develop = 'Build your platform and influence over 12-24+ months through consistent value delivery. Develop original perspectives and original insights. Shape discourse in your area of expertise. Guide discussions thoughtfully. Mentor and help others. Measure impact beyond metrics. Expected time: 24+ months.',
              s.novice_level = 'Minimal influence. Few people care what you think. Content has limited impact. To progress: Build trust and deliver consistent value.',
              s.advanced_beginner_level = 'Small but growing influence. Some people pay attention to your content. Limited impact beyond audience. To progress: Develop original perspectives.',
              s.competent_level = 'Moderate influence within your community. Content influences some decisions and opinions. To progress: Develop thought leadership.',
              s.proficient_level = 'Significant influence in your area. Content regularly influences audience. Some impact beyond immediate followers. To progress: Shape broader discourse.',
              s.expert_level = 'Major influence and impact. Content shapes conversations and moves people to action. Recognized authority. Positive impact beyond your direct audience.';

MERGE (s:Skill {name: 'Content Innovation'})
ON CREATE SET s.description = 'The ability to create original, novel content ideas, experiment with new formats, innovate within your space, and introduce fresh perspectives that audiences haven\'t seen before.',
              s.how_to_develop = 'Create 5-10 original content experiments monthly for 12-16 weeks. Study trends and innovate on them. Combine ideas from different domains. Give yourself permission to fail. Track what\'s novel. Share learnings. Expected time: 16+ weeks.',
              s.novice_level = 'Content is mostly copies of what others do. Struggles to create original ideas. To progress: Brainstorm more and consume broader inspiration.',
              s.advanced_beginner_level = 'Some original ideas but mostly follows established formats. To progress: Experiment more and take creative risks.',
              s.competent_level = 'Creates some original content ideas and formats. Willing to experiment. Some experiments work well. To progress: Innovate more systematically.',
              s.proficient_level = 'Regularly creates original content ideas and formats. Innovations often resonate. Seen as creative in your niche. To progress: Become innovation leader.',
              s.expert_level = 'Consistently creates breakthrough innovations. Sets trends others follow. Original ideas become formats others copy. Known for pushing boundaries.';

MERGE (s:Skill {name: 'Creator Mentorship'})
ON CREATE SET s.description = 'The ability to mentor, teach, and guide other creators in developing their skills, strategies, and platforms. Sharing knowledge and helping others succeed.',
              s.how_to_develop = 'Mentor 3-5 creators over 12-16 weeks. Document what you teach. Develop mentoring frameworks. Teach workshops or classes. Share your knowledge publicly. Help others celebrate wins. Expected time: 12+ weeks.',
              s.novice_level = 'Doesn\'t mentor. Hoards strategies or knowledge. To progress: Start helping others.',
              s.advanced_beginner_level = 'Helps friends but not systematically. Sharing some knowledge. To progress: Become more deliberate in mentoring.',
              s.competent_level = 'Mentors a few people and helps others grow. Knowledge sharing is regular. To progress: Develop mentoring methodology.',
              s.proficient_level = 'Mentoring multiple creators successfully. Helping others level up. Mentoring feels natural. To progress: Scale mentoring impact.',
              s.expert_level = 'Mentoring many creators with significant impact on their growth. Mentoring frameworks are sophisticated. Known for helping creators succeed.';

MERGE (s:Skill {name: 'Platform Evolution Adaptation'})
ON CREATE SET s.description = 'The ability to stay ahead of platform changes, quickly adapt strategies when platforms evolve, experiment with new features early, and anticipate future directions in social media landscape.',
              s.how_to_develop = 'Follow platform news closely for 12-24 months. Join beta programs for new features. Experiment with new features within 1 week of launch. Study other creators\' adaptations. Predict likely future changes. Build strategy flexibility. Expected time: Ongoing (12+ months).',
              s.novice_level = 'Caught off guard by platform changes. Slow to adapt. Strategy becomes ineffective quickly. To progress: Pay closer attention to platform updates.',
              s.advanced_beginner_level = 'Notices changes and eventually adapts. Learning platform trends. Strategy flexibility developing. To progress: Adapt faster and more intentionally.',
              s.competent_level = 'Adapts to platform changes deliberately. Tries new features. Stays reasonably current. To progress: Lead adaptation in your community.',
              s.proficient_level = 'Early adopter of new features. Quickly adapts strategy to changes. Often ahead of competition. To progress: Anticipate and predict changes.',
              s.expert_level = 'Consistently ahead of curve with platform evolution. Early adopter of breakthrough features. Strategy remains effective through major changes. Teaches others adaptation.';

MERGE (s:Skill {name: 'Ethical Impact Management'})
ON CREATE SET s.description = 'The ability to use your social media platform responsibly, understand ethical implications of your influence, avoid spreading misinformation, address harassment, consider consequences of content, and lead by example ethically.',
              s.how_to_develop = 'Study ethical frameworks for 4-6 weeks. Reflect on your impact. Address ethical issues you encounter. Get feedback on impact from diverse people. Research harmful cases. Document your ethical guidelines. Expected time: Ongoing (12+ months of reflection).',
              s.novice_level = 'Doesn\'t consider ethical implications. Shares without vetting. No responsibility awareness. To progress: Learn about ethical responsibilities.',
              s.advanced_beginner_level = 'Beginning to consider impact. Tries to verify information. Some responsibility awareness. To progress: Develop ethical framework.',
              s.competent_level = 'Generally thoughtful about impact. Vets information before sharing. Makes effort to be responsible. To progress: Deepen ethical practice.',
              s.proficient_level = 'Highly conscious of impact and responsibility. Deliberately avoids harmful content. Addresses ethical issues directly. To progress: Model ethical leadership.',
              s.expert_level = 'Exemplary ethical practice and impact awareness. Models responsible influence. Helps others understand their responsibility. Positive impact beyond content.';

// ============================================================
// Agent 2c: Trait Nodes
// ============================================================

// Traits that are fundamental to success in social media - representing inherent cognitive and personality characteristics

MERGE (t:Trait {name: 'Extraversion'})
ON CREATE SET t.description = 'Natural tendency to be outgoing, sociable, and comfortable engaging with others. In social media contexts, extraversion manifests as comfort with self-presentation, willingness to share publicly, and energy in online interactions.',
              t.measurement_criteria = 'Assessed through comfort level with public sharing and online social engagement. Low (0-25): Strongly prefers privacy, discomfort with public sharing, minimal desire for social engagement. Moderate (26-50): Comfortable in familiar social circles, some hesitation with public sharing. High (51-75): Naturally outgoing, comfortable sharing publicly, energized by social interaction. Exceptional (76-100): Highly social, thrives on public interaction, naturally transparent and engaging.';

MERGE (t:Trait {name: 'Openness to Experience'})
ON CREATE SET t.description = 'Willingness to explore new ideas, try novel formats, embrace change, and adapt to platform evolution. Critical for staying current with trends and experimenting with new content approaches.',
              t.measurement_criteria = 'Assessed through willingness to try new things and adapt to change. Low (0-25): Prefers established approaches, resists change, avoids experimentation. Moderate (26-50): Willing to try some new things, moderate flexibility. High (51-75): Enjoys trying new approaches, comfortable with change, regularly experiments. Exceptional (76-100): Constantly innovates, thrives on change, seeks out novel approaches.';

MERGE (t:Trait {name: 'Emotional Intelligence'})
ON CREATE SET t.description = 'Ability to recognize, understand, and manage emotions in yourself and others. Essential for authentic communication, reading audience sentiment, building genuine connections, and navigating community dynamics.',
              t.measurement_criteria = 'Assessed through emotional awareness and relationship-building capacity. Low (0-25): Limited awareness of emotions in self and others, struggles with interpersonal understanding. Moderate (26-50): Developing emotional awareness, moderate skill in reading others. High (51-75): Good emotional awareness and understanding of others\' feelings, effective at building connections. Exceptional (76-100): Highly attuned to emotional dynamics, naturally builds deep connections, reads subtle emotional cues accurately.';

MERGE (t:Trait {name: 'Resilience'})
ON CREATE SET t.description = 'Ability to recover from setbacks, handle criticism and negative feedback, and persist through challenges. Essential for dealing with platform algorithm changes, audience criticism, content that doesn\'t perform, and the emotional ups and downs of public creation.',
              t.measurement_criteria = 'Assessed through response to failure and criticism. Low (0-25): Devastated by failure, struggles to recover from setbacks, avoids criticism. Moderate (26-50): Can recover from setbacks with time, developing resilience. High (51-75): Bounces back quickly from failures, handles criticism constructively. Exceptional (76-100): Views setbacks as learning opportunities, energized by challenges, unaffected by criticism.';

MERGE (t:Trait {name: 'Creativity'})
ON CREATE SET t.description = 'Ability to generate novel ideas, make unexpected connections, see problems from different angles, and produce original content. Fundamental to standing out and creating engaging, unique content.',
              t.measurement_criteria = 'Assessed through originality of ideas and creative output. Low (0-25): Struggles to generate original ideas, relies heavily on copying others. Moderate (26-50): Can generate some original ideas, developing creative confidence. High (51-75): Regularly produces original ideas and content, naturally creative. Exceptional (76-100): Consistently produces breakthrough creative ideas, naturally innovative, sees unique angles others miss.';

MERGE (t:Trait {name: 'Conscientiousness'})
ON CREATE SET t.description = 'Tendency toward organization, planning, and follow-through. Important for maintaining consistent posting schedules, managing multiple platforms, organizing content calendars, and executing strategies systematically.',
              t.measurement_criteria = 'Assessed through organizational habits and consistency. Low (0-25): Disorganized, struggles with planning and follow-through, inconsistent. Moderate (26-50): Reasonably organized, follows through on some commitments. High (51-75): Well-organized, consistent in execution, good at planning. Exceptional (76-100): Highly organized, excellent follow-through, naturally systematic in approach.';

MERGE (t:Trait {name: 'Authenticity'})
ON CREATE SET t.description = 'Natural tendency toward genuineness, consistency between internal beliefs and external expression, and honesty in communication. Critical for building trust and creating content that resonates authentically.',
              t.measurement_criteria = 'Assessed through consistency between values and public presentation. Low (0-25): Struggles with authenticity, puts on personas, values don\'t align with public presentation. Moderate (26-50): Generally genuine but masks in some situations, developing authenticity. High (51-75): Naturally authentic, consistent between private and public self. Exceptional (76-100): Profoundly authentic, no mask required, complete alignment between values and expression.';

MERGE (t:Trait {name: 'Empathy'})
ON CREATE SET t.description = 'Ability to understand and share the feelings of others, perceive audience needs and pain points, and create content that genuinely resonates with people\'s experiences and emotions.',
              t.measurement_criteria = 'Assessed through ability to understand others\' perspectives and emotional states. Low (0-25): Difficulty understanding others\' feelings, self-focused perspective. Moderate (26-50): Can understand some others\' perspectives, developing empathy. High (51-75): Good understanding of others\' feelings and needs, naturally empathetic. Exceptional (76-100): Deeply understands others\' experiences, naturally compassionate, sees perspective from others\' viewpoint easily.';

MERGE (t:Trait {name: 'Focus and Concentration'})
ON CREATE SET t.description = 'Ability to maintain attention on tasks, concentrate despite distractions, and sustain focus through content creation and strategic planning sessions.',
              t.measurement_criteria = 'Assessed through ability to concentrate and maintain attention. Low (0-25): Easily distracted, difficulty maintaining focus on single task. Moderate (26-50): Can focus with effort, occasional distractions. High (51-75): Good concentration, can focus on tasks, minor distractions managed. Exceptional (76-100): Deep focus capacity, rarely distracted, can sustain attention on complex tasks.';

MERGE (t:Trait {name: 'Confidence'})
ON CREATE SET t.description = 'Self-assurance and belief in own abilities. Essential for public sharing, handling criticism, trying new things, and building presence when facing algorithm challenges or low engagement.',
              t.measurement_criteria = 'Assessed through belief in own capabilities and response to challenges. Low (0-25): Significant self-doubt, lacks confidence in own abilities. Moderate (26-50): Developing confidence, some self-doubt. High (51-75): Generally confident in abilities, handles challenges with assurance. Exceptional (76-100): Exceptionally self-assured, believes in own vision, unshaken by doubts.';

MERGE (t:Trait {name: 'Adaptability'})
ON CREATE SET t.description = 'Flexibility in thinking and approach, ability to adjust strategies when situations change, and comfort with pivoting when something isn\'t working.',
              t.measurement_criteria = 'Assessed through flexibility and willingness to adjust approach. Low (0-25): Rigid thinking, resistant to change, struggles to adapt. Moderate (26-50): Can adapt with effort, developing flexibility. High (51-75): Flexible thinker, readily adjusts approach when needed. Exceptional (76-100): Naturally flexible, quickly adapts to any situation, pivots seamlessly.';

MERGE (t:Trait {name: 'Attention to Detail'})
ON CREATE SET t.description = 'Ability to notice small elements, maintain consistency in formatting and branding, catch errors, and refine content quality through careful review.',
              t.measurement_criteria = 'Assessed through precision and attention to quality details. Low (0-25): Misses errors and inconsistencies, doesn\'t notice details. Moderate (26-50): Notices some details with effort, occasional misses. High (51-75): Good attention to detail, catches most errors and inconsistencies. Exceptional (76-100): Exceptional precision, catches all errors, naturally detail-oriented, polishes everything.';

// ============================================================
// Agent 2d: Milestone Nodes
// ============================================================

// Novice Level Milestones - Accessible, motivating first achievements

MERGE (m:Milestone {name: 'Create First Social Media Account'})
ON CREATE SET m.description = 'Successfully set up your first social media account with a complete profile, profile picture, and basic bio. This foundational milestone marks entry into the world of social media and demonstrates basic platform competency.',
              m.how_to_achieve = 'Choose a platform that matches your interests (Instagram for visual content, Twitter for conversations, LinkedIn for professional). Create an account with a strong password and unique email. Upload a profile picture and write a compelling bio (2-3 sentences about who you are or what you share). Add a link to your website or other platforms if applicable. Most people achieve this in 1-2 hours.';

MERGE (m:Milestone {name: 'Post Your First Content'})
ON CREATE SET m.description = 'Publish your very first post on social media in any format (text, image, or video). This milestone marks your entry as a content creator and demonstrates willingness to share publicly.',
              m.how_to_achieve = 'Choose something you\'re comfortable sharing. Write a simple caption (1-3 sentences), select an image if posting visually, or record a short video. Don\'t overthink it. Click publish. Take a screenshot to celebrate. Most people achieve this within 1-2 days of creating an account.';

MERGE (m:Milestone {name: 'Reach 10 Followers'})
ON CREATE SET m.description = 'Accumulate your first 10 followers on a social media platform. This milestone represents initial validation that others are interested in your content.',
              m.how_to_achieve = 'Post consistently (3-5 posts per week) for 2-4 weeks. Engage genuinely with other creators\' content by liking and commenting meaningfully. Follow accounts in your niche. Share your profile with friends and family. Don\'t worry about quality - focus on showing up regularly. Most people achieve this in 2-4 weeks of consistent activity.';

MERGE (m:Milestone {name: 'Leave Your First Meaningful Comment'})
ON CREATE SET m.description = 'Write a thoughtful, substantive comment on another creator\'s post that adds value, asks a genuine question, or shows real engagement. This milestone marks your transition from passive consumer to active community participant.',
              m.how_to_achieve = 'Find a post from a creator you follow that genuinely interests you. Read it carefully. Write a comment (3-5 sentences) that shows you understood the post and adds something valuable - ask a thoughtful question, share a relevant insight, or relate a personal experience. Be genuine. Avoid generic comments. Expected time: 1-2 weeks of engagement.';

MERGE (m:Milestone {name: 'Master Basic Platform Navigation'})
ON CREATE SET m.description = 'Develop confident ability to navigate your chosen platform efficiently, finding all major features and understanding how different functions work. This milestone shows you\'ve moved beyond confusion to comfort with the platform.',
              m.how_to_achieve = 'Spend 1-2 weeks actively using your platform daily. Practice posting, commenting, messaging, following, searching, and exploring your profile settings. Watch tutorial videos for the platform. Navigate to every major section and understand what each does. Test basic features to understand how they work. Most people achieve this with 10-15 hours of intentional practice.';

// Developing Level Milestones - Building consistency and skill

MERGE (m:Milestone {name: 'Post Consistently for One Month'})
ON CREATE SET m.description = 'Maintain a regular posting schedule (at least 3 posts per week) for a full month. This milestone demonstrates commitment and the beginning of sustainable content habits.',
              m.how_to_achieve = 'Create a simple content calendar with 12-16 post ideas. Commit to posting 3-5 times per week at consistent times. Set phone reminders if needed. Don\'t worry about perfection - focus on showing up regularly. Track your posting streak. By the end of month one, you\'ll have 12-20 pieces of content published. Expected time: 4 weeks.';

MERGE (m:Milestone {name: 'Reach 50 Followers'})
ON CREATE SET m.description = 'Grow your following to 50 people who are interested in your content. This milestone represents sustained growth and initial audience validation.',
              m.how_to_achieve = 'Maintain consistent posting and engagement for 2-3 months. Focus on quality over quantity as followers grow. Engage genuinely with your audience and other creators. Study which posts get the most engagement and create more of that type. Share authentically. Use relevant hashtags. Most people achieve this in 2-3 months of consistent, engaged activity.';

MERGE (m:Milestone {name: 'Receive Your First Engagement (Like or Comment)'})
ON CREATE SET m.description = 'Receive your first like or meaningful comment from someone outside your close circle. This milestone marks the moment when strangers begin to engage with your content.',
              m.how_to_achieve = 'Post content regularly (3-5 times per week) for 2-4 weeks. Focus on posts about your genuine interests and perspectives. Engage with other creators\' content actively. Use relevant hashtags and appropriate tagging. When engagement comes, celebrate it - it\'s validation that your voice matters. Most people achieve this in 2-4 weeks.';

MERGE (m:Milestone {name: 'Develop Recognizable Posting Style'})
ON CREATE SET m.description = 'Create a recognizable, consistent style across your posts (visual aesthetics, tone of voice, content themes, or caption style). This milestone shows you\'ve begun developing a personal brand presence.',
              m.how_to_achieve = 'Post 20-30 times over 4-6 weeks while being intentionally yourself. Notice patterns in what content feels most natural to you. Start using consistent filters, fonts, or visual elements. Develop a consistent caption voice (funny, inspirational, educational, conversational, etc.). Your followers should be able to recognize your posts in their feeds. Expected time: 4-8 weeks of intentional posting.';

MERGE (m:Milestone {name: 'Complete Your First Content Batch'})
ON CREATE SET m.description = 'Create multiple pieces of content in one session and schedule them for posting over several days. This milestone demonstrates understanding of batching efficiency and moving beyond daily scrambling.',
              m.how_to_achieve = 'Set aside 2-3 hours for a content creation session. Create 5-7 posts worth of captions, images, or videos. Use a scheduling tool (Buffer, Later, native scheduler) to schedule them for posting across the next week. During the next week, focus only on engagement while posts go out automatically. Most people achieve this in their second or third month of active social media presence.';

// Competent Level Milestones - Building audience and mastery

MERGE (m:Milestone {name: 'Reach 100 Followers'})
ON CREATE SET m.description = 'Build your follower count to 100 people interested in your content. This milestone represents meaningful audience traction and validates your content approach.',
              m.how_to_achieve = 'Maintain consistent posting (4-5 times per week) and active engagement for 3-4 months. Continue to improve your content quality and consistency. Engage authentically with your community. Study your analytics and double down on what works. Build genuine relationships. Most people achieve this in 3-6 months of consistent, engaged effort.';

MERGE (m:Milestone {name: 'Get Positive Feedback on Your Authenticity'})
ON CREATE SET m.description = 'Receive explicit feedback from followers expressing that they appreciate your authentic voice, genuine personality, or real stories. This milestone validates that your vulnerability and realness resonate with people.',
              m.how_to_achieve = 'Share increasingly personal and authentic content over 2-3 months. Be willing to be vulnerable appropriately. Share real struggles and real wins. Respond when followers comment on authentic posts. Look for comments like "I love your authenticity" or "Thank you for being real." Ask followers in stories what they appreciate about your content. Most people achieve this in 3-6 months of authentic posting.';

MERGE (m:Milestone {name: 'Create Your First Video Content'})
ON CREATE SET m.description = 'Create and post your first video content in any format (selfie video, produced video, live stream, reel, or story video). This milestone marks expansion beyond static content.',
              m.how_to_achieve = 'Start simple - record yourself talking about something you\'re passionate about on your phone. Keep it under 60 seconds for first attempt. Post it without heavy editing. Overcome the discomfort of being on camera. Most videos don\'t go viral and that\'s fine. The point is to expand your format repertoire. Expected time: 1-2 weeks to overcome the hesitation and post.';

MERGE (m:Milestone {name: 'Use Advanced Platform Features'})
ON CREATE SET m.description = 'Successfully use advanced features beyond basic posting, such as stories, reels, live streams, polls, carousels, or pinned posts. This milestone shows you\'ve mastered platform mechanics.',
              m.how_to_achieve = 'Research 3-5 advanced features on your platform. Experiment with each one once to understand how they work. Try stories for 1 week to get comfortable. Try reels or live video next. Use polls or interactive features in stories. Don\'t worry about perfection - focus on understanding what each feature does. Most people achieve this in 2-3 months as they explore.';

MERGE (m:Milestone {name: 'Achieve Your First Viral Moment (1000+ Views or Unexpected Engagement Spike)'})
ON CREATE SET m.description = 'Experience a piece of content that significantly outperforms your typical engagement, reaching at least 1000 views or receiving dramatically higher engagement than usual. This milestone validates that you\'ve created something that resonates widely.',
              m.how_to_achieve = 'This often happens unexpectedly when you least expect it. Continue creating authentic, valuable content consistently for 4-6 months. Be observant about what types of content resonate. When something does go viral, analyze what made it work. The point isn\'t to chase virality - it\'s to experience that moment when your content connects widely. Expected time: 3-6 months of consistent posting before this typically occurs naturally.';

MERGE (m:Milestone {name: 'Build Active Engagement Community'})
ON CREATE SET m.description = 'Develop a group of 10-20 regular followers who consistently engage with your content (liking, commenting meaningfully, responding to your stories). This milestone represents transition from passive audience to active community.',
              m.how_to_achieve = 'Engage genuinely with others\' content for 4-6 weeks. Respond to all comments on your posts. Host engagement-focused content (asking questions, creating discussion prompts). Celebrate your regular commenters. Host lives or Q&A sessions. Create opportunities for followers to connect with each other. Most people achieve this naturally by 4-6 months with consistent engagement focus.';

// Advanced Level Milestones - Significant reach and influence

MERGE (m:Milestone {name: 'Reach 500 Followers'})
ON CREATE SET m.description = 'Build a following of 500 people, representing substantial audience traction and clear demonstration of value your content provides. This milestone marks entry into meaningful influence.',
              m.how_to_achieve = 'Maintain consistent posting (4-5 times per week) for 6-9 months. Focus on quality and authenticity over chasing follower count. Create content that solves problems or provides genuine value. Engage deeply with your community. Build strategic partnerships through collaboration. Most people reach 500 followers in 6-12 months of focused, authentic effort.';

MERGE (m:Milestone {name: 'Get Mentioned or Reposted by Another Creator'})
ON CREATE SET m.description = 'Have another creator publicly share, repost, or mention your content or account to their audience. This milestone validates your content value through third-party endorsement.',
              m.how_to_achieve = 'Create exceptional content that deserves sharing. Build genuine relationships with other creators in your niche. Engage meaningfully with their content first. When you\'ve built trust, create content that serves their audience too. Collaborations happen more easily when there\'s genuine mutual respect. Most people experience this by month 6-12 of consistent presence.';

MERGE (m:Milestone {name: 'Establish Personal Brand Recognition'})
ON CREATE SET m.description = 'Develop a distinctive personal brand that is recognizable to your followers - they can identify your posts in feeds, associate specific aesthetics or voice with you, and understand what you stand for.',
              m.how_to_achieve = 'Over 6-12 months, intentionally develop consistent visual aesthetics (colors, filters, image styles), voice (tone and vocabulary), content themes, and values expression. Show up consistently. Be visibly you. Let your unique perspective shine through. By month 6-12, new followers should be able to spot your content immediately. Expected time: 6-12 months of intentional brand consistency.';

MERGE (m:Milestone {name: 'Create Content That Sparks Meaningful Conversation'})
ON CREATE SET m.description = 'Create posts that generate substantive discussion and meaningful comments (beyond emoji reactions), where followers engage with your content and each other on substantive topics.',
              m.how_to_achieve = 'Focus on asking thought-provoking questions or sharing vulnerable stories that invite reflection. Post about topics you have genuine passion and perspective about. Engage actively in your own comment section to model meaningful conversation. Don\'t just react passively - ask follow-up questions, encourage deeper discussion. Most creators achieve this consistently by month 6-9.';

MERGE (m:Milestone {name: 'Master Cross-Platform Presence'})
ON CREATE SET m.description = 'Actively maintain presence on 3+ platforms with adapted content strategies for each, managing your time efficiently while maintaining authenticity and consistency across platforms.',
              m.how_to_achieve = 'After mastering your primary platform (4-6 months), choose 1-2 additional platforms. For 2-3 months, focus on understanding each platform\'s unique culture and best practices. Adapt your core message for each platform while maintaining your brand consistency. Use scheduling tools to manage posting. Track which platforms drive the most value. Most people achieve this by month 9-12.';

MERGE (m:Milestone {name: 'Attract Collaborator or Partnership Opportunity'})
ON CREATE SET m.description = 'Have another creator or brand approach you about collaboration or partnership opportunities. This milestone validates that you\'ve reached a level of influence where others want to partner with you.',
              m.how_to_achieve = 'Build a strong, consistent presence for 6-12 months. Create content that serves others and demonstrates value. Be visible and engaged in your community. Build relationships genuinely. As your influence grows, opportunities will come. When approached, be selective and only collaborate with brands or creators aligned with your values. Most people receive first partnership approaches by month 9-15.';

// Master Level Milestones - Significant influence and impact

MERGE (m:Milestone {name: 'Reach 1000 Followers (Entry to Influencer Territory)'})
ON CREATE SET m.description = 'Build a following of 1000+ people, formally entering the territory where you\'re considered to have meaningful influence. This milestone represents real reach and impact potential.',
              m.how_to_achieve = 'Maintain focused effort for 12-18 months consistently. Create valuable, authentic content. Build genuine community through engagement. Stay true to your niche and perspective. Don\'t chase growth - focus on attracting people who genuinely value what you share. Most dedicated creators reach 1000 followers in 12-20 months.';

MERGE (m:Milestone {name: 'Shape Conversations in Your Niche'})
ON CREATE SET m.description = 'Demonstrate thought leadership by creating content that influences how people in your niche think about topics, contribute original perspectives to important discussions, and have others cite or build on your ideas.',
              m.how_to_achieve = 'Over 12-18 months, develop deep expertise and original perspective in your chosen domain. Create content that offers fresh insights others haven\'t articulated. Engage in meaningful discourse. Help advance thinking in your field. Track when others reference your ideas or quote you. Most thought leaders in a niche are achieved by 18-24 months in that space.';

MERGE (m:Milestone {name: 'Mentor Other Creators'})
ON CREATE SET m.description = 'Actively help 3-5 emerging creators develop their platforms and skills. This milestone demonstrates you\'ve achieved enough success to meaningfully guide others.',
              m.how_to_achieve = 'After 12+ months of success, identify creators you admire who are earlier in their journeys. Offer genuine mentorship through DMs, calls, or group coaching. Share your learnings freely. Help them avoid mistakes you made. Celebrate their wins. This can be done informally with friends or more formally through coaching. Most established creators naturally begin mentoring by month 12-15.';

MERGE (m:Milestone {name: 'Build Engaged Community Around Shared Values'})
ON CREATE SET m.description = 'Create a community where followers don\'t just follow you - they feel part of a movement, share common values, and connect with each other around those shared beliefs.',
              m.how_to_achieve = 'Over 12-24 months, be crystal clear about your values and beliefs. Create community rituals (recurring content themes, discussions, events). Facilitate connections between your followers. Create safe spaces for substantive conversation. Use your platform to emphasize common ground. Most creators build true value-aligned communities by month 18-24.';

MERGE (m:Milestone {name: 'Achieve Organic Media Coverage or Press Mention'})
ON CREATE SET m.description = 'Have media outlets, journalists, or significant publications mention or feature you based on the influence and value of your content and community.',
              m.how_to_achieve = 'Build substantial influence and expertise in your area (18+ months). Create content that is so valuable, unique, or culturally relevant that media outlets want to cover it. Build relationships with journalists in your space. Be quotable and accessible. This typically happens for creators who have built real influence and are doing genuinely interesting work. Expected time: 18-24+ months of significant effort.';

MERGE (m:Milestone {name: 'Launch Monetization or Revenue Stream from Your Platform'})
ON CREATE SET m.description = 'Successfully generate revenue through your social media presence through sponsorships, affiliate programs, digital products, services, or platform monetization features.',
              m.how_to_achieve = 'Build to 1000+ followers and consistent engagement first (12-18 months minimum). Ensure your content creates enough value that brands want to work with you or audiences will pay for what you offer. Apply for monetization programs (YouTube Partner, TikTok Creator Fund, etc.) or reach out to relevant brands. Develop digital products or services. Most creators begin monetization after 18-24 months of growth.';

MERGE (m:Milestone {name: 'Achieve Thought Leader Status in Your Domain'})
ON CREATE SET m.description = 'Become recognized as an authority and trusted expert in your specific domain. Other creators cite you, media features you as expert, and people specifically seek you out for insights.',
              m.how_to_achieve = 'Over 18-36 months, develop unquestionable expertise through creating exceptional content consistently. Share original research and insights. Contribute to important conversations. Build a body of work that demonstrates deep knowledge. Network with other thought leaders. By 24-36 months of focused effort, you\'ll be recognized authority. Most domain thought leaders invest 24+ months.';

MERGE (m:Milestone {name: 'Create Positive Social Impact Through Your Platform'})
ON CREATE SET m.description = 'Use your platform to create measurable positive change - raising awareness for causes, inspiring action, directing resources to those in need, or catalyzing community change.',
              m.how_to_achieve = 'After establishing influence (18+ months), identify impact you want to create. Use your platform intentionally to amplify causes you care about. Create campaigns that inspire action. Measure impact. Build community around positive change. Partner with nonprofits or causes. Track donations raised or people inspired to act. Most impactful creators make impact a deliberate focus by month 18-24.';

MERGE (m:Milestone {name: 'Sustain 2000+ Followers with High Engagement Rates'})
ON CREATE SET m.description = 'Build and maintain a following of 2000+ people who remain highly engaged, demonstrating that you\'ve created lasting value and deep community bonds rather than fleeting attention.',
              m.how_to_achieve = 'Maintain consistency for 18-24+ months. Focus on engagement rate quality over raw follower count. Continue creating authentic, valuable content. Build genuine relationships with your community. Stay true to your brand. Avoid selling out or losing authenticity for growth. Track that your engagement rates remain high (3-5%+) even as followers grow. Expected time: 18-30 months of sustained excellence.';

MERGE (m:Milestone {name: 'Successfully Adapt to Major Platform Change'})
ON CREATE SET m.description = 'When a social media platform makes significant changes (algorithm changes, new features, format shifts), demonstrate ability to successfully adapt and maintain or grow your reach through the transition.',
              m.how_to_achieve = 'This happens naturally over time as platforms evolve. When major changes come, don\'t panic - study them, understand them, and adapt your strategy. Experiment with new features quickly. Stay flexible. By your second or third major platform shift (typically 18-24 months in), you\'ll have learned to adapt. Most successful long-term creators have adapted through at least 2-3 significant platform changes.';

// ============================================================
// Agent 3: Relationships
// ============================================================

// ============================================================
// Level Assignments - Domain Level Requirements
// ============================================================

// Social Media Novice (Level 1) - Foundation
MATCH (level1:Domain_Level {level: 1, name: 'Social Media Novice'})
MATCH (k:Knowledge {name: 'Social Media Platform Fundamentals'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Social Media Novice'})
MATCH (k:Knowledge {name: 'Content Format Basics'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Social Media Novice'})
MATCH (k:Knowledge {name: 'Social Media Terminology'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Social Media Novice'})
MATCH (k:Knowledge {name: 'Basic Community Norms'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Social Media Novice'})
MATCH (k:Knowledge {name: 'Basic Account Setup and Security'})
CREATE (level1)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level1:Domain_Level {level: 1, name: 'Social Media Novice'})
MATCH (s:Skill {name: 'Platform Navigation'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Social Media Novice'})
MATCH (s:Skill {name: 'Basic Content Writing'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Social Media Novice'})
MATCH (s:Skill {name: 'Profile Setup and Optimization'})
CREATE (level1)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level1:Domain_Level {level: 1, name: 'Social Media Novice'})
MATCH (t:Trait {name: 'Extraversion'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 25}]->(t);

MATCH (level1:Domain_Level {level: 1, name: 'Social Media Novice'})
MATCH (t:Trait {name: 'Confidence'})
CREATE (level1)-[:REQUIRES_TRAIT {min_score: 30}]->(t);

MATCH (level1:Domain_Level {level: 1, name: 'Social Media Novice'})
MATCH (m:Milestone {name: 'Create First Social Media Account'})
CREATE (level1)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level1:Domain_Level {level: 1, name: 'Social Media Novice'})
MATCH (m:Milestone {name: 'Post Your First Content'})
CREATE (level1)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

// Social Media Developing (Level 2) - Consistency Building
MATCH (level2:Domain_Level {level: 2, name: 'Social Media Developing'})
MATCH (k:Knowledge {name: 'Social Media Platform Fundamentals'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Social Media Developing'})
MATCH (k:Knowledge {name: 'Content Format Basics'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Social Media Developing'})
MATCH (k:Knowledge {name: 'Social Media Terminology'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Social Media Developing'})
MATCH (k:Knowledge {name: 'Basic Community Norms'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Social Media Developing'})
MATCH (k:Knowledge {name: 'Authentic Communication'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Social Media Developing'})
MATCH (k:Knowledge {name: 'Audience Identification and Understanding'})
CREATE (level2)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Remember'}]->(k);

MATCH (level2:Domain_Level {level: 2, name: 'Social Media Developing'})
MATCH (s:Skill {name: 'Platform Navigation'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Social Media Developing'})
MATCH (s:Skill {name: 'Basic Content Writing'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Social Media Developing'})
MATCH (s:Skill {name: 'Image Selection and Posting'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Social Media Developing'})
MATCH (s:Skill {name: 'Comment Etiquette'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Social Media Developing'})
MATCH (s:Skill {name: 'Content Batching and Scheduling'})
CREATE (level2)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level2:Domain_Level {level: 2, name: 'Social Media Developing'})
MATCH (t:Trait {name: 'Conscientiousness'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 40}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Social Media Developing'})
MATCH (t:Trait {name: 'Authenticity'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 35}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Social Media Developing'})
MATCH (t:Trait {name: 'Resilience'})
CREATE (level2)-[:REQUIRES_TRAIT {min_score: 30}]->(t);

MATCH (level2:Domain_Level {level: 2, name: 'Social Media Developing'})
MATCH (m:Milestone {name: 'Post Consistently for One Month'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level2:Domain_Level {level: 2, name: 'Social Media Developing'})
MATCH (m:Milestone {name: 'Reach 50 Followers'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level2:Domain_Level {level: 2, name: 'Social Media Developing'})
MATCH (m:Milestone {name: 'Develop Recognizable Posting Style'})
CREATE (level2)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

// Social Media Competent (Level 3) - Skilled Creator
MATCH (level3:Domain_Level {level: 3, name: 'Social Media Competent'})
MATCH (k:Knowledge {name: 'Social Media Platform Fundamentals'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Social Media Competent'})
MATCH (k:Knowledge {name: 'Content Format Basics'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Social Media Competent'})
MATCH (k:Knowledge {name: 'Authentic Communication'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Social Media Competent'})
MATCH (k:Knowledge {name: 'Visual Composition Principles'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Social Media Competent'})
MATCH (k:Knowledge {name: 'Audience Identification and Understanding'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Social Media Competent'})
MATCH (k:Knowledge {name: 'Hashtag Strategy'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Social Media Competent'})
MATCH (k:Knowledge {name: 'Engagement Mechanics'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Social Media Competent'})
MATCH (k:Knowledge {name: 'Algorithm Basics'})
CREATE (level3)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level3:Domain_Level {level: 3, name: 'Social Media Competent'})
MATCH (s:Skill {name: 'Platform Navigation'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Social Media Competent'})
MATCH (s:Skill {name: 'Basic Content Writing'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Social Media Competent'})
MATCH (s:Skill {name: 'Image Selection and Posting'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Social Media Competent'})
MATCH (s:Skill {name: 'Engagement Response'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Social Media Competent'})
MATCH (s:Skill {name: 'Storytelling Through Posts'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Social Media Competent'})
MATCH (s:Skill {name: 'Content Batching and Scheduling'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Social Media Competent'})
MATCH (s:Skill {name: 'Analytics Interpretation'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Advanced Beginner'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Social Media Competent'})
MATCH (s:Skill {name: 'Video Content Creation'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Novice'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Social Media Competent'})
MATCH (s:Skill {name: 'Hashtag Research and Usage'})
CREATE (level3)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level3:Domain_Level {level: 3, name: 'Social Media Competent'})
MATCH (t:Trait {name: 'Authenticity'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 55}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Social Media Competent'})
MATCH (t:Trait {name: 'Empathy'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 45}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Social Media Competent'})
MATCH (t:Trait {name: 'Conscientiousness'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 55}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Social Media Competent'})
MATCH (t:Trait {name: 'Emotional Intelligence'})
CREATE (level3)-[:REQUIRES_TRAIT {min_score: 45}]->(t);

MATCH (level3:Domain_Level {level: 3, name: 'Social Media Competent'})
MATCH (m:Milestone {name: 'Reach 100 Followers'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'Social Media Competent'})
MATCH (m:Milestone {name: 'Create Your First Video Content'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level3:Domain_Level {level: 3, name: 'Social Media Competent'})
MATCH (m:Milestone {name: 'Build Active Engagement Community'})
CREATE (level3)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

// Social Media Advanced (Level 4) - Influential Creator
MATCH (level4:Domain_Level {level: 4, name: 'Social Media Advanced'})
MATCH (k:Knowledge {name: 'Content Strategy and Planning'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Social Media Advanced'})
MATCH (k:Knowledge {name: 'Personal Brand Development'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Social Media Advanced'})
MATCH (k:Knowledge {name: 'Advanced Analytics Interpretation'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Social Media Advanced'})
MATCH (k:Knowledge {name: 'Trend Awareness and Adoption'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Social Media Advanced'})
MATCH (k:Knowledge {name: 'Community Building'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Social Media Advanced'})
MATCH (k:Knowledge {name: 'Cross-Platform Presence Management'})
CREATE (level4)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Understand'}]->(k);

MATCH (level4:Domain_Level {level: 4, name: 'Social Media Advanced'})
MATCH (s:Skill {name: 'Personal Brand Development'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Social Media Advanced'})
MATCH (s:Skill {name: 'Audience Community Building'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Social Media Advanced'})
MATCH (s:Skill {name: 'Cross-Platform Content Adaptation'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Social Media Advanced'})
MATCH (s:Skill {name: 'Performance Optimization'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Social Media Advanced'})
MATCH (s:Skill {name: 'Authentic Voice Development'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Social Media Advanced'})
MATCH (s:Skill {name: 'Trend Participation'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Social Media Advanced'})
MATCH (s:Skill {name: 'Video Content Creation'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Social Media Advanced'})
MATCH (s:Skill {name: 'Audience Insight Gathering'})
CREATE (level4)-[:REQUIRES_SKILL {dreyfus_level: 'Competent'}]->(s);

MATCH (level4:Domain_Level {level: 4, name: 'Social Media Advanced'})
MATCH (t:Trait {name: 'Creativity'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 60}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Social Media Advanced'})
MATCH (t:Trait {name: 'Openness to Experience'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 60}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Social Media Advanced'})
MATCH (t:Trait {name: 'Resilience'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 55}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Social Media Advanced'})
MATCH (t:Trait {name: 'Confidence'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 60}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Social Media Advanced'})
MATCH (t:Trait {name: 'Adaptability'})
CREATE (level4)-[:REQUIRES_TRAIT {min_score: 55}]->(t);

MATCH (level4:Domain_Level {level: 4, name: 'Social Media Advanced'})
MATCH (m:Milestone {name: 'Reach 500 Followers'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'Social Media Advanced'})
MATCH (m:Milestone {name: 'Establish Personal Brand Recognition'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level4:Domain_Level {level: 4, name: 'Social Media Advanced'})
MATCH (m:Milestone {name: 'Master Cross-Platform Presence'})
CREATE (level4)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

// Social Media Master (Level 5) - Thought Leader
MATCH (level5:Domain_Level {level: 5, name: 'Social Media Master'})
MATCH (k:Knowledge {name: 'Influence and Thought Leadership'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Social Media Master'})
MATCH (k:Knowledge {name: 'Viral Content Mechanics'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Social Media Master'})
MATCH (k:Knowledge {name: 'Platform Evolution and Innovation'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Analyze'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Social Media Master'})
MATCH (k:Knowledge {name: 'Social Impact and Responsibility'})
CREATE (level5)-[:REQUIRES_KNOWLEDGE {bloom_level: 'Apply'}]->(k);

MATCH (level5:Domain_Level {level: 5, name: 'Social Media Master'})
MATCH (s:Skill {name: 'Influence and Impact'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Social Media Master'})
MATCH (s:Skill {name: 'Content Innovation'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Social Media Master'})
MATCH (s:Skill {name: 'Creator Mentorship'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Social Media Master'})
MATCH (s:Skill {name: 'Platform Evolution Adaptation'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Expert'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Social Media Master'})
MATCH (s:Skill {name: 'Ethical Impact Management'})
CREATE (level5)-[:REQUIRES_SKILL {dreyfus_level: 'Proficient'}]->(s);

MATCH (level5:Domain_Level {level: 5, name: 'Social Media Master'})
MATCH (t:Trait {name: 'Creativity'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 75}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Social Media Master'})
MATCH (t:Trait {name: 'Openness to Experience'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 75}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Social Media Master'})
MATCH (t:Trait {name: 'Emotional Intelligence'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 70}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Social Media Master'})
MATCH (t:Trait {name: 'Authenticity'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 80}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Social Media Master'})
MATCH (t:Trait {name: 'Resilience'})
CREATE (level5)-[:REQUIRES_TRAIT {min_score: 70}]->(t);

MATCH (level5:Domain_Level {level: 5, name: 'Social Media Master'})
MATCH (m:Milestone {name: 'Reach 1000 Followers (Entry to Influencer Territory)'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Social Media Master'})
MATCH (m:Milestone {name: 'Shape Conversations in Your Niche'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

MATCH (level5:Domain_Level {level: 5, name: 'Social Media Master'})
MATCH (m:Milestone {name: 'Achieve Thought Leader Status in Your Domain'})
CREATE (level5)-[:REQUIRES_MILESTONE {any_of: false}]->(m);

// ============================================================
// Knowledge Prerequisite Relationships
// ============================================================

// Foundation knowledge prerequisites
MATCH (k1:Knowledge {name: 'Authentic Communication'})
MATCH (k2:Knowledge {name: 'Social Media Platform Fundamentals'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Audience Identification and Understanding'})
MATCH (k2:Knowledge {name: 'Social Media Platform Fundamentals'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Visual Composition Principles'})
MATCH (k2:Knowledge {name: 'Content Format Basics'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Hashtag Strategy'})
MATCH (k2:Knowledge {name: 'Social Media Terminology'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Engagement Mechanics'})
MATCH (k2:Knowledge {name: 'Social Media Terminology'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Algorithm Basics'})
MATCH (k2:Knowledge {name: 'Engagement Mechanics'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

// Advanced knowledge prerequisites
MATCH (k1:Knowledge {name: 'Content Strategy and Planning'})
MATCH (k2:Knowledge {name: 'Audience Identification and Understanding'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Content Strategy and Planning'})
MATCH (k2:Knowledge {name: 'Algorithm Basics'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Personal Brand Development'})
MATCH (k2:Knowledge {name: 'Authentic Communication'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Personal Brand Development'})
MATCH (k2:Knowledge {name: 'Audience Identification and Understanding'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Advanced Analytics Interpretation'})
MATCH (k2:Knowledge {name: 'Engagement Mechanics'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Community Building'})
MATCH (k2:Knowledge {name: 'Basic Community Norms'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Community Building'})
MATCH (k2:Knowledge {name: 'Authentic Communication'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Cross-Platform Presence Management'})
MATCH (k2:Knowledge {name: 'Social Media Platform Fundamentals'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

// Expert knowledge prerequisites
MATCH (k1:Knowledge {name: 'Influence and Thought Leadership'})
MATCH (k2:Knowledge {name: 'Content Strategy and Planning'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Influence and Thought Leadership'})
MATCH (k2:Knowledge {name: 'Community Building'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Viral Content Mechanics'})
MATCH (k2:Knowledge {name: 'Engagement Mechanics'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k2);

MATCH (k1:Knowledge {name: 'Viral Content Mechanics'})
MATCH (k2:Knowledge {name: 'Advanced Analytics Interpretation'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Platform Evolution and Innovation'})
MATCH (k2:Knowledge {name: 'Algorithm Basics'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

MATCH (k1:Knowledge {name: 'Social Impact and Responsibility'})
MATCH (k2:Knowledge {name: 'Influence and Thought Leadership'})
CREATE (k1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k2);

// ============================================================
// Skill Prerequisite Relationships
// ============================================================

// Foundation skill prerequisites
MATCH (s1:Skill {name: 'Image Selection and Posting'})
MATCH (s2:Skill {name: 'Platform Navigation'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s2);

MATCH (s1:Skill {name: 'Comment Etiquette'})
MATCH (s2:Skill {name: 'Basic Content Writing'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s2);

MATCH (s1:Skill {name: 'Comment Etiquette'})
MATCH (k:Knowledge {name: 'Basic Community Norms'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s1:Skill {name: 'Hashtag Research and Usage'})
MATCH (k:Knowledge {name: 'Social Media Terminology'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Remember'}]->(k);

MATCH (s1:Skill {name: 'Content Batching and Scheduling'})
MATCH (s2:Skill {name: 'Basic Content Writing'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

// Intermediate skill prerequisites
MATCH (s1:Skill {name: 'Engagement Response'})
MATCH (s2:Skill {name: 'Comment Etiquette'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s2);

MATCH (s1:Skill {name: 'Storytelling Through Posts'})
MATCH (s2:Skill {name: 'Basic Content Writing'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Storytelling Through Posts'})
MATCH (k:Knowledge {name: 'Authentic Communication'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s1:Skill {name: 'Analytics Interpretation'})
MATCH (k:Knowledge {name: 'Engagement Mechanics'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s1:Skill {name: 'Video Content Creation'})
MATCH (s2:Skill {name: 'Platform Navigation'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Trend Participation'})
MATCH (k:Knowledge {name: 'Algorithm Basics'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s1:Skill {name: 'Collaborative Content Creation'})
MATCH (s2:Skill {name: 'Engagement Response'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Novice'}]->(s2);

// Advanced skill prerequisites
MATCH (s1:Skill {name: 'Personal Brand Development'})
MATCH (s2:Skill {name: 'Basic Content Writing'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Personal Brand Development'})
MATCH (s2:Skill {name: 'Image Selection and Posting'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Personal Brand Development'})
MATCH (k:Knowledge {name: 'Personal Brand Development'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Audience Community Building'})
MATCH (s2:Skill {name: 'Engagement Response'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Audience Community Building'})
MATCH (k:Knowledge {name: 'Community Building'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s1:Skill {name: 'Cross-Platform Content Adaptation'})
MATCH (s2:Skill {name: 'Basic Content Writing'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Competent'}]->(s2);

MATCH (s1:Skill {name: 'Cross-Platform Content Adaptation'})
MATCH (k:Knowledge {name: 'Cross-Platform Presence Management'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Understand'}]->(k);

MATCH (s1:Skill {name: 'Performance Optimization'})
MATCH (s2:Skill {name: 'Analytics Interpretation'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Advanced Beginner'}]->(s2);

MATCH (s1:Skill {name: 'Authentic Voice Development'})
MATCH (k:Knowledge {name: 'Authentic Communication'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

MATCH (s1:Skill {name: 'Audience Insight Gathering'})
MATCH (k:Knowledge {name: 'Audience Identification and Understanding'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

// Expert skill prerequisites
MATCH (s1:Skill {name: 'Influence and Impact'})
MATCH (s2:Skill {name: 'Authentic Voice Development'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s1:Skill {name: 'Influence and Impact'})
MATCH (s2:Skill {name: 'Audience Community Building'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s1:Skill {name: 'Content Innovation'})
MATCH (s2:Skill {name: 'Trend Participation'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s1:Skill {name: 'Creator Mentorship'})
MATCH (s2:Skill {name: 'Personal Brand Development'})
CREATE (s1)-[:REQUIRES_SKILL {min_dreyfus_level: 'Proficient'}]->(s2);

MATCH (s1:Skill {name: 'Platform Evolution Adaptation'})
MATCH (k:Knowledge {name: 'Platform Evolution and Innovation'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Analyze'}]->(k);

MATCH (s1:Skill {name: 'Ethical Impact Management'})
MATCH (k:Knowledge {name: 'Social Impact and Responsibility'})
CREATE (s1)-[:REQUIRES_KNOWLEDGE {min_bloom_level: 'Apply'}]->(k);

// ============================================================
// Milestone Prerequisite Relationships
// ============================================================

// Foundation milestone prerequisites
MATCH (m1:Milestone {name: 'Post Your First Content'})
MATCH (m2:Milestone {name: 'Create First Social Media Account'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Reach 10 Followers'})
MATCH (m2:Milestone {name: 'Post Your First Content'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Leave Your First Meaningful Comment'})
MATCH (m2:Milestone {name: 'Reach 10 Followers'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Master Basic Platform Navigation'})
MATCH (m2:Milestone {name: 'Create First Social Media Account'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Developing milestone prerequisites
MATCH (m1:Milestone {name: 'Post Consistently for One Month'})
MATCH (m2:Milestone {name: 'Post Your First Content'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Reach 50 Followers'})
MATCH (m2:Milestone {name: 'Reach 10 Followers'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Receive Your First Engagement (Like or Comment)'})
MATCH (m2:Milestone {name: 'Post Your First Content'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Develop Recognizable Posting Style'})
MATCH (m2:Milestone {name: 'Post Consistently for One Month'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Complete Your First Content Batch'})
MATCH (m2:Milestone {name: 'Post Consistently for One Month'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Competent milestone prerequisites
MATCH (m1:Milestone {name: 'Reach 100 Followers'})
MATCH (m2:Milestone {name: 'Reach 50 Followers'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Get Positive Feedback on Your Authenticity'})
MATCH (m2:Milestone {name: 'Develop Recognizable Posting Style'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Create Your First Video Content'})
MATCH (m2:Milestone {name: 'Master Basic Platform Navigation'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Use Advanced Platform Features'})
MATCH (m2:Milestone {name: 'Master Basic Platform Navigation'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Achieve Your First Viral Moment (1000+ Views or Unexpected Engagement Spike)'})
MATCH (m2:Milestone {name: 'Reach 100 Followers'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Build Active Engagement Community'})
MATCH (m2:Milestone {name: 'Reach 50 Followers'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Advanced milestone prerequisites
MATCH (m1:Milestone {name: 'Reach 500 Followers'})
MATCH (m2:Milestone {name: 'Reach 100 Followers'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Get Mentioned or Reposted by Another Creator'})
MATCH (m2:Milestone {name: 'Build Active Engagement Community'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Establish Personal Brand Recognition'})
MATCH (m2:Milestone {name: 'Develop Recognizable Posting Style'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Create Content That Sparks Meaningful Conversation'})
MATCH (m2:Milestone {name: 'Build Active Engagement Community'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Master Cross-Platform Presence'})
MATCH (m2:Milestone {name: 'Establish Personal Brand Recognition'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Attract Collaborator or Partnership Opportunity'})
MATCH (m2:Milestone {name: 'Reach 500 Followers'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

// Master milestone prerequisites
MATCH (m1:Milestone {name: 'Reach 1000 Followers (Entry to Influencer Territory)'})
MATCH (m2:Milestone {name: 'Reach 500 Followers'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Shape Conversations in Your Niche'})
MATCH (m2:Milestone {name: 'Establish Personal Brand Recognition'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Mentor Other Creators'})
MATCH (m2:Milestone {name: 'Reach 500 Followers'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Build Engaged Community Around Shared Values'})
MATCH (m2:Milestone {name: 'Build Active Engagement Community'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Achieve Organic Media Coverage or Press Mention'})
MATCH (m2:Milestone {name: 'Reach 1000 Followers (Entry to Influencer Territory)'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Launch Monetization or Revenue Stream from Your Platform'})
MATCH (m2:Milestone {name: 'Reach 1000 Followers (Entry to Influencer Territory)'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Achieve Thought Leader Status in Your Domain'})
MATCH (m2:Milestone {name: 'Shape Conversations in Your Niche'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Create Positive Social Impact Through Your Platform'})
MATCH (m2:Milestone {name: 'Reach 1000 Followers (Entry to Influencer Territory)'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Sustain 2000+ Followers with High Engagement Rates'})
MATCH (m2:Milestone {name: 'Reach 1000 Followers (Entry to Influencer Territory)'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

MATCH (m1:Milestone {name: 'Successfully Adapt to Major Platform Change'})
MATCH (m2:Milestone {name: 'Master Cross-Platform Presence'})
CREATE (m1)-[:REQUIRES_MILESTONE]->(m2);

