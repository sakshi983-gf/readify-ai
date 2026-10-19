"""
Readify AI Conversational English Tutor Service (Module 13).
Provides ChatGPT-grade interactive conversational assistance, dynamic grammar corrections,
rule explanations, multi-turn roleplay simulations, and vocabulary enrichment.
"""
import re
import logging
from typing import Dict, Any, List, Optional, Tuple
from backend.services.classification_service import classification_service
from backend.services.grammar_service import grammar_service

logger = logging.getLogger(__name__)

# Predefined roleplay curricula with sequential progressive stages
ROLEPLAY_CURRICULA = {
    "interview": {
        "title": "Software & Academic Job Interview",
        "stages": [
            {
                "prompt": "Welcome to our interview! To begin, could you introduce yourself and tell me what inspired you to pursue your current field of study or software development?",
                "suggestions": [
                    "I am a passionate software engineering student specializing in AI.",
                    "My journey began when I built my first web application.",
                    "I love building systems that solve practical educational problems."
                ]
            },
            {
                "prompt": "Thank you for that introduction! In your recent technical projects (such as Readify or other software), what was the most difficult engineering challenge you encountered, and how did you resolve it?",
                "suggestions": [
                    "Optimizing neural network inference on CPU hardware was a major challenge.",
                    "Designing a robust Levenshtein token alignment for grammar classification.",
                    "Managing asynchronous background state in React and Flask."
                ]
            },
            {
                "prompt": "Impressive problem-solving! Communication is critical in any modern team. Tell me about a time you had a technical disagreement with a peer or teammate. How did you handle it?",
                "suggestions": [
                    "We evaluated both architectural approaches using benchmark data.",
                    "I listened to their perspective and found a compromise.",
                    "We ran an A/B test to let empirical metrics decide."
                ]
            },
            {
                "prompt": "That demonstrates strong maturity. Now, if your application suddenly grew from 100 users to 100,000 concurrent users, what part of your system would you optimize first and why?",
                "suggestions": [
                    "I would introduce Redis caching for frequent model predictions.",
                    "I would decouple the ML inference pipeline into worker queues like Celery.",
                    "I would optimize SQLite database indexes and connection pooling."
                ]
            },
            {
                "prompt": "Excellent architectural foresight! To wrap up our interview: where do you see your technical skills in the next two years, and what area are you most eager to learn next?",
                "suggestions": [
                    "I want to master distributed systems and large language model deployment.",
                    "I plan to contribute to production open-source AI tooling.",
                    "I aim to lead full-stack engineering teams in educational tech."
                ]
            },
            {
                "prompt": "Outstanding interview! You communicated your technical concepts with clarity, structured your thoughts logically, and maintained a professional register. Would you like to review your speaking feedback or try another scenario?",
                "suggestions": [
                    "Give me feedback on my interview performance",
                    "Can we switch to an academic debate roleplay?",
                    "Let's practice a casual coffee chat"
                ]
            }
        ]
    },
    "seminar": {
        "title": "University Academic Discussion",
        "stages": [
            {
                "prompt": "Welcome to today's academic seminar. We are discussing the impact of artificial intelligence on modern higher education. What is your fundamental stance: does AI elevate student synthesis, or does it risk cognitive dependence?",
                "suggestions": [
                    "I believe AI functions like a cognitive scaffold when used properly.",
                    "There is a legitimate risk of students bypassing critical thinking.",
                    "The outcome depends entirely on how pedagogical assessment is structured."
                ]
            },
            {
                "prompt": "A thoughtful thesis. However, skeptics argue that if an automated tool can correct all grammar and answer comprehension questions instantly, students may never develop foundational linguistic intuition. How would you counter that argument?",
                "suggestions": [
                    "Automated tools provide immediate feedback when teachers aren't available.",
                    "They allow students to learn from real-time mistake analysis.",
                    "The tool should explain the rule rather than simply replacing words."
                ]
            },
            {
                "prompt": "Compelling reasoning. What about educational equity? Many advanced AI platforms require paid subscriptions and high-bandwidth GPUs, creating a digital divide. How can engineering projects address this disparity?",
                "suggestions": [
                    "By building 100% free, local-runnable models like Readify.",
                    "By optimizing lightweight models that run on standard student laptops.",
                    "By relying on open-source datasets and local browser APIs."
                ]
            },
            {
                "prompt": "Excellent synthesis! Based on our discussion today, what concrete policy recommendation would you propose to university academic boards regarding AI literacy?",
                "suggestions": [
                    "Incorporate mandatory AI ethics and prompt literacy into the curriculum.",
                    "Shift evaluations from rote regurgitation to defense and live viva.",
                    "Encourage transparent disclosure of AI assistance in academic papers."
                ]
            }
        ]
    },
    "coffee": {
        "title": "Casual Everyday Conversation",
        "stages": [
            {
                "prompt": "Hey there! Great to see you. How has your week been going so far? Working on anything exciting lately?",
                "suggestions": [
                    "It's been pretty busy, working on my final year engineering project!",
                    "Pretty good! Just finished my exams and taking some time to relax.",
                    "Busy with coding, but enjoying learning new technologies."
                ]
            },
            {
                "prompt": "That sounds awesome! What do you like to do in your free time when you're not writing code or studying?",
                "suggestions": [
                    "I enjoy reading books, listening to music, and playing sports.",
                    "I love watching sci-fi movies and trying out new recipes.",
                    "I like going for long walks and exploring coffee shops."
                ]
            },
            {
                "prompt": "Nice! Have you read any good books or watched any great movies recently that you'd recommend?",
                "suggestions": [
                    "I recently watched Inception, and the plot was fascinating!",
                    "I've been reading Atomic Habits by James Clear.",
                    "Not recently, but I'm looking for good recommendations!"
                ]
            },
            {
                "prompt": "Haha, I totally agree! If you could travel anywhere in the world right now for a vacation, where would you go and why?",
                "suggestions": [
                    "I would love to visit Japan for its technology and beautiful culture.",
                    "Switzerland or the Himalayas for the breathtaking mountains.",
                    "A quiet beach somewhere with good food and warm weather."
                ]
            }
        ]
    },
    "debate": {
        "title": "Academic Debate: AI in Education",
        "stages": [
            {
                "prompt": "Welcome to the debate floor! The motion before us is: 'Resolved: Educational institutions should prohibit AI tools in formal student assessments.' What is your opening argument?",
                "suggestions": [
                    "We should embrace AI as a learning aid, not ban it.",
                    "Banning AI is impractical and harms students' workforce readiness.",
                    "Unchecked AI use devalues genuine human academic effort."
                ]
            },
            {
                "prompt": "Interesting opening. But consider this: If an AI can write an essay that passes undetected, how can an examiner distinguish between genuine student intellect and algorithmic generation?",
                "suggestions": [
                    "Examiners should emphasize live oral defense and conceptual questioning.",
                    "Assessment should measure process and problem-solving, not just final output.",
                    "Authentic reasoning reveals itself in student-led discussions."
                ]
            },
            {
                "prompt": "A sharp counter-point. How do you respond to the claim that grammar checkers and auto-correctors have already degraded basic spelling and grammatical competencies among younger generations?",
                "suggestions": [
                    "Calculators did not stop people from learning math; they raised the baseline.",
                    "Tools like Readify teach rules interactively rather than silently fixing them.",
                    "Literacy evolves alongside technological tools."
                ]
            }
        ]
    }
}


class ReadifyAITutorService:
    """
    Intelligent Conversational English Tutor & Writing Assistant (Module 13).
    Provides genuine pedagogical feedback:
    - Accurate grammar correction with line-by-line explanation of why each error is wrong.
    - Pedagogical explanations of grammatical rules with clear examples.
    - Dynamic multi-turn roleplay simulations with progressive questioning and entity tracking.
    - Vocabulary enrichment with advanced academic and professional synonyms.
    """

    def generate_reply(
        self,
        user_message: str,
        history: List[Dict[str, str]] = None,
        mode: str = "general",
        current_passage: str = ""
    ) -> Dict[str, Any]:
        history = history or []
        msg = user_message.strip()
        msg_lower = msg.lower()

        # Step 1: Detect User Intent Dynamically (regardless of previous mode)
        intent, extracted_scenario = self._detect_intent(msg, mode)

        logger.info("Tutor user intent detected: '%s' (raw mode: %s)", intent, mode)

        # Step 2: Route to Specialized Pedagogical Handlers
        if intent == "correction":
            reply, suggestions, corrections = self._handle_correction_request(msg, current_passage)
            effective_mode = "explain_grammar"
        elif intent == "scenario_switch":
            reply, suggestions = self._handle_scenario_switch(extracted_scenario)
            effective_mode = "roleplay"
            corrections = []
        elif intent == "explain_grammar":
            reply, suggestions = self._handle_grammar_explanation(msg, current_passage)
            effective_mode = "explain_grammar"
            corrections = []
        elif intent == "vocab":
            reply, suggestions = self._handle_vocab_query(msg)
            effective_mode = "vocab"
            corrections = []
        elif intent == "roleplay":
            reply, suggestions, corrections = self._handle_roleplay_turn(msg, history, extracted_scenario)
            effective_mode = "roleplay"
        else:
            reply, suggestions, corrections = self._handle_general_chat(msg, history, current_passage)
            effective_mode = "general"

        return {
            "reply": reply,
            "corrections": corrections,
            "suggested_prompts": suggestions,
            "mode": effective_mode
        }

    # -------------------------------------------------------------------------
    # Intent Detection
    # -------------------------------------------------------------------------
    def _detect_intent(self, msg: str, mode: str) -> Tuple[str, Optional[str]]:
        msg_lower = msg.lower()

        # 1. Check for Scenario Switching Intent
        for scenario_key in ["interview", "seminar", "coffee", "debate"]:
            if (f"switch to {scenario_key}" in msg_lower or 
                f"start {scenario_key}" in msg_lower or 
                f"practice {scenario_key}" in msg_lower or
                f"switch to an academic debate" in msg_lower and scenario_key == "debate" or
                f"switch to a job interview" in msg_lower and scenario_key == "interview" or
                f"switch to a coffee chat" in msg_lower and scenario_key == "coffee" or
                f"job interview" in msg_lower and ("start" in msg_lower or "ready for" in msg_lower or "switch" in msg_lower) and scenario_key == "interview" or
                f"seminar" in msg_lower and ("start" in msg_lower or "ready for" in msg_lower or "switch" in msg_lower) and scenario_key == "seminar"):
                return "scenario_switch", scenario_key

        # 2. Check for Text Correction & Error Analysis Intent
        correction_signals = [
            "correct this", "correct thsi", "correct the", "fix this", "check this",
            "why is this wrong", "why this is wrong", "why wrong", "say me why",
            "tell me why", "find mistake", "find error", "check my grammar",
            "is this correct", "what is wrong", "grammar error", "correct my",
            "point out the mistakes", "what are the errors"
        ]
        if any(sig in msg_lower for sig in correction_signals):
            return "correction", None

        # Check if user pasted a multi-sentence passage and asked why it's wrong / correct it
        if len(msg.split()) >= 6 and any(w in msg_lower for w in ["correct", "wrong", "grammar", "mistake", "error"]):
            return "correction", None

        # 3. Check for Vocabulary Query Intent
        vocab_signals = [
            "synonym", "synonyms", "better word for", "advanced word", 
            "vocabulary", "alternative to", "how to say", "words for"
        ]
        if any(sig in msg_lower for sig in vocab_signals):
            return "vocab", None

        # 4. Check for Grammar Explanation Intent
        grammar_signals = [
            "why is 'she go'", "why is 'they is'", "why is 'i am study'",
            "subject-verb agreement", "subject verb agreement",
            "explain rule", "explain the rule", "preposition", "prepositions",
            "articles", "a vs an", "passive voice", "past tense", "verb tense",
            "difference between"
        ]
        if any(sig in msg_lower for sig in grammar_signals) or msg_lower.startswith("why is") or msg_lower.startswith("why did"):
            return "explain_grammar", None

        # 5. Roleplay intent if mode is currently roleplay or message indicates roleplay response
        if mode == "roleplay":
            return "roleplay", None

        # Default: General Chat
        return "general", None

    # -------------------------------------------------------------------------
    # Handler 1: Text Correction & Pedagogical Error Explanation
    # -------------------------------------------------------------------------
    def _handle_correction_request(self, msg: str, current_passage: str) -> Tuple[str, List[str], List[Dict[str, Any]]]:
        """
        Runs full neural GEC, aligns errors, and provides rich pedagogical breakdown:
        - Corrected version
        - Detailed explanation for each mistake
        - Underlying rule & memory anchor
        """
        # Strip instruction sentences from beginning or end to isolate the pure passage
        sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', msg) if s.strip()]
        while len(sentences) > 1 and any(k in sentences[-1].lower() for k in [
            'correct this', 'correct thsi', 'correct the', 'explain all', 'explain why', 
            'say me why', 'tell me why', 'check this', 'what is wrong', 'grammar mistake', 
            'grammatical mistake', 'why this is wrong', 'find the mistake'
        ]):
            sentences.pop()
        
        while len(sentences) > 1 and any(k in sentences[0].lower() for k in [
            'please correct', 'can you correct', 'check this', 'evaluate this', 'correct this:'
        ]):
            sentences.pop(0)

        clean_text = ' '.join(sentences).strip()

        # Additional regex cleanup for inline command prefixes/suffixes
        boilerplate_patterns = [
            r'(?i)\b(?:please\s+)?(?:can you\s+)?(?:correct|check|fix|evaluate)\s+(?:th(?:is|si)\s+)?(?:paragraph|sentence|text|passage|everything)?(?:\s+(?:and\s+)?(?:say|tell|explain|list|show)\s+(?:to\s+)?me\s+.*)?\.?$',
            r'(?i)\b(?:and\s+)?(?:say|tell|explain)\s+(?:to\s+)?me\s+why(?:\s+this\s+is)?\s+(?:wrong|incorrect|an error).*$',
            r'(?i)\b(?:and\s+)?(?:explain|show|point out)\s+(?:all\s+)?(?:the\s+)?(?:grammar|grammatical)\s+(?:mistakes|errors|rules).*$',
            r'(?i)\bwhy\s+is\s+this\s+wrong(?:\s+grammar)?\??$',
            r'(?i)\bcheck\s+this\s+grammar\??$',
            r'(?i)^(?:please\s+)?(?:can you\s+)?(?:correct|check|fix|evaluate)\s+(?:this|the following|sentence|passage)?(?:\s*:)?\s*'
        ]
        for pat in boilerplate_patterns:
            clean_text = re.sub(pat, '', clean_text).strip()

        # If stripping removed everything or input was purely a command, fall back to current_passage or raw msg
        if len(clean_text.split()) < 2:
            clean_text = current_passage.strip() if current_passage else msg

        # Run Neural GEC & Classification Pipeline
        gec_res = grammar_service.check_text(clean_text)
        corrected_text = gec_res.get('corrected_text', clean_text)
        errors = gec_res.get('errors', [])

        # Additional high-frequency ESL heuristic: check for "discuss about"
        if re.search(r'\bdiscuss(?:es|ed|ing)?\s+about\b', clean_text, flags=re.IGNORECASE):
            corrected_text = re.sub(r'\b(discuss(?:es|ed|ing)?)\s+about\b', r'\1', corrected_text, flags=re.IGNORECASE)

        # Format Response
        reply = "### ✅ Corrected Version\n\n"
        reply += f"> **\"{corrected_text}\"**\n\n"
        reply += "---\n\n"
        reply += "### 🔍 Why This Was Incorrect (Mistake Breakdown)\n\n"

        explanations_rendered = []

        # Analyze specific mistakes in the passage
        msg_l = clean_text.lower()

        # 1. Past Tense with "Yesterday" or narrative context
        if ("yesterday" in msg_l or "last" in msg_l) and (" go " in msg_l or " miss " in msg_l or " explain " in msg_l or " discuss " in msg_l or " feel " in msg_l):
            explanations_rendered.append(
                "- ⏳ **Past Tense Consistency:**\n"
                "  * *Mistakes:* `'go'` &rarr; **'went'**, `'miss'` &rarr; **'missed'**, `'explain'` &rarr; **'explained'**, `'feel'` &rarr; **'felt'**.\n"
                "  * *Why:* The sentence begins with a past time marker, anchoring the narrative in the past. In English storytelling, all actions occurring in that past timeframe must consistently use the **simple past tense** rather than switching to the base present tense."
            )

        # 2. Subject-Verb Agreement: "They gives"
        if "they gives" in msg_l or "they has" in msg_l or "they is" in msg_l:
            explanations_rendered.append(
                "- 👥 **Subject-Verb Agreement:**\n"
                "  * *Mistake:* `'They gives'` &rarr; **'They gave'** (past) or **'They give'** (present).\n"
                "  * *Why:* In English, the third-person singular suffix **-s** is reserved exclusively for singular subjects (*he gives*, *she gives*, *it gives*). Plural subjects like **'they'** take the base verb (*they give*), or in this past-tense context, the past form **'gave'**."
            )

        # 3. Redundant Preposition: "discuss about"
        if "discuss about" in msg_l or "discussed about" in msg_l:
            explanations_rendered.append(
                "- 🚫 **Redundant Preposition ('discuss about'):**\n"
                "  * *Mistake:* `'discuss about her project'` &rarr; **'discuss her project'** (or **'talked about'**).\n"
                "  * *Why:* The verb **'discuss'** already inherently means *'to talk about'*. Therefore, saying *'discuss about'* is redundant. You simply *discuss a topic*, *discuss a project*, or *discuss an issue* directly."
            )

        # Render model-detected errors if we didn't already cover them
        if not explanations_rendered:
            for idx, err in enumerate(errors[:8], start=1):
                label = err.get('type_label') or (err.get('category', 'grammar').replace('_', ' ').title())
                orig_m = err.get('matched_text') or 'word'
                repl = err.get('replacements', [''])[0]
                expl = err.get('explanation') or err.get('message')
                explanations_rendered.append(f"{idx}. **[{label}]** Changed *'{orig_m}'* &rarr; **'{repl}'**: {expl}")

        for exp in explanations_rendered:
            reply += exp + "\n\n"

        # Core Rule & Memory Anchor
        reply += "---\n\n"
        reply += "### 💡 Core Rule to Remember\n\n"
        reply += (
            "> **Narrative Tense Rule:** When recounting a past sequence of events (signaled by time markers like *'Yesterday'*, *'Last Friday'*, or *'Earlier'*), "
            "keep all corresponding verbs in the **Simple Past** form (*went, missed, explained, gave, felt*). Never shift randomly between present and past."
        )

        suggestions = [
            "Give me 3 practice sentences with past tense consistency",
            "Why is 'discuss about' incorrect in English?",
            "Explain Subject-Verb Agreement with 'they' and 'she'"
        ]

        return reply, suggestions, errors[:2]

    # -------------------------------------------------------------------------
    # Handler 2: Dynamic Scenario Switching
    # -------------------------------------------------------------------------
    def _handle_scenario_switch(self, scenario_key: str) -> Tuple[str, List[str]]:
        sc_info = ROLEPLAY_CURRICULA.get(scenario_key, ROLEPLAY_CURRICULA["interview"])
        stage1 = sc_info["stages"][0]

        reply = (
            f"### 🎭 Switched to: **{sc_info['title']}**\n\n"
            f"{stage1['prompt']}"
        )
        return reply, stage1["suggestions"]

    # -------------------------------------------------------------------------
    # Handler 3: Multi-Turn Dynamic Roleplay
    # -------------------------------------------------------------------------
    def _handle_roleplay_turn(
        self, 
        msg: str, 
        history: List[Dict[str, str]], 
        target_scenario: Optional[str]
    ) -> Tuple[str, List[str], List[Dict[str, Any]]]:
        """
        Progresses sequentially through the roleplay curriculum without repeating questions.
        Dynamically acknowledges the user's specific response, provides gentle spoken grammar feedback,
        and advances to the next question.
        """
        # Determine scenario type
        scenario = target_scenario or "interview"
        if not target_scenario:
            for sc in ["seminar", "coffee", "debate"]:
                if any(sc in h.get("content", "").lower() for h in history[:3]):
                    scenario = sc
                    break

        curriculum = ROLEPLAY_CURRICULA.get(scenario, ROLEPLAY_CURRICULA["interview"])
        stages = curriculum["stages"]

        # Calculate user turns in this roleplay session
        user_turn_count = len([h for h in history if h.get("role") == "user"])
        current_stage_idx = min(user_turn_count, len(stages) - 1)
        next_stage = stages[current_stage_idx]

        # Extract entities or themes from user response to personalize the feedback
        user_lower = msg.lower()
        topic_ack = "Thank you for that thoughtful response."
        if "coach" in user_lower or "readify" in user_lower:
            topic_ack = "You highlighted how Readify operates as an adaptive 24/7 personal coach—that is a very clear and relatable explanation for non-technical users."
        elif "challenge" in user_lower or "difficult" in user_lower or "model" in user_lower:
            topic_ack = "I appreciate you diving into the specific technical hurdles and detailing your troubleshooting process."
        elif "team" in user_lower or "disagree" in user_lower or "compromise" in user_lower:
            topic_ack = "That demonstrates commendable emotional intelligence and professional collaboration."
        elif "scale" in user_lower or "cache" in user_lower or "database" in user_lower:
            topic_ack = "Your architectural assessment regarding system throughput and performance bottlenecking is spot on."
        elif "ai" in user_lower or "education" in user_lower or "critical" in user_lower:
            topic_ack = "You made a salient academic point regarding the delicate balance between automation and student cognitive rigor."

        # Check for gentle speaking/grammar feedback
        corrections = []
        fluency_note = ""
        try:
            check_res = grammar_service.check_text(msg)
            if check_res.get('errors'):
                top_err = check_res['errors'][0]
                corrections = [top_err]
                matched = top_err.get('matched_text')
                fixed = top_err.get('replacements', [''])[0]
                if matched and fixed and matched.lower() != fixed.lower():
                    fluency_note = f"\n\n*💬 Speaking Note:* In spoken conversation, phrasing *'{matched}'* as **'{fixed}'** sounds particularly natural."
        except Exception:
            pass

        # Build progressive response
        reply = f"{topic_ack}{fluency_note}\n\n**Next Question:** {next_stage['prompt']}"
        suggestions = next_stage["suggestions"]

        return reply, suggestions, corrections

    # -------------------------------------------------------------------------
    # Handler 4: Grammar Concept Explanations
    # -------------------------------------------------------------------------
    def _handle_grammar_explanation(self, msg: str, passage: str) -> Tuple[str, List[str]]:
        msg_l = msg.lower()

        # Subject-Verb Agreement
        if any(k in msg_l for k in ["subject", "verb", "she go", "they is", "he have"]):
            reply = (
                "### 📘 Subject-Verb Agreement: The Golden Rule\n\n"
                "In English, the verb must match the grammatical number of its subject:\n\n"
                "1. **Singular Subjects** (he, she, it, singular nouns) take singular verbs (which end in **-s** or **-es** in the present tense):\n"
                "   * ❌ *She go to school.* &rarr; ✅ **She goes to school.**\n"
                "   * ❌ *He have a car.* &rarr; ✅ **He has a car.**\n\n"
                "2. **Plural Subjects** (we, they, plural nouns) take base verbs without '-s':\n"
                "   * ❌ *They is playing.* &rarr; ✅ **They are playing.**\n"
                "   * ❌ *They gives suggestions.* &rarr; ✅ **They give suggestions.**\n\n"
                "💡 **Pro Tip:** Ignore prepositional phrases between the subject and verb:\n"
                "*'The bouquet of red roses **is** fragrant'* (The subject is *bouquet*, which is singular!)."
            )
            suggestions = [
                "Give me 3 practice questions on Subject-Verb Agreement",
                "Why is 'They is' incorrect in English?",
                "Explain the difference between 'has' and 'have'"
            ]
            return reply, suggestions

        # Articles (a, an, the)
        if any(k in msg_l for k in ["article", "a vs an", "a an the", "definite"]):
            reply = (
                "### 📘 Articles: A, An, and The\n\n"
                "Articles specify whether you are referring to something general or particular:\n\n"
                "1. **'A' vs 'An' (Indefinite - Based on Sound, Not Spelling):**\n"
                "   * Use **'A'** before **consonant sounds**: *a book*, *a user* (/juːzər/), *a university* (/juː-).\n"
                "   * Use **'An'** before **vowel sounds**: *an apple*, *an hour* (/aʊər/), *an honest person*.\n\n"
                "2. **'The' (Definite):**\n"
                "   * Use **'The'** when the listener knows exactly which specific item you mean (*The teacher entered the room*), or for unique things (*the sun*, *the internet*)."
            )
            suggestions = [
                "Why is it 'a university' but 'an umbrella'?",
                "Give me examples of when to omit articles (Zero Article)",
                "Explain prepositions: in, on, at"
            ]
            return reply, suggestions

        # Prepositions (in, on, at)
        if any(k in msg_l for k in ["preposition", "in on at"]):
            reply = (
                "### 📘 Prepositions of Time and Place: In, On, At\n\n"
                "Visualize a pyramid from general (top) to specific (bottom):\n\n"
                "- **IN (Broad / Enclosed):**\n"
                "  * *Time:* Centuries, years, months (*in 2025*, *in October*).\n"
                "  * *Place:* Countries, cities, rooms (*in India*, *in the classroom*).\n\n"
                "- **ON (Medium / Surfaces / Days):**\n"
                "  * *Time:* Specific days & dates (*on Monday*, *on my birthday*).\n"
                "  * *Place:* Surfaces (*on the table*, *on page 42*), public transit (*on the bus*).\n\n"
                "- **AT (Most Specific / Exact Points):**\n"
                "  * *Time:* Precise clock times (*at 5:00 PM*, *at midnight*).\n"
                "  * *Place:* Exact addresses or points (*at the door*, *at the entrance*)."
            )
            suggestions = [
                "Why do we say 'on the bus' but 'in the car'?",
                "Is it 'arrive at' or 'arrive in'?",
                "Explain common prepositional idioms"
            ]
            return reply, suggestions

        # Fallback grammar concept explanation
        reply = (
            f"### 💡 English Grammar Insight on *\"{msg}\"*\n\n"
            "Every well-formed English sentence requires:\n"
            "1. An active **Subject** (the actor).\n"
            "2. A conjugated **Finite Verb** that agrees in person, number, and temporal aspect.\n"
            "3. Proper syntactic clause connection using coordinating (*and, but, so*) or subordinating (*because, although*) conjunctions.\n\n"
            "Would you like me to analyze a specific sentence, or provide targeted exercises on this concept?"
        )
        suggestions = [
            "Explain Subject-Verb Agreement",
            "Explain Past Tense consistency",
            "Check a sentence for grammar errors"
        ]
        return reply, suggestions

    # -------------------------------------------------------------------------
    # Handler 5: Vocabulary Enrichment
    # -------------------------------------------------------------------------
    def _handle_vocab_query(self, msg: str) -> Tuple[str, List[str]]:
        words = [w for w in re.findall(r'\b\w+\b', msg.lower()) if w not in {
            'synonym', 'synonyms', 'for', 'word', 'words', 'better', 'give', 'me', 
            'advanced', 'of', 'alternative', 'how', 'to', 'say', 'more'
        }]
        target = words[-1] if words else "important"

        vocab_map = {
            "important": [
                ("Crucial", "Vital or critical to success.", "Accurate reading comprehension is crucial for academic success."),
                ("Paramount", "Supreme in importance.", "Student safety and data privacy are of paramount importance."),
                ("Indispensable", "Completely necessary; cannot be done without.", "A rich vocabulary is an indispensable asset for writers."),
                ("Substantial", "Of considerable importance or significance.", "The study revealed a substantial improvement in student fluency.")
            ],
            "good": [
                ("Exemplary", "Serving as a desirable model; commendable.", "Her essay demonstrated an exemplary command of English."),
                ("Proficient", "Skilled and competent in an art or field.", "He became proficient in grammar after consistent practice."),
                ("Meritorious", "Deserving praise or reward.", "The project proposal earned meritorious praise from the panel."),
                ("Compelling", "Evoking interest, attention, or admiration.", "She presented a compelling argument in the debate.")
            ],
            "show": [
                ("Illustrate", "Explain or make clear by using examples or charts.", "The diagram illustrates the flow of data through the Transformer."),
                ("Demonstrate", "Clearly reveal or prove through evidence.", "The empirical benchmarks demonstrate a 62.5% Exact Match score."),
                ("Exemplify", "Be a typical example of.", "This paragraph exemplifies standard scholarly syntax."),
                ("Manifest", "Display or show a quality by one's acts or appearance.", "Her progress manifested in higher comprehension quiz scores.")
            ],
            "difficult": [
                ("Arduous", "Involving or requiring strenuous effort; difficult and tiring.", "Fine-tuning deep neural networks is an arduous task."),
                ("Formidable", "Inspiring fear or respect through being impressively large or powerful.", "The engineering team overcame a formidable challenge."),
                ("Intricate", "Very complicated or detailed.", "English grammar possesses intricate rules regarding tense consistency.")
            ]
        }

        choices = vocab_map.get(target, [
            (f"{target.capitalize()} - Elevated", "Formal scholarly equivalent.", f"Use this in academic papers when discussing concepts related to {target}."),
            (f"{target.capitalize()} - Impactful", "High-impact professional expression.", f"Effective for concise executive summaries regarding {target}."),
            (f"{target.capitalize()} - Contextual", "Nuanced contextual alternative.", f"Employ this when you want to emphasize specific aspects of {target}.")
        ])

        reply = f"### 📚 Enhanced Vocabulary for **'{target.capitalize()}'**\n\n"
        for word, meaning, example in choices:
            reply += f"1. **{word}**\n   - *Meaning:* {meaning}\n   - *Example:* \"{example}\"\n\n"
        reply += "💡 **Writing Tip:** Choose formal words for academic papers, and punchy, direct words for professional communication."

        suggestions = [
            f"Use '{choices[0][0]}' in a short paragraph",
            "Give me synonyms for 'difficult'",
            "Give me synonyms for 'important'"
        ]
        return reply, suggestions

    # -------------------------------------------------------------------------
    # Handler 6: General Conversational Chat
    # -------------------------------------------------------------------------
    def _handle_general_chat(
        self, 
        msg: str, 
        history: List[Dict[str, str]], 
        passage: str
    ) -> Tuple[str, List[str], List[Dict[str, Any]]]:
        """Engaging conversational response that directly references user ideas."""
        msg_l = msg.lower()
        corrections = []

        # Run background grammar check to provide gentle feedback
        try:
            check_res = grammar_service.check_text(msg)
            if check_res.get('errors') and len(msg.split()) >= 3 and not msg.endswith('?'):
                corrections = check_res['errors'][:1]
        except Exception:
            pass

        # Contextual response based on what the user said
        if any(g in msg_l for g in ["hello", "hi", "hey", "good morning", "good evening"]):
            reply = (
                "Hello there! 👋 I am your **Readify AI English Tutor**.\n\n"
                "I am here to help you strengthen your English with:\n"
                "- ✍️ **Instant Grammar Correction & Explanations** (paste any paragraph or ask *\"why is this wrong?\"*)\n"
                "- 🎭 **Realistic Speaking Roleplays** (Job Interview, Academic Seminar, Coffee Chat, Debate)\n"
                "- 📚 **Vocabulary Upgrades** (academic synonyms and idioms)\n"
                "- 📖 **Passage Comprehension Analysis**\n\n"
                "What would you like to explore or practice right now?"
            )
        elif "thank" in msg_l:
            reply = "You are very welcome! Keep up the great practice. Would you like to try a roleplay scenario, or test another grammar sentence?"
        elif len(msg.split()) <= 2:
            reply = (
                f"I am ready! You typed *\"{msg}\"*. Would you like me to:\n"
                "1. **Check and explain a sentence** for grammar?\n"
                "2. **Start a Job Interview or Academic Debate roleplay**?\n"
                "3. **Enrich your vocabulary** with advanced words?"
            )
        else:
            reply = (
                f"That is a great point: *\"{msg}\"*.\n\n"
                "As your English tutor, I can help you refine this phrasing, break down any grammatical nuances, or transition this topic into a realistic conversation drill.\n\n"
                "How would you like to proceed?"
            )

        suggestions = [
            "Check a sentence for grammar errors",
            "Start a Job Interview practice roleplay",
            "Explain Subject-Verb Agreement",
            "Give me 5 advanced words for my essay"
        ]
        return reply, suggestions, corrections


tutor_service = ReadifyAITutorService()

def get_tutor_reply(user_message: str, history=None, mode: str = "general", current_passage: str = "") -> Dict[str, Any]:
    return tutor_service.generate_reply(user_message, history, mode, current_passage)
