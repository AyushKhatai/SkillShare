const db = require('../config/database');

// Safely initialize Google Generative AI
let GoogleGenerativeAI = null;
try {
    const genai = require('@google/generative-ai');
    GoogleGenerativeAI = genai.GoogleGenerativeAI;
} catch (e) {
    console.log('Using enhanced heuristic AI engine');
}

function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && GoogleGenerativeAI) {
        return new GoogleGenerativeAI(apiKey);
    }
    return null;
}

// ─── Domain Detection Helper ─────────────────────────────────────
function detectDomain(text = '') {
    const lower = text.toLowerCase();

    const musicKeywords = ['flute', 'guitar', 'piano', 'violin', 'drums', 'singing', 'vocal', 'vocals', 'music', 'instrument', 'harmonica', 'tabla', 'sitar', 'bass', 'ukulele', 'keyboard', 'choir', 'rhythm'];
    const sportsKeywords = ['martial art', 'martial arts', 'karate', 'taekwondo', 'judo', 'kung fu', 'boxing', 'mma', 'basketball', 'football', 'soccer', 'cricket', 'tennis', 'badminton', 'volleyball', 'swimming', 'gym', 'workout', 'fitness', 'yoga', 'pilates', 'athletics', 'running'];
    const artsKeywords = ['figma', 'ui', 'ux', 'ui/ux', 'design', 'graphic design', 'photoshop', 'illustrator', 'drawing', 'sketching', 'painting', 'watercolor', 'photography', 'photo', 'video editing', 'premiere', 'after effects', '3d', 'blender', 'animation', 'calligraphy', 'sculpture'];
    const languageKeywords = ['english', 'spanish', 'french', 'german', 'japanese', 'chinese', 'mandarin', 'hindi', 'korean', 'russian', 'italian', 'language', 'public speaking', 'communication', 'debate', 'presentation', 'writing', 'grammar', 'accent'];
    const scienceKeywords = ['calculus', 'math', 'mathematics', 'algebra', 'geometry', 'physics', 'chemistry', 'biology', 'organic chemistry', 'biochemistry', 'statistics', 'stats', 'probability', 'economics', 'finance', 'accounting'];
    const techKeywords = ['python', 'javascript', 'typescript', 'react', 'next.js', 'node', 'node.js', 'html', 'css', 'java', 'c++', 'c#', 'c programming', 'rust', 'golang', 'sql', 'database', 'mongodb', 'postgresql', 'data structures', 'dsa', 'algorithm', 'machine learning', 'ml', 'ai', 'deep learning', 'web dev', 'web development', 'frontend', 'backend', 'fullstack', 'git', 'github', 'devops', 'docker', 'cloud', 'aws'];

    if (musicKeywords.some(kw => lower.includes(kw))) return 'music';
    if (sportsKeywords.some(kw => lower.includes(kw))) return 'sports';
    if (artsKeywords.some(kw => lower.includes(kw))) return 'arts';
    if (languageKeywords.some(kw => lower.includes(kw))) return 'language';
    if (scienceKeywords.some(kw => lower.includes(kw))) return 'science';
    if (techKeywords.some(kw => lower.includes(kw))) return 'tech';

    return 'general';
}

// ─── 1. AI Skill & Tutor Matchmaker ─────────────────────────────
exports.matchSkills = async (req, res) => {
    try {
        const { query, level, category } = req.body;
        if (!query || query.trim() === '') {
            return res.status(400).json({ message: 'Search query is required' });
        }

        // Fetch all active skills with user/tutor details
        const result = await db.query(`
            SELECT s.*, u.full_name as teacher_name, u.email as teacher_email, 
                   u.department, u.year_of_study, u.profile_image
            FROM skills s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.is_active = true
            ORDER BY s.average_rating DESC, s.total_bookings DESC
        `);

        const allSkills = result.rows;
        if (allSkills.length === 0) {
            return res.json({
                matches: [],
                aiSummary: "No active skills are currently listed on campus. Be the first to share one!",
                suggestedTopics: []
            });
        }

        const client = getGeminiClient();
        if (client) {
            try {
                const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const prompt = `You are the Campus SkillShare AI Matchmaker. A college student needs help: "${query}".
Target Level: ${level || 'Any'}. Preferred Category: ${category || 'Any'}.

Here is the database of available campus tutor skills:
${JSON.stringify(allSkills.map(s => ({
                    id: s.skill_id,
                    title: s.title,
                    description: s.description,
                    category: s.category,
                    skill_level: s.skill_level,
                    tutor: s.teacher_name,
                    rating: s.average_rating,
                    sessions: s.total_bookings
                })))}

Return a JSON object with:
1. "matches": Array of top matched skill IDs (up to 5), with "skill_id", "match_score" (number between 60-99), "reasoning" (1-2 sentences why this tutor is a great match), and "recommended_focus" (short topic suggestion).
2. "aiSummary": A 2-sentence encouraging synthesis of the best campus tutors for this learning goal.
3. "suggestedTopics": An array of 3-5 subtopics the student should ask their peer tutor to cover.

Output ONLY valid JSON without markdown wrapping.`;

                const response = await model.generateContent(prompt);
                const text = response.response.text();
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    const hydratedMatches = (parsed.matches || []).map(m => {
                        const skill = allSkills.find(s => s.skill_id === m.skill_id);
                        return skill ? { ...skill, match_score: m.match_score, reasoning: m.reasoning, recommended_focus: m.recommended_focus } : null;
                    }).filter(Boolean);

                    return res.json({
                        matches: hydratedMatches,
                        aiSummary: parsed.aiSummary,
                        suggestedTopics: parsed.suggestedTopics || []
                    });
                }
            } catch (err) {
                console.warn('Gemini API call failed, using heuristic match engine:', err.message);
            }
        }

        // Enhanced Heuristic fallback matching
        const searchTerms = query.toLowerCase().split(/\s+/).filter(w => w.length >= 2);
        const domain = detectDomain(query);

        const scoredSkills = allSkills.map(skill => {
            let score = 40;
            const titleLower = (skill.title || '').toLowerCase();
            const descLower = (skill.description || '').toLowerCase();
            const catLower = (skill.category || '').toLowerCase();
            const tutorLower = (skill.teacher_name || '').toLowerCase();
            const textToSearch = `${titleLower} ${descLower} ${catLower} ${tutorLower}`;

            // Exact match bonus
            if (titleLower === query.toLowerCase().trim()) score += 40;
            if (titleLower.includes(query.toLowerCase().trim())) score += 30;

            searchTerms.forEach(term => {
                if (titleLower.includes(term)) score += 20;
                if (catLower.includes(term)) score += 15;
                if (descLower.includes(term)) score += 10;
                if (tutorLower.includes(term)) score += 25;
            });

            // Domain category matching
            if (domain === 'music' && (catLower.includes('music') || titleLower.includes('guitar') || titleLower.includes('flute'))) score += 25;
            if (domain === 'sports' && (catLower.includes('sports') || catLower.includes('fitness') || titleLower.includes('martial') || titleLower.includes('basketball'))) score += 25;
            if (domain === 'arts' && (catLower.includes('art') || catLower.includes('design') || titleLower.includes('figma') || titleLower.includes('ui'))) score += 25;
            if (domain === 'tech' && (catLower.includes('program') || catLower.includes('tech') || titleLower.includes('python') || titleLower.includes('react'))) score += 25;

            if (category && category !== 'all' && catLower === category.toLowerCase()) {
                score += 15;
            }
            if (level && level !== 'all' && (skill.skill_level || '').toLowerCase() === level.toLowerCase()) {
                score += 10;
            }

            score += Math.min(15, (parseFloat(skill.average_rating) || 0) * 3);
            score = Math.min(98, score);

            return {
                ...skill,
                match_score: score,
                reasoning: `Matches your interest in ${skill.title} taught by ${skill.teacher_name} (${skill.category} · ${skill.skill_level} level).`,
                recommended_focus: `Hands-on 1-on-1 practice and personalized campus mentorship in ${skill.title}.`
            };
        });

        scoredSkills.sort((a, b) => b.match_score - a.match_score);
        const topMatches = scoredSkills.filter(s => s.match_score >= 50).slice(0, 5);

        const domainTopics = {
            music: [`Foundations & proper technique in ${query}`, `Scales, rhythm & ear training`, `Playing complete songs / pieces`, `Live jam & performance feedback`],
            sports: [`Warmup, mobility & injury prevention in ${query}`, `Core techniques & footwork drills`, `Partner sparring / live match scenarios`, `Building physical endurance and consistency`],
            arts: [`Design fundamentals & visual hierarchy in ${query}`, `Tool mastery & workflow shortcuts`, `Creating portfolio-ready projects`, `Constructive peer design critique`],
            language: [`Pronunciation & core vocabulary in ${query}`, `Conversational immersion & listening`, `Grammar rules & practical phrases`, `Live dialogue practice with your tutor`],
            science: [`First principles & core concepts in ${query}`, `Step-by-step problem breakdown`, `Exam-style practice problems`, `Clarifying difficult formulas and theories`],
            tech: [`Foundational concepts & syntax in ${query}`, `Building a functional mini-project`, `Debugging strategies & best practices`, `Code review with your campus tutor`]
        };

        const suggestedTopics = domainTopics[domain] || [
            `Core fundamentals of ${query}`,
            `Common beginner pitfalls and best practices`,
            `Practical hands-on exercise / mini-project`,
            `Recommended resources and practice drills`
        ];

        res.json({
            matches: topMatches.length > 0 ? topMatches : scoredSkills.slice(0, 3),
            aiSummary: topMatches.length > 0 
                ? `Found ${topMatches.length} campus tutors aligned with "${query}". Connecting with peer tutors gives you personalized 1-on-1 guidance.`
                : `Here are available peer tutors on campus who can guide your learning journey in ${query}.`,
            suggestedTopics
        });

    } catch (error) {
        console.error('Match skills error:', error);
        res.status(500).json({ message: 'Failed to process AI matchmaker' });
    }
};

// ─── 2. AI Personalized 4-Week Learning Roadmap Generator ──────────
exports.generateRoadmap = async (req, res) => {
    try {
        const { topic, currentLevel, targetGoal, hoursPerWeek } = req.body;
        if (!topic) {
            return res.status(400).json({ message: 'Topic is required' });
        }

        const client = getGeminiClient();
        if (client) {
            try {
                const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const prompt = `You are an expert college academic & skill mentor. Generate a structured 4-week learning roadmap for a student.
Topic: "${topic}"
Current Skill Level: ${currentLevel || 'Beginner'}
Target Goal: "${targetGoal || 'Build proficiency and complete a hands-on project'}"
Available Time: ${hoursPerWeek || 5} hours/week

Return ONLY a JSON object formatted as:
{
  "title": "4-Week ${topic} Mastery Roadmap",
  "overview": "Brief 2-sentence encouraging summary of the journey",
  "prerequisites": ["List of 2-3 basic requirements"],
  "weeks": [
    {
      "week": 1,
      "theme": "Week 1 Theme Title",
      "goals": ["Goal 1", "Goal 2"],
      "keyTopics": ["Topic A", "Topic B", "Topic C"],
      "practicalTask": "Hands-on exercise or mini-project to build",
      "peerSessionAdvice": "What to ask your SkillShare campus tutor during this week's 1-on-1 session"
    },
    ... (total 4 weeks)
  ],
  "capstoneProject": "Description of an impressive portfolio/campus project to complete by Week 4",
  "recommendedCampusAction": "How to leverage peer tutoring on SkillShare Hub to accelerate progress"
}
Output valid JSON only.`;

                const response = await model.generateContent(prompt);
                const text = response.response.text();
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return res.json(JSON.parse(jsonMatch[0]));
                }
            } catch (err) {
                console.warn('Gemini roadmap generation failed, using domain roadmap generator:', err.message);
            }
        }

        // Domain-Aware High Quality Modular Fallback Roadmap
        const domain = detectDomain(topic);
        let roadmap;

        if (domain === 'music') {
            roadmap = {
                title: `4-Week ${topic} Mastery Roadmap`,
                overview: `A comprehensive 4-week practice regimen to master sound production, finger agility, scales, and complete musical pieces on ${topic}.`,
                prerequisites: [
                    `Access to a playable ${topic}`,
                    `A metronome app or tuner`,
                    `Dedication to 20-30 minutes of daily deliberate practice`
                ],
                weeks: [
                    {
                        week: 1,
                        theme: "Sound Production, Posture & First Clear Tones",
                        goals: [
                            `Master proper embouchure, breathing, and holding posture for ${topic}`,
                            `Produce clean, steady sustained tones without airy distortion`,
                            `Learn your first 3-5 fundamental notes with correct finger placement`
                        ],
                        keyTopics: [
                            `Diaphragmatic Breathing & Posture`,
                            `Embouchure & Airstream Alignment`,
                            `Basic Fingering Chart & Long Tones`
                        ],
                        practicalTask: `Play clean 8-second long tones across your first 4 notes with consistent pitch.`,
                        peerSessionAdvice: `Book a 30-min session with your SkillShare tutor to have them check your embouchure and posture in real-time.`
                    },
                    {
                        week: 2,
                        theme: "Scales, Finger Dexterity & Basic Melodies",
                        goals: [
                            `Practice the Major scale cleanly up and down`,
                            `Coordinate smooth transitions between adjacent notes`,
                            `Learn your first simple 8-bar campus song or melody`
                        ],
                        keyTopics: [
                            `Major Scales & Octave Shifts`,
                            `Tonguing & Note Articulation`,
                            `Reading Sheet Music / Tabs / Swaras`
                        ],
                        practicalTask: `Record yourself playing a beginner melody with steady rhythm using a metronome.`,
                        peerSessionAdvice: `Ask your tutor to spot-check finger speed and point out unnecessary hand tension.`
                    },
                    {
                        week: 3,
                        theme: "Dynamic Control, Tone Warmth & Intermediate Pieces",
                        goals: [
                            `Develop volume control (piano to forte) without losing pitch`,
                            `Incorporate expressive elements like vibrato or ornamentation`,
                            `Learn a full intermediate-level song or solo`
                        ],
                        keyTopics: [
                            `Dynamics (Volume & Breath Control)`,
                            `Speed Drills & Fast Fingering Patterns`,
                            `Rhythmic Precision & Timing`
                        ],
                        practicalTask: `Play through an entire song seamlessly from start to finish without pausing for mistakes.`,
                        peerSessionAdvice: `Perform the piece for your tutor and get specific feedback on musicality and tone warmth.`
                    },
                    {
                        week: 4,
                        theme: "Performance Polish & Campus Jam Showcase",
                        goals: [
                            `Perform with confident stage presence and zero hesitation`,
                            `Jam alongside a backing track or fellow peer musicians`,
                            `Record a high-quality video showcase of your playing`
                        ],
                        keyTopics: [
                            `Live Performance Confidence`,
                            `Playing with Backing Tracks & Accompaniment`,
                            `Next Steps for Advanced Repertoire`
                        ],
                        practicalTask: `Record a complete 2-minute performance video of your capstone piece.`,
                        peerSessionAdvice: `Do a final live review session with your tutor, receive your certificate/review, and celebrate your progress!`
                    }
                ],
                capstoneProject: `Complete ${topic} Showcase: A confident 2-minute solo performance of your favorite song played with clear tone, dynamic expression, and steady rhythm.`,
                recommendedCampusAction: `Book weekly 1-on-1 sessions on SkillShare Hub to ensure your muscle memory and tone formation are perfect from day one.`
            };
        } else if (domain === 'sports') {
            roadmap = {
                title: `4-Week ${topic} Training Roadmap`,
                overview: `A structured 4-week physical and tactical training plan to build fundamental mechanics, stamina, and match/sparring readiness in ${topic}.`,
                prerequisites: [
                    `Comfortable athletic footwear and workout attire`,
                    `Basic cardiovascular fitness`,
                    `Commitment to warmup, hydration, and injury prevention`
                ],
                weeks: [
                    {
                        week: 1,
                        theme: "Fundamental Stance, Footwork & Core Mechanics",
                        goals: [
                            `Master the foundational guard, balance, and basic stance in ${topic}`,
                            `Execute fundamental movement patterns with balance and control`,
                            `Establish a dynamic warmup and post-session cooldown routine`
                        ],
                        keyTopics: [
                            `Center of Gravity & Base Footwork`,
                            `Primary Strikes, Throws, or Ball-Handling Mechanics`,
                            `Joint Mobility & Flexibility Warmups`
                        ],
                        practicalTask: `Perform 100 repetitions of fundamental footwork drills with flawless balance.`,
                        peerSessionAdvice: `Have your tutor review your stance from multiple angles to correct bad balance habits.`
                    },
                    {
                        week: 2,
                        theme: "Combination Drills & Reaction Speed",
                        goals: [
                            `Chain multiple basic movements into fluid 3-step combinations`,
                            `Improve spatial awareness and court/mat positioning`,
                            `Build sport-specific cardiovascular conditioning`
                        ],
                        keyTopics: [
                            `Combination Drills & Timing`,
                            `Defensive Positioning & Counter-Movements`,
                            `Agility Ladder & Cone Drills`
                        ],
                        practicalTask: `Complete a 15-minute high-intensity combination drill without breaking form.`,
                        peerSessionAdvice: `Do live pad-work or controlled defense-offense drills with your tutor on campus.`
                    },
                    {
                        week: 3,
                        theme: "Tactical Scenarios & Partner Drills",
                        goals: [
                            `Apply techniques under mild defensive pressure or simulated game situations`,
                            `Identify and exploit common opponent openings or weaknesses`,
                            `Refine energy conservation and breathing during high exertion`
                        ],
                        keyTopics: [
                            `Game / Sparring Strategy & Decision Making`,
                            `Advanced Maneuvers & Feints`,
                            `Stamina Pacing & Recovery Breathing`
                        ],
                        practicalTask: `Participate in 3 controlled scrimmage or light sparring rounds with peer partners.`,
                        peerSessionAdvice: `Ask your tutor to simulate realistic game/match scenarios and give real-time tactical feedback.`
                    },
                    {
                        week: 4,
                        theme: "Live Match Readiness & Performance Showcase",
                        goals: [
                            `Execute your best techniques confidently in full live sessions`,
                            `Showcase refined form, discipline, and sportsmanship`,
                            `Establish an ongoing weekly maintenance training plan`
                        ],
                        keyTopics: [
                            `Live Match Performance & Mental Focus`,
                            `Injury Prevention & Longevity Habits`,
                            `Mentoring Other Beginners on Campus`
                        ],
                        practicalTask: `Participate in a full campus pickup game or friendly sparring exhibition.`,
                        peerSessionAdvice: `Review match highlights with your tutor and get personalized recommendations for competitive play.`
                    }
                ],
                capstoneProject: `${topic} Skill Exhibition: Confidently demonstrate a complete routine, sparring round, or game performance showcasing mastery of technique and athletic stamina.`,
                recommendedCampusAction: `Pair up with verified campus sports mentors on SkillShare Hub for live 1-on-1 coaching at the college sports complex.`
            };
        } else if (domain === 'arts') {
            roadmap = {
                title: `4-Week ${topic} Design & Creative Roadmap`,
                overview: `A hands-on, portfolio-driven 4-week sprint to master design principles, modern workflows, and build an eye-catching project in ${topic}.`,
                prerequisites: [
                    `Computer with required creative software (Figma, Photoshop, etc.)`,
                    `Eye for aesthetics and curiosity for visual problem-solving`,
                    `Dedication to iterative feedback and design critique`
                ],
                weeks: [
                    {
                        week: 1,
                        theme: "Design Foundations, Visual Hierarchy & Tool Mastery",
                        goals: [
                            `Understand typography, color harmony, and visual hierarchy in ${topic}`,
                            `Master essential tool shortcuts, frames, and workflow setup`,
                            `Deconstruct 3 world-class design examples to analyze their structure`
                        ],
                        keyTopics: [
                            `Color Theory & 60-30-10 Rule`,
                            `Typography Scale & Spacing Systems`,
                            `Core Tool Mechanics & Keyboard Shortcuts`
                        ],
                        practicalTask: `Recreate a professional design screen/asset from scratch with pixel-perfect precision.`,
                        peerSessionAdvice: `Share your recreation with a campus design tutor to spot spacing, alignment, and contrast issues.`
                    },
                    {
                        week: 2,
                        theme: "Components, Systems & Interactive Prototyping",
                        goals: [
                            `Build reusable component libraries and design tokens`,
                            `Implement responsive layouts (Auto-Layout / Grid Systems)`,
                            `Create smooth interactive micro-animations or prototypes`
                        ],
                        keyTopics: [
                            `Design Systems & Reusable Components`,
                            `Auto-Layout & Responsive Constraints`,
                            `Interactive Transitions & Micro-interactions`
                        ],
                        practicalTask: `Build a 3-screen interactive prototype with functioning buttons, states, and smooth transitions.`,
                        peerSessionAdvice: `Have your tutor conduct a live usability walkthrough of your prototype.`
                    },
                    {
                        week: 3,
                        theme: "Original Capstone Project: Wireframing to High-Fidelity",
                        goals: [
                            `Define user problem statement and map out user flows`,
                            `Draft low-fidelity wireframes before moving to visual styling`,
                            `Craft the high-fidelity UI screens for your original project`
                        ],
                        keyTopics: [
                            `User Journey Mapping & Information Architecture`,
                            `High-Fidelity Visual Styling & Polish`,
                            `Accessibility & Contrast Compliance`
                        ],
                        practicalTask: `Complete the complete high-fidelity UI design for your chosen campus project.`,
                        peerSessionAdvice: `Do a 45-min design critique session on SkillShare Hub to polish layout, shadows, and copywriting.`
                    },
                    {
                        week: 4,
                        theme: "Case Study Presentation & Portfolio Showcase",
                        goals: [
                            `Package your project into a compelling Behance/Dribbble/LinkedIn case study`,
                            `Create 3D mockups and presentation slides`,
                            `Prepare to teach design fundamentals to other students`
                        ],
                        keyTopics: [
                            `Case Study Storytelling & Mockup Presentation`,
                            `Design Handoff & Documentation`,
                            `Next Steps for Campus Freelancing & Internships`
                        ],
                        practicalTask: `Publish your complete case study with mockups and share it on your student portfolio.`,
                        peerSessionAdvice: `Receive a final portfolio review from your SkillShare tutor and list your own design skill on campus!`
                    }
                ],
                capstoneProject: `Complete ${topic} Portfolio Case Study: A fully polished, interactive design project solving a real student problem, complete with high-res mockups and design system documentation.`,
                recommendedCampusAction: `Book weekly design review sessions with peer tutors to develop an industry-ready portfolio.`
            };
        } else {
            // General / Tech / Academic Roadmap
            roadmap = {
                title: `4-Week ${topic} Learning Roadmap`,
                overview: `A structured 4-week sprint designed to take you from ${currentLevel || 'beginner'} to confidently building real projects with peer tutor guidance.`,
                prerequisites: [
                    `Basic familiarity with foundational concepts in ${topic}`,
                    `Dedicated practice time (${hoursPerWeek || 5} hours/week)`,
                    `Curiosity and willingness to pair-learn with campus peers`
                ],
                weeks: [
                    {
                        week: 1,
                        theme: "Core Foundations & Workflow Setup",
                        goals: [
                            `Understand the fundamental principles and terminology of ${topic}`,
                            `Configure the ideal practice or development environment`,
                            `Complete your first simple baseline exercise or project`
                        ],
                        keyTopics: [
                            `Introduction & Key Terminology`,
                            `Foundational Rules, Tools & Core Workflow`,
                            `Deconstructing Beginner-Level Examples`
                        ],
                        practicalTask: `Build a starter prototype or walkthrough exercise demonstrating fundamental mechanics.`,
                        peerSessionAdvice: `Book a 45-min session on SkillShare Hub to review your setup and clarify initial foundational doubts.`
                    },
                    {
                        week: 2,
                        theme: "Deep Dive into Core Patterns & Techniques",
                        goals: [
                            `Master intermediate principles, problem-solving, and workflows`,
                            `Debug common beginner errors and edge cases`,
                            `Combine multiple concepts into a cohesive practical project`
                        ],
                        keyTopics: [
                            `Modular Structure & Best Practices`,
                            `Efficiency, Problem Solving & Analysis`,
                            `Error Handling & Avoiding Common Traps`
                        ],
                        practicalTask: `Create an intermediate-level exercise or component with realistic requirements.`,
                        peerSessionAdvice: `Pair-learn with your tutor on a tricky challenge and ask for constructive technique review.`
                    },
                    {
                        week: 3,
                        theme: "Real-World Application & Integration",
                        goals: [
                            `Tackle complex challenges and realistic project scenarios`,
                            `Refine quality, aesthetics, performance, and user experience`,
                            `Start building the foundational pieces of your capstone project`
                        ],
                        keyTopics: [
                            `Advanced Features & Real-world Workflows`,
                            `Performance Optimization & Clean Structure`,
                            `Testing & Peer Review`
                        ],
                        practicalTask: `Develop the core MVP (Minimum Viable Product) of your chosen capstone project.`,
                        peerSessionAdvice: `Do a mock demo with your tutor and receive actionable feedback on architecture and polish.`
                    },
                    {
                        week: 4,
                        theme: "Capstone Polish, Portfolio & Showcase",
                        goals: [
                            `Finalize and document your capstone project`,
                            `Publish to GitHub / portfolio or campus showcase`,
                            `Prepare to teach what you've learned to other students`
                        ],
                        keyTopics: [
                            `Project Presentation & Documentation`,
                            `Answering Questions with Deep Confidence`,
                            `Next Steps for Continuous Mastery`
                        ],
                        practicalTask: `Ship your complete, polished capstone project and share it with the campus community.`,
                        peerSessionAdvice: `Have your tutor verify your completed project, leave a review, and register your own skill on SkillShare Hub!`
                    }
                ],
                capstoneProject: `Interactive ${topic} Campus Showcase: A fully functioning project solving a real problem, complete with documentation and clean presentation.`,
                recommendedCampusAction: `Book 1 session every week with a verified SkillShare Hub peer tutor to keep yourself accountable and get unstuck immediately.`
            };
        }

        res.json(roadmap);
    } catch (error) {
        console.error('Generate roadmap error:', error);
        res.status(500).json({ message: 'Failed to generate learning roadmap' });
    }
};

// ─── 3. AI Skill Description & Syllabus Enhancer (For Tutors) ─────
exports.enhanceSkill = async (req, res) => {
    try {
        const { title, category, skill_level, notes } = req.body;
        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const client = getGeminiClient();
        if (client) {
            try {
                const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const prompt = `You are a curriculum expert for university peer tutoring. A student tutor wants to offer a skill session:
Title: "${title}"
Category: "${category || 'General'}"
Target Level: "${skill_level || 'Beginner to Intermediate'}"
Tutor's rough notes: "${notes || 'None provided'}"

Enhance this skill listing to attract students and provide clear value. Return a JSON object formatted as:
{
  "enhancedTitle": "Catchy, professional title (e.g. Master Modern React & Next.js: From Zero to Fullstack)",
  "shortDescription": "2-3 sentence engaging description highlighting what makes this peer session unique",
  "learningOutcomes": ["Outcome 1", "Outcome 2", "Outcome 3", "Outcome 4"],
  "prerequisites": "Prerequisites in 1 concise sentence",
  "suggestedDuration": "1 hour" or "1.5 hours",
  "recommendedLocation": "Campus Library / Online via Google Meet"
}
Return ONLY valid JSON.`;

                const response = await model.generateContent(prompt);
                const text = response.response.text();
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return res.json(JSON.parse(jsonMatch[0]));
                }
            } catch (err) {
                console.warn('Gemini skill enhancement failed, using fallback:', err.message);
            }
        }

        const domain = detectDomain(title);
        let outcomeList = [
            `Master foundational principles and core workflows in ${title}`,
            `Work through hands-on practice problems with immediate feedback`,
            `Learn best practices, shortcuts, and how to avoid common beginner traps`,
            `Build an impressive mini project/exercise you can showcase on campus`
        ];

        if (domain === 'music') {
            outcomeList = [
                `Master proper posture, breath support, and tone production on ${title}`,
                `Learn essential scales, rhythm patterns, and finger coordination`,
                `Play 2-3 popular melodies with accurate pitch and timing`,
                `Learn how to practice effectively with metronome and ear training`
            ];
        } else if (domain === 'sports') {
            outcomeList = [
                `Master correct form, balance, and injury prevention in ${title}`,
                `Develop sport-specific footwork, agility, and offensive/defensive drills`,
                `Improve endurance, reaction time, and tactical decision-making`,
                `Participate in live match/sparring drills with confidence`
            ];
        } else if (domain === 'arts') {
            outcomeList = [
                `Master modern creative workflows and tool shortcuts in ${title}`,
                `Apply professional color harmony, typography, and visual hierarchy`,
                `Create interactive prototypes and portfolio-ready assets`,
                `Receive actionable peer critique to elevate your aesthetic standard`
            ];
        }

        res.json({
            enhancedTitle: `${title} — 1-on-1 Campus Masterclass`,
            shortDescription: `Join this interactive 1-on-1 peer session to master ${title}. Learn practical concepts through real campus examples, step-by-step guidance, and live hands-on practice.`,
            learningOutcomes: outcomeList,
            prerequisites: `Basic interest in ${category || 'this subject'}. No advanced prior background required.`,
            suggestedDuration: "1 hour",
            recommendedLocation: "Campus Library / Online (Google Meet)"
        });
    } catch (error) {
        console.error('Enhance skill error:', error);
        res.status(500).json({ message: 'Failed to enhance skill' });
    }
};

// ─── 4. AI Diagnostic Quiz & Skill Check Generator ───────────────
exports.generateQuiz = async (req, res) => {
    try {
        const { topic, level } = req.body;
        if (!topic) {
            return res.status(400).json({ message: 'Topic is required' });
        }

        const client = getGeminiClient();
        if (client) {
            try {
                const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const prompt = `Generate a 3-question diagnostic multiple choice quiz for college students preparing to learn: "${topic}" (${level || 'Beginner'} level).
Each question must be realistic, highly specific to the subject "${topic}", and have 4 realistic options with only 1 correct answer.
Return ONLY a JSON object:
{
  "topic": "${topic}",
  "questions": [
    {
      "id": 1,
      "question": "Clear question text specifically testing a real concept in ${topic}?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this answer is correct and what concept it tests"
    },
    ... (3 questions total)
  ]
}
Output valid JSON only.`;

                const response = await model.generateContent(prompt);
                const text = response.response.text();
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return res.json(JSON.parse(jsonMatch[0]));
                }
            } catch (err) {
                console.warn('Gemini quiz generation failed, using domain quiz generator:', err.message);
            }
        }

        // Domain-Specific Realistic Diagnostic Quizzes
        const domain = detectDomain(topic);
        let questions = [];

        if (domain === 'music') {
            const isFlute = topic.toLowerCase().includes('flute');
            const isGuitar = topic.toLowerCase().includes('guitar');
            
            if (isFlute) {
                questions = [
                    {
                        id: 1,
                        question: `What is the most crucial foundational technique for producing a clear, resonant tone on the flute?`,
                        options: [
                            `Proper embouchure formation and focused airstream alignment across the embouchure hole`,
                            `Blowing as much air as possible without shaping the lips`,
                            `Pressing the keys with maximum finger force to seal the holes`,
                            `Holding the flute completely vertically like a recorder`
                        ],
                        correctIndex: 0,
                        explanation: `A relaxed, focused embouchure directing half the airstream into the hole and half across the edge creates clean acoustic resonance without airy sound.`
                    },
                    {
                        id: 2,
                        question: `How should a beginner flutist support sustained notes and maintain pitch stability?`,
                        options: [
                            `Shallow chest breathing with tight throat muscles`,
                            `Deep diaphragmatic breathing with steady core abdominal support`,
                            `Constantly changing lip position while playing a single note`,
                            `Holding their breath while pressing the keys`
                        ],
                        correctIndex: 1,
                        explanation: `Diaphragmatic breath support provides a consistent column of pressurized air, keeping sustained notes in tune.`
                    },
                    {
                        id: 3,
                        question: `What is the best daily practice routine to build finger agility and clean note articulation on flute?`,
                        options: [
                            `Only playing high-speed songs without warming up`,
                            `Practicing long tones, major/minor scales, and slow articulation drills with a metronome`,
                            `Practicing once a month for 5 hours straight`,
                            `Avoiding metronome usage so rhythm stays free`
                        ],
                        correctIndex: 1,
                        explanation: `Daily long tones build tone quality, while slow scale drills with a metronome instill precise muscle memory in your fingers.`
                    }
                ];
            } else if (isGuitar) {
                questions = [
                    {
                        id: 1,
                        question: `When fretting notes on the guitar neck, where should your fingers press for the cleanest sound without buzzing?`,
                        options: [
                            `Directly on top of the metal fret wire`,
                            `Just behind the fret wire on the fingertips`,
                            `In the exact middle of the fret space with flat fingers`,
                            `Pressing the wood behind two frets at once`
                        ],
                        correctIndex: 1,
                        explanation: `Pressing just behind the fret wire requires minimal finger pressure and eliminates string buzzing.`
                    },
                    {
                        id: 2,
                        question: `What is the most effective way to master smooth, fast transitions between open chords (like G, C, D, Em)?`,
                        options: [
                            `Looking away from your hands and pausing between each strum`,
                            `Practicing 1-minute chord change drills and identifying anchor fingers`,
                            `Only strumming downstrokes with maximum force`,
                            `Avoiding chords and only playing single notes`
                        ],
                        correctIndex: 1,
                        explanation: `Anchor fingers (fingers that stay on the same string or shape) help your hand switch chords effortlessly without pausing the strumming rhythm.`
                    },
                    {
                        id: 3,
                        question: `Why is practicing with a metronome essential when learning rhythm guitar and strumming patterns?`,
                        options: [
                            `It makes the guitar strings louder`,
                            `It internalizes steady tempo and prevents accidental rushing or dragging during transitions`,
                            `It automatically tunes the guitar strings to standard EADGBE`,
                            `It changes the tone from acoustic to electric`
                        ],
                        correctIndex: 1,
                        explanation: `A metronome builds an internal clock so your strumming remains in the pocket when playing with other musicians.`
                    }
                ];
            } else {
                questions = [
                    {
                        id: 1,
                        question: `What is the most foundational element when starting to learn ${topic}?`,
                        options: [
                            `Proper posture, hand position, and relaxed body mechanics`,
                            `Playing fast solos at maximum speed on day one`,
                            `Memorizing advanced music theory without touching the instrument`,
                            `Ignoring rhythm and playing at random tempos`
                        ],
                        correctIndex: 0,
                        explanation: `Relaxed posture and proper hand ergonomics prevent repetitive strain and ensure clean acoustic tone.`
                    },
                    {
                        id: 2,
                        question: `How does practicing scales and ear training benefit a musician in ${topic}?`,
                        options: [
                            `It helps recognize intervals, navigate keys, and improvise melodies accurately`,
                            `It replaces the need to ever tune your instrument`,
                            `It allows you to skip learning rhythm and timing`,
                            `It only helps classical players and is useless for modern music`
                        ],
                        correctIndex: 0,
                        explanation: `Scales build finger dexterity while ear training connects what you hear in your mind directly to your fingers.`
                    },
                    {
                        id: 3,
                        question: `When practicing a difficult musical passage or rhythm in ${topic}, what is the best strategy?`,
                        options: [
                            `Play it as fast as possible repeatedly until it sounds okay`,
                            `Slow down the tempo with a metronome, loop the specific 2-4 measure section, then gradually increase speed`,
                            `Skip the difficult section and only play the easy parts`,
                            `Switch to a different song immediately`
                        ],
                        correctIndex: 1,
                        explanation: `Isolating trouble spots at a slow tempo builds flawless muscle memory before accelerating.`
                    }
                ];
            }
        } else if (domain === 'sports') {
            questions = [
                {
                    id: 1,
                    question: `What is the primary role of a dynamic warmup before training in ${topic}?`,
                    options: [
                        `To exhaust your muscles completely before practice begins`,
                        `To increase core body temperature, lubricate joints, and activate sport-specific muscle groups`,
                        `To replace the need for hydration during the workout`,
                        `To test your maximum lift or sprint speed immediately`
                    ],
                    correctIndex: 1,
                    explanation: `Dynamic warmups elevate heart rate and prepare ligaments and joints for explosive movement, reducing injury risk.`
                },
                {
                    id: 2,
                    question: `Why is balance and proper footwork considered the foundation of all advanced maneuvers in ${topic}?`,
                    options: [
                        `Footwork allows efficient weight transfer, balance, power generation, and quick directional changes`,
                        `Footwork is only important for referees, not players`,
                        `You can generate full power even when completely off balance`,
                        `Footwork only matters on outdoor courts`
                    ],
                    correctIndex: 0,
                    explanation: `Every strike, throw, pivot, or shot derives its power and accuracy from a solid, balanced base.`
                },
                {
                    id: 3,
                    question: `How should you manage training intensity and recovery to build sustainable athletic progress in ${topic}?`,
                    options: [
                        `Train to absolute failure 7 days a week with zero rest days`,
                        `Incorporate progressive overload, adequate sleep, hydration, and structured rest days`,
                        `Only train once a month right before competitions`,
                        `Avoid stretching or cooldowns after high-intensity sessions`
                    ],
                    correctIndex: 1,
                    explanation: `Muscles and nervous systems adapt and grow during recovery periods; overtraining leads to burnout and injury.`
                }
            ];
        } else if (domain === 'arts') {
            questions = [
                {
                    id: 1,
                    question: `What is the purpose of visual hierarchy in ${topic} design?`,
                    options: [
                        `To guide the viewer's eye naturally to the most important elements in order of priority`,
                        `To make every single element on the canvas the exact same size and bold color`,
                        `To fill every pixel of whitespace with text and graphics`,
                        `To hide secondary information completely`
                    ],
                    correctIndex: 0,
                    explanation: `Visual hierarchy uses size, contrast, weight, and spacing to communicate the structure of information clearly.`
                },
                {
                    id: 2,
                    question: `Why is maintaining consistent design tokens (colors, typography scales, spacing) crucial in ${topic}?`,
                    options: [
                        `It creates a cohesive brand experience and makes scaling/editing layouts fast and modular`,
                        `It prevents other designers from ever modifying your files`,
                        `It increases the file export size unnecessarily`,
                        `It requires you to use only black and white colors`
                    ],
                    correctIndex: 0,
                    explanation: `Design tokens establish systematic consistency across screens and enable smooth developer handoff.`
                },
                {
                    id: 3,
                    question: `When designing user interfaces or creative assets, how should you validate readability and contrast?`,
                    options: [
                        `Rely solely on personal preference on your own monitor`,
                        `Check WCAG color contrast ratios (minimum 4.5:1 for body text) and test on multiple device screens`,
                        `Use low-contrast gray text on light gray backgrounds for a minimalist look`,
                        `Never show your designs to actual users for feedback`
                    ],
                    correctIndex: 1,
                    explanation: `Following accessibility standards ensures that users under all lighting conditions can read and interact with your design.`
                }
            ];
        } else if (domain === 'language') {
            questions = [
                {
                    id: 1,
                    question: `What is the most effective approach for developing natural conversational fluency in ${topic}?`,
                    options: [
                        `Active speaking immersion with peer conversation partners and immediate feedback`,
                        `Memorizing dictionary words in alphabetical order without speaking`,
                        `Only studying grammar rules without ever listening to native speakers`,
                        `Translating every word literally into your native tongue`
                    ],
                    correctIndex: 0,
                    explanation: `Regular conversational practice trains your brain to formulate thoughts directly in the target language.`
                },
                {
                    id: 2,
                    question: `How does spaced repetition (SRS) help with vocabulary retention in ${topic}?`,
                    options: [
                        `It reviews words right before your brain forgets them, cementing long-term memory`,
                        `It forces you to cram 500 words in one night before a test`,
                        `It prevents you from needing to practice speaking`,
                        `It automatically translates text without learning`
                    ],
                    correctIndex: 0,
                    explanation: `Spaced repetition optimizes review intervals to combat the Ebbinghaus forgetting curve efficiently.`
                },
                {
                    id: 3,
                    question: `When encountering unfamiliar idioms or phrases in ${topic}, what is the best practice?`,
                    options: [
                        `Ignore them and skip the sentence`,
                        `Analyze the cultural context and usage in full sentences rather than literal word-for-word translation`,
                        `Translate each individual word literally with a dictionary`,
                        `Assume the speaker made a grammatical error`
                    ],
                    correctIndex: 1,
                    explanation: `Idioms carry figurative meanings rooted in culture that make sense only in context.`
                }
            ];
        } else if (domain === 'science') {
            questions = [
                {
                    id: 1,
                    question: `What is the most reliable strategy when tackling complex problem sets in ${topic}?`,
                    options: [
                        `Identify knowns and unknowns, draw a diagram or model, and apply first-principles formulas systematically`,
                        `Guess the final numerical answer and work backwards`,
                        `Memorize solutions to past exams and hope identical questions appear`,
                        `Skip writing down intermediate calculation steps`
                    ],
                    correctIndex: 0,
                    explanation: `Breaking down problems into fundamental laws and checking units step-by-step prevents cascading calculation errors.`
                },
                {
                    id: 2,
                    question: `Why is understanding the physical/geometric derivation of formulas better than pure rote memorization in ${topic}?`,
                    options: [
                        `It builds intuition so you can adapt principles to novel exam and research questions`,
                        `It makes homework take longer with no benefit`,
                        `It guarantees you will never need a calculator`,
                        `Formulas never have practical real-world derivations`
                    ],
                    correctIndex: 0,
                    explanation: `Conceptual understanding allows you to tackle unseen variations of problems with confidence.`
                },
                {
                    id: 3,
                    question: `How can peer study sessions on ${topic} accelerate conceptual mastery?`,
                    options: [
                        `Explaining concepts aloud to a peer (the Feynman Technique) exposes gaps in your own understanding`,
                        `Having a peer do all your homework for you`,
                        `Arguing over who finished the problem fastest without discussing methods`,
                        `Studying silently without asking questions`
                    ],
                    correctIndex: 0,
                    explanation: `Teaching a concept to a classmate is the most rigorous test of your own mastery.`
                }
            ];
        } else {
            // General & Programming Topics
            const isTech = domain === 'tech';
            questions = [
                {
                    id: 1,
                    question: `What is the most fundamental concept when getting started with ${topic}?`,
                    options: [
                        isTech ? `Understanding core syntax, control flow, and data structures` : `Building a solid mental model of foundational principles and terminology`,
                        isTech ? `Memorizing every library API without writing code` : `Skipping foundational practice straight to advanced challenges`,
                        isTech ? `Deploying to production on day one without testing` : `Avoiding peer feedback and practice exercises`,
                        isTech ? `Ignoring debugging tools and error logs` : `Working completely in isolation without asking questions`
                    ],
                    correctIndex: 0,
                    explanation: `Mastering core foundational concepts provides the mental scaffolding needed to solve complex real-world problems.`
                },
                {
                    id: 2,
                    question: `What is considered the best practice for peer learning in ${topic}?`,
                    options: [
                        `Passive listening without doing hands-on exercises`,
                        `Active pair-practice with live feedback, questioning, and constructive critique`,
                        `Only reading theoretical cheat sheets`,
                        `Never reviewing mistakes or reviewing past solutions`
                    ],
                    correctIndex: 1,
                    explanation: `Active pair sessions and hands-on exercises produce significantly higher retention and practical competence.`
                },
                {
                    id: 3,
                    question: `When hitting a blocker or confusing challenge in ${topic}, what is the best first step?`,
                    options: [
                        `Abandoning the exercise immediately`,
                        `Isolating the issue, reviewing documentation/examples, and consulting your campus peer tutor`,
                        `Randomly guessing solutions without understanding`,
                        `Ignoring the warning signs or errors`
                    ],
                    correctIndex: 1,
                    explanation: `Systematic troubleshooting and discussing the blocker with your SkillShare mentor is the fastest way to learn.`
                }
            ];
        }

        res.json({
            topic,
            questions
        });

    } catch (error) {
        console.error('Generate quiz error:', error);
        res.status(500).json({ message: 'Failed to generate quiz' });
    }
};

// ─── 5. AI Campus Mentor Chat Copilot ─────────────────────────────
exports.chatMentor = async (req, res) => {
    try {
        const { message, conversationHistory = [] } = req.body;
        if (!message || message.trim() === '') {
            return res.status(400).json({ message: 'Message is required' });
        }

        // Fetch recent active skills & tutors for rich context
        const skillsRes = await db.query(`
            SELECT s.skill_id, s.title, s.category, s.skill_level, s.average_rating, s.total_bookings,
                   u.user_id, u.full_name as tutor, u.department, u.year_of_study, u.email
            FROM skills s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.is_active = true
            ORDER BY s.average_rating DESC, s.total_bookings DESC
        `);
        const availableSkills = skillsRes.rows;

        // Fetch all users for tutor name search
        const usersRes = await db.query(`SELECT user_id, full_name, email, department, year_of_study FROM users`);
        const allUsers = usersRes.rows;

        const client = getGeminiClient();
        if (client) {
            try {
                const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
                
                const systemPrompt = `You are "Aura", the intelligent AI Campus Mentor for SkillShare Hub at our university.
Your role:
- Answer student questions about learning, courses, campus skills, peer tutors, and study strategies.
- Accurately reference real student tutors and skills from our campus database.
- Keep tone encouraging, energetic, concise, and student-friendly. Use emojis appropriately.

Here is the LIVE database of campus tutors and skills:
${availableSkills.map(s => `- "${s.title}" (${s.category}, ${s.skill_level}) taught by ${s.tutor} [Dept: ${s.department || 'Campus'}, Rating: ${s.average_rating}★, Sessions: ${s.total_bookings}]`).join('\n')}

All registered campus users/tutors:
${allUsers.map(u => `- ${u.full_name} (${u.department || 'Student'})`).join('\n')}

Guidelines:
- When a user asks about a specific person (e.g. "how is Saurabh as a mentor"), look up what they teach in the database and give a detailed, helpful summary of their profile, skills, and how to connect with them!
- When a user asks who teaches a specific subject (e.g. "who teaches flute?" or "who teaches guitar?"), list the exact tutor name and category.
- Mention that they can book a 1-on-1 session on the Browse Skills page.`;

                const chat = model.startChat({
                    history: [
                        { role: 'user', parts: [{ text: systemPrompt }] },
                        { role: 'model', parts: [{ text: "Got it! I am Aura, the SkillShare Hub Campus AI Mentor. I have full visibility into campus tutors, skills, and student learning goals. Ready to help!" }] },
                        ...conversationHistory.slice(-8).map(msg => ({
                            role: msg.sender === 'user' ? 'user' : 'model',
                            parts: [{ text: msg.text }]
                        }))
                    ]
                });

                const response = await chat.sendMessage(message);
                const replyText = response.response.text();

                return res.json({
                    reply: replyText,
                    suggestedActions: [
                        "Browse all campus skills",
                        "Generate a 4-week roadmap",
                        "Take a diagnostic quiz"
                    ]
                });
            } catch (err) {
                console.warn('Gemini chat failed, using intelligent database mentor engine:', err.message);
            }
        }

        // ── Enhanced Intelligent Database & NLP Mentor Engine ──
        const lowerMsg = message.toLowerCase().trim();
        let reply = '';
        let suggestedActions = ["Browse Skills", "Generate Roadmap", "Find Tutors"];

        // 1. Check if user is asking about a specific person / tutor (e.g. "how is Saurabh as a mentor", "tell me about Ayush")
        const matchingTutors = allUsers.filter(u => {
            const firstName = u.full_name.split(' ')[0].toLowerCase();
            return firstName.length > 2 && lowerMsg.includes(firstName);
        });

        if (matchingTutors.length > 0) {
            const tutor = matchingTutors[0];
            const tutorSkills = availableSkills.filter(s => s.user_id === tutor.user_id || s.tutor.toLowerCase() === tutor.full_name.toLowerCase());

            if (tutorSkills.length > 0) {
                const skillsList = tutorSkills.map(s => `• **${s.title}** (${s.category} · *${s.skill_level}*)`).join('\n');
                const totalSessions = tutorSkills.reduce((acc, s) => acc + (parseInt(s.total_bookings) || 0), 0);
                const avgRating = tutorSkills.find(s => parseFloat(s.average_rating) > 0)?.average_rating || '5.0';

                reply = `🌟 **${tutor.full_name}** is a peer tutor on SkillShare Hub!

**Offered Skills:**
${skillsList}

📊 **Tutor Stats:** ${totalSessions} sessions completed · Rated ⭐ ${avgRating} / 5.0
🎓 **Department:** ${tutor.department || 'Campus Student'}

You can browse their skill listings on the **Browse Skills** page and click **"Request Session"** to book a 1-on-1 peer learning session! 🤝`;
                suggestedActions = [`Request Session with ${tutor.full_name.split(' ')[0]}`, "Browse All Skills", "Generate Learning Roadmap"];
            } else {
                reply = `👤 **${tutor.full_name}** is registered in our campus community (${tutor.department || 'Student'}). They haven't listed any active skills yet, but you can message them directly through the Messages tab or check the Skills page for other peer tutors! 💬`;
                suggestedActions = ["Browse Skills", "Find Campus Tutors", "Explore Leaderboard"];
            }
        }
        // 2. Check if user is asking for a specific skill (e.g. "who teaches flute?", "can I learn guitar?", "python tutors")
        else {
            const cleanMsg = lowerMsg.replace(/[^\w\s]/g, ' ');
            const words = cleanMsg.split(/\s+/).filter(w => w.length >= 3 && !['who', 'can', 'the', 'and', 'for', 'are', 'you', 'how', 'what', 'teach', 'teaches', 'learning', 'learn'].includes(w));
            
            const matchedSkills = availableSkills.filter(s => {
                const titleLower = (s.title || '').toLowerCase();
                const catLower = (s.category || '').toLowerCase();
                return words.some(w => titleLower.includes(w) || (w.length >= 4 && catLower.includes(w)));
            });

            if (matchedSkills.length > 0) {
                const skillEntries = matchedSkills.slice(0, 4).map(s => 
                    `• **${s.title}** (${s.category} · *${s.skill_level}*) taught by **${s.tutor}** [⭐ ${parseFloat(s.average_rating) > 0 ? s.average_rating : '5.0'}]`
                ).join('\n');

                reply = `🎯 Found campus peer tutors for your request:

${skillEntries}

You can book a 1-on-1 session directly from the **Browse Skills** page or generate a 4-week structured roadmap! 🚀`;
                suggestedActions = [`View ${matchedSkills[0].title}`, "Generate 4-Week Roadmap", "Take Diagnostic Quiz"];
            }
            // 3. Greetings
            else if (/^(hi|hello|hey|yo|greetings|hola|good\s(morning|afternoon|evening))/i.test(lowerMsg)) {
                reply = `Hey there! 👋 I'm **Aura**, your SkillShare Campus AI Mentor. 

I can help you with:
• **Finding peer tutors** on campus (e.g., *"Who teaches Flute or Python?"*)
• **Checking tutor profiles** (e.g., *"How is Saurabh as a mentor?"*)
• **Building a 4-week study roadmap**
• **Testing your readiness with diagnostic quizzes**

What skill or goal are you focusing on today? 🎓`;
                suggestedActions = ["Find Python Tutors", "Explore Music Skills", "How SkillShare Works"];
            }
            // 4. How it works / Booking questions
            else if (lowerMsg.includes('how it work') || lowerMsg.includes('how to book') || lowerMsg.includes('how does it work') || lowerMsg.includes('booking')) {
                reply = `Here is how SkillShare Hub works in 3 easy steps! 🎓

1. **Browse & Discover**: Head to the **Browse Skills** page to search peer tutors by topic, department, or skill level.
2. **Request a Session**: Click **"Request Session"** on any skill card, choose your preferred date & time, and send a message.
3. **Learn & Review**: Meet your peer tutor (in the campus library or online), learn hands-on, and leave a review! 🌟`;
                suggestedActions = ["Browse Skills", "View Leaderboard", "Generate Roadmap"];
            }
            // 5. General Domain Coaching Advice
            else if (domain === 'music') {
                reply = `Music and instruments are amazing skills to share! 🎵 

**Pro-tips for campus music practice:**
• Spend the first 10 minutes on tone warmups, scales, and embouchure/hand posture.
• Practice with a metronome to internalize steady rhythm.
• Book a 1-on-1 session with a campus peer tutor on our Skills page to catch posture mistakes early! 🎸`;
                suggestedActions = ["Explore Music Skills", "Generate Music Roadmap", "Take Music Quiz"];
            } else if (domain === 'sports') {
                reply = `Staying active and mastering athletics or martial arts builds incredible campus discipline! 🥋🏀

**Training tips:**
• Always warm up dynamically to protect joints and prevent sports injuries.
• Focus on fundamental footwork and balance before explosive speed.
• Check out our verified campus sports coaches on the Skills page to practice live drills together! ⚡`;
                suggestedActions = ["Find Sports Tutors", "Generate Fitness Roadmap", "View Leaderboard"];
            } else if (domain === 'arts') {
                reply = `Design and creative arts are in high demand across campus! 🎨

**Design growth advice:**
• Study visual hierarchy, typography scales, and color contrast.
• Build 1-2 polished portfolio projects solving real student problems.
• Ask peer design mentors on SkillShare for real-time design critiques to level up fast! 💻`;
                suggestedActions = ["Explore Design Skills", "Generate Design Roadmap", "Take Design Quiz"];
            } else if (domain === 'tech') {
                reply = `Tech & coding skills are super valuable for campus hackathons and career prep! 💻

**Engineering advice:**
• Build small working prototypes rather than just watching tutorials.
• Learn to read error logs and debug methodically.
• Pair-program with senior student mentors on the Skills page to get unstuck fast! 🚀`;
                suggestedActions = ["Find Tech Tutors", "Generate Coding Roadmap", "Take Coding Quiz"];
            } else {
                reply = `I'm here to guide your learning journey! 💡 You can ask me:
• *"Who teaches flute or martial arts on campus?"*
• *"How is Saurabh or Ayush as a mentor?"*
• *"Generate a 4-week study roadmap for React or Guitar"*
• *"How do I book a peer tutoring session?"*

What would you like to explore? 🚀`;
                suggestedActions = ["Browse All Skills", "Smart Tutor Matchmaker", "Generate Roadmap"];
            }
        }

        res.json({
            reply,
            suggestedActions
        });

    } catch (error) {
        console.error('AI chat mentor error:', error);
        res.status(500).json({ message: 'Failed to chat with AI mentor' });
    }
};
