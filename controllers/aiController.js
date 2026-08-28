const db = require('../config/database');

// Safely initialize Google Generative AI
let GoogleGenerativeAI = null;
try {
    const genai = require('@google/generative-ai');
    GoogleGenerativeAI = genai.GoogleGenerativeAI;
} catch (e) {
    console.log('Using fallback AI engine until API key configured');
}

function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && GoogleGenerativeAI) {
        return new GoogleGenerativeAI(apiKey);
    }
    return null;
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
                    // Hydrate matches with full skill objects
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

        // Heuristic fallback matching
        const searchTerms = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        const scoredSkills = allSkills.map(skill => {
            let score = 50;
            const textToSearch = `${skill.title} ${skill.description} ${skill.category} ${skill.teacher_name} ${skill.skill_level}`.toLowerCase();
            
            searchTerms.forEach(term => {
                if (skill.title.toLowerCase().includes(term)) score += 25;
                if (skill.category.toLowerCase().includes(term)) score += 15;
                if (skill.description.toLowerCase().includes(term)) score += 10;
            });

            if (category && category !== 'all' && skill.category.toLowerCase() === category.toLowerCase()) {
                score += 15;
            }
            if (level && level !== 'all' && skill.skill_level.toLowerCase() === level.toLowerCase()) {
                score += 10;
            }

            score += Math.min(15, (parseFloat(skill.average_rating) || 0) * 3);
            score = Math.min(98, score);

            return {
                ...skill,
                match_score: score,
                reasoning: `Matches your interest in ${skill.title} with experience in ${skill.category} (${skill.skill_level} level).`,
                recommended_focus: `Hands-on fundamentals and real-world campus projects in ${skill.title}.`
            };
        });

        scoredSkills.sort((a, b) => b.match_score - a.match_score);
        const topMatches = scoredSkills.slice(0, 5);

        res.json({
            matches: topMatches,
            aiSummary: `Found ${topMatches.length} campus tutors aligned with "${query}". Connecting with peer tutors gives you personalized 1-on-1 guidance.`,
            suggestedTopics: [
                `Core fundamentals of ${query}`,
                `Common pitfalls and best practices`,
                `Practical hands-on exercise / mini-project`,
                `Recommended resources and exam/interview prep`
            ]
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
                console.warn('Gemini roadmap generation failed, using fallback:', err.message);
            }
        }

        // High quality modular fallback roadmap
        const roadmap = {
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
                    theme: "Core Foundations & Setup",
                    goals: [
                        `Understand fundamental principles of ${topic}`,
                        `Configure the ideal development/learning environment`,
                        `Write/create your first simple baseline exercise`
                    ],
                    keyTopics: [
                        `Introduction & Key Terminology`,
                        `Syntax, Tooling & Core Workflow`,
                        `Deconstructing Beginner-Level Examples`
                    ],
                    practicalTask: `Build a starter prototype or walkthrough exercise demonstrating fundamental mechanics.`,
                    peerSessionAdvice: `Book a 45-min session on SkillShare Hub to review your environment setup and clarify initial syntax doubts.`
                },
                {
                    week: 2,
                    theme: "Deep Dive into Core Patterns & Techniques",
                    goals: [
                        `Master intermediate logic, styling, or performance principles`,
                        `Debug common beginner errors and edge cases`,
                        `Combine multiple modules into a cohesive workflow`
                    ],
                    keyTopics: [
                        `Modular Design & Architecture`,
                        `State, Data Flow, or Composition Patterns`,
                        `Error Handling & Best Practices`
                    ],
                    practicalTask: `Create a multi-feature component or intermediate exercise with responsive behavior.`,
                    peerSessionAdvice: `Pair-program with your tutor on a tricky edge case and ask for code/technique review.`
                },
                {
                    week: 3,
                    theme: "Real-World Application & Integration",
                    goals: [
                        `Integrate external APIs, libraries, or advanced toolsets`,
                        `Refine quality, aesthetics, and user experience`,
                        `Start building the foundational pieces of your capstone project`
                    ],
                    keyTopics: [
                        `Advanced Features & Integration`,
                        `Performance Optimization & Clean Structure`,
                        `Testing & Peer Code Review`
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
                        `Deployment & Portfolio Presentation`,
                        `Answering Technical Interview Questions on ${topic}`,
                        `Next Steps for Continuous Mastery`
                    ],
                    practicalTask: `Ship your complete, polished capstone project and share it with the campus community.`,
                    peerSessionAdvice: `Have your tutor verify your completed project, leave a review, and register your own skill on SkillShare Hub!`
                }
            ],
            capstoneProject: `Interactive ${topic} Campus Showcase: A fully functioning project solving a real student problem, complete with documentation and clean architecture.`,
            recommendedCampusAction: `Book 1 session every week with a verified SkillShare Hub peer tutor to keep yourself accountable and get instant unstuck.`
        };

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

        // Fallback enhancer
        const enhanced = {
            enhancedTitle: `${title} — Hands-on Masterclass for Students`,
            shortDescription: `Join this interactive 1-on-1 peer session to master ${title}. Learn practical concepts through real campus examples, step-by-step guidance, and live problem-solving.`,
            learningOutcomes: [
                `Master foundational principles and modern workflows in ${title}`,
                `Work through hands-on practice problems with immediate feedback`,
                `Learn best practices, productivity shortcuts, and common pitfalls`,
                `Build a mini portfolio exercise you can showcase on campus`
            ],
            prerequisites: `Basic interest in ${category || 'this subject'}. No prior advanced experience required.`,
            suggestedDuration: "1 hour",
            recommendedLocation: "Campus Library / Online (Google Meet)"
        };

        res.json(enhanced);
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
Return ONLY a JSON object:
{
  "topic": "${topic}",
  "questions": [
    {
      "id": 1,
      "question": "Clear question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0, // 0-based index of correct option
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
                console.warn('Gemini quiz generation failed, using fallback:', err.message);
            }
        }

        // Generic fallback quiz
        res.json({
            topic,
            questions: [
                {
                    id: 1,
                    question: `What is the most fundamental concept when getting started with ${topic}?`,
                    options: [
                        `Understanding core syntax, data models, and mental structures`,
                        `Memorizing every API reference without practice`,
                        `Skipping fundamentals straight to production deployment`,
                        `Avoiding peer review and documentation`
                    ],
                    correctIndex: 0,
                    explanation: `Building a solid mental model of foundational syntax and workflows allows you to debug and scale effectively.`
                },
                {
                    id: 2,
                    question: `What is considered the best practice for peer learning in ${topic}?`,
                    options: [
                        `Passive listening without coding or doing exercises`,
                        `Active pair-practice with live feedback and questioning`,
                        `Only reviewing theoretical cheat sheets`,
                        `Working completely in isolation`
                    ],
                    correctIndex: 1,
                    explanation: `Active pair sessions and hands-on exercises produce 3x higher retention and practical competence.`
                },
                {
                    id: 3,
                    question: `When hitting a blocker or bug in ${topic}, what is the best first step?`,
                    options: [
                        `Abandoning the project immediately`,
                        `Isolating the issue, reviewing logs/error messages, and consulting your tutor`,
                        `Randomly modifying configuration parameters`,
                        `Ignoring the warning messages`
                    ],
                    correctIndex: 1,
                    explanation: `Systematic debugging and discussing the problem with your SkillShare mentor is the fastest way to learn.`
                }
            ]
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

        // Fetch recent active skills for context
        const skillsRes = await db.query(`
            SELECT s.skill_id, s.title, s.category, s.skill_level, u.full_name as tutor
            FROM skills s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.is_active = true
            LIMIT 15
        `);
        const availableSkills = skillsRes.rows;

        const client = getGeminiClient();
        if (client) {
            try {
                const model = client.getGenerativeModel({ model: 'gemini-1.5-flash' });
                
                const systemPrompt = `You are "Aura", the intelligent AI Campus Mentor for SkillShare Hub.
Your role:
- Help college students discover the right skills to learn.
- Connect students with peer tutors on campus.
- Offer actionable study tips, roadmaps, and session prep advice.
- Keep tone encouraging, energetic, concise, and student-friendly. Use emojis appropriately.

Available campus tutors and skills right now:
${availableSkills.map(s => `- "${s.title}" (${s.category}, ${s.skill_level}) taught by ${s.tutor} [ID: ${s.skill_id}]`).join('\n')}

If recommending a skill, mention the tutor by name and suggest booking a session on the Skills page!`;

                const chat = model.startChat({
                    history: [
                        { role: 'user', parts: [{ text: systemPrompt }] },
                        { role: 'model', parts: [{ text: "Got it! I am Aura, the SkillShare Hub Campus AI Mentor. Ready to help students excel!" }] },
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
                console.warn('Gemini chat failed, using fallback:', err.message);
            }
        }

        // Heuristic chat fallback
        const lowerMsg = message.toLowerCase();
        let reply = `Hey there! 🎓 As your Campus AI Mentor, I'm here to help you accelerate your learning on campus.`;
        let suggestedActions = ["Browse Skills", "Generate Roadmap", "Find Tutors"];

        if (lowerMsg.includes('python') || lowerMsg.includes('coding') || lowerMsg.includes('programming') || lowerMsg.includes('react') || lowerMsg.includes('web')) {
            reply = `Awesome choice! 💻 We have great student developers teaching web development, Python, and data structures. I recommend starting with a hands-on project and booking a 45-minute peer session on the Skills page to get your environment setup!`;
            suggestedActions = ["Explore Tech Skills", "Create Coding Roadmap", "Take Python Quiz"];
        } else if (lowerMsg.includes('exam') || lowerMsg.includes('study') || lowerMsg.includes('notes') || lowerMsg.includes('help')) {
            reply = `Exam season prep? 📚 You can connect with senior students who previously took your courses. Check out the Leaderboard to find the top-rated tutors in your department!`;
            suggestedActions = ["View Leaderboard", "Search Department Skills", "Book Session"];
        } else if (lowerMsg.includes('design') || lowerMsg.includes('ui') || lowerMsg.includes('ux') || lowerMsg.includes('figma')) {
            reply = `UI/UX and creative design are super in-demand! 🎨 Check out our Arts & Design category for Figma, poster design, and 3D modeling tutors.`;
            suggestedActions = ["Explore Design Skills", "Generate Design Roadmap", "Find Designers"];
        } else {
            reply = `I can help you build a personalized study roadmap, match you with top campus tutors, or practice with quick diagnostic quizzes. What skill or goal are you focusing on this semester? 🚀`;
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
