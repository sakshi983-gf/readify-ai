import re
import json
import logging
from typing import List, Dict, Any, Optional
from backend.database.db import save_exercise_attempt

logger = logging.getLogger(__name__)

# Grounded passage bank with verified evidence citations across topics and CEFR levels
GROUNDED_PASSAGES: List[Dict[str, Any]] = [
    {
        "id": "sci_b1",
        "title": "How Bees Communicate",
        "topic": "Science",
        "difficulty": "Beginner",
        "text": (
            "Honeybees are social insects that live in large colonies called hives. "
            "To share information about the location of flowers, worker bees perform a special dance called the waggle dance. "
            "The direction of the dance relative to the sun tells other bees which way to fly. "
            "The duration of the waggle indicates how far away the food source is. "
            "Through this fascinating language of movement, a single bee can guide thousands of nestmates to nectar."
        ),
        "questions": [
            {
                "id": "q1",
                "type": "mcq",
                "question": "What is the name of the movement honeybees use to communicate food locations?",
                "options": [
                    {"id": "A", "text": "The flutter crawl"},
                    {"id": "B", "text": "The waggle dance"},
                    {"id": "C", "text": "The buzz flight"},
                    {"id": "D", "text": "The nectar circle"}
                ],
                "correct_answer": "B",
                "evidence": "worker bees perform a special dance called the waggle dance."
            },
            {
                "id": "q2",
                "type": "mcq",
                "question": "What does the duration of the waggle communicate to other bees?",
                "options": [
                    {"id": "A", "text": "The type of flower"},
                    {"id": "B", "text": "The time of day"},
                    {"id": "C", "text": "How far away the food source is"},
                    {"id": "D", "text": "The temperature outside"}
                ],
                "correct_answer": "C",
                "evidence": "The duration of the waggle indicates how far away the food source is."
            },
            {
                "id": "q3",
                "type": "short_answer",
                "question": "According to the passage, what reference point do bees use to indicate flight direction?",
                "reference_answer": "The sun",
                "keywords": ["sun", "relative to the sun"],
                "evidence": "The direction of the dance relative to the sun tells other bees which way to fly."
            }
        ]
    },
    {
        "id": "tech_i1",
        "title": "Renewable Energy and Smart Grids",
        "topic": "Technology",
        "difficulty": "Intermediate",
        "text": (
            "As the world shifts toward sustainable energy, traditional electrical grids face unprecedented challenges. "
            "Solar and wind power are variable resources because sunshine and wind speeds fluctuate throughout the day. "
            "To manage this variability, engineers are deploying smart grids equipped with automated sensors and AI analytics. "
            "Smart grids dynamically balance electricity supply with consumer demand in real time. "
            "Furthermore, high-capacity lithium-ion and flow batteries store surplus power during peak generation for use during cloudy or calm periods. "
            "This technological integration reduces carbon emissions while maintaining grid reliability."
        ),
        "questions": [
            {
                "id": "q1",
                "type": "mcq",
                "question": "Why are solar and wind power categorized as variable resources?",
                "options": [
                    {"id": "A", "text": "They produce excessive carbon emissions"},
                    {"id": "B", "text": "Sunshine and wind speeds fluctuate during the day"},
                    {"id": "C", "text": "They cannot be connected to batteries"},
                    {"id": "D", "text": "They are too expensive for consumer use"}
                ],
                "correct_answer": "B",
                "evidence": "Solar and wind power are variable resources because sunshine and wind speeds fluctuate throughout the day."
            },
            {
                "id": "q2",
                "type": "mcq",
                "question": "How do smart grids address the fluctuating nature of renewable energy?",
                "options": [
                    {"id": "A", "text": "By shutting down factories during cloudy days"},
                    {"id": "B", "text": "By relying solely on coal backup generators"},
                    {"id": "C", "text": "By dynamically balancing supply and demand in real time using sensors and AI"},
                    {"id": "D", "text": "By eliminating energy storage batteries"}
                ],
                "correct_answer": "C",
                "evidence": "Smart grids dynamically balance electricity supply with consumer demand in real time."
            },
            {
                "id": "q3",
                "type": "short_answer",
                "question": "What is the primary purpose of high-capacity batteries in renewable grids?",
                "reference_answer": "To store surplus energy during peak generation",
                "keywords": ["store", "surplus", "power", "energy", "generation"],
                "evidence": "batteries store surplus power during peak generation for use during cloudy or calm periods."
            }
        ]
    },
    {
        "id": "hist_a1",
        "title": "The Printing Press and the Spread of Knowledge",
        "topic": "History",
        "difficulty": "Advanced",
        "text": (
            "Johannes Gutenberg's invention of the movable type printing press in Mainz around 1440 catalyzed a profound intellectual revolution. "
            "Prior to this innovation, European manuscripts were laboriously copied by hand, primarily in monastic scriptoria, restricting literacy to the clerical elite and wealthy nobility. "
            "Gutenberg's durable metal alloy type and oil-based ink drastically reduced production costs and accelerated publication speed. "
            "Within decades, printing workshops proliferated across Europe, disseminating scientific treatises, classical philosophy, and vernacular literature. "
            "This democratization of texts fostered the Renaissance, accelerated the Protestant Reformation, and laid the foundations of the scientific revolution."
        ),
        "questions": [
            {
                "id": "q1",
                "type": "mcq",
                "question": "Who primarily controlled the copying and preservation of manuscripts before Gutenberg?",
                "options": [
                    {"id": "A", "text": "University students in Paris"},
                    {"id": "B", "text": "Monks in monastic scriptoria, clerical elites, and wealthy nobility"},
                    {"id": "C", "text": "Merchant guilds in Italian port cities"},
                    {"id": "D", "text": "Independent artisan printers"}
                ],
                "correct_answer": "B",
                "evidence": "manuscripts were laboriously copied by hand, primarily in monastic scriptoria, restricting literacy to the clerical elite and wealthy nobility."
            },
            {
                "id": "q2",
                "type": "mcq",
                "question": "Which major historical movements were directly accelerated by the proliferation of printed vernacular texts?",
                "options": [
                    {"id": "A", "text": "The Bronze Age and the Roman Republic"},
                    {"id": "B", "text": "The Renaissance, the Protestant Reformation, and the scientific revolution"},
                    {"id": "C", "text": "The Industrial Revolution and steam rail expansion"},
                    {"id": "D", "text": "The formation of the Holy Roman Empire"}
                ],
                "correct_answer": "B",
                "evidence": "This democratization of texts fostered the Renaissance, accelerated the Protestant Reformation, and laid the foundations of the scientific revolution."
            },
            {
                "id": "q3",
                "type": "short_answer",
                "question": "What two physical materials made Gutenberg's press durable and efficient?",
                "reference_answer": "Metal alloy type and oil-based ink",
                "keywords": ["metal", "alloy", "oil", "ink"],
                "evidence": "Gutenberg's durable metal alloy type and oil-based ink drastically reduced production costs."
            }
        ]
    }
]

class ReadingComprehensionService:
    """
    Smart Reading Comprehension Service (Module 6).
    Manages leveled passage selection, grounded question generation, and hybrid answer evaluation.
    """

    def get_passages(self, topic: Optional[str] = None, difficulty: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieve passages filtered by topic and difficulty."""
        results = GROUNDED_PASSAGES
        if topic and topic != 'all':
            results = [p for p in results if p['topic'].lower() == topic.lower()]
        if difficulty and difficulty != 'all':
            results = [p for p in results if p['difficulty'].lower() == difficulty.lower()]

        if not results:
            results = GROUNDED_PASSAGES

        # Return sanitized passages for student view
        sanitized = []
        for p in results:
            sanitized.append({
                "id": p["id"],
                "title": p["title"],
                "topic": p["topic"],
                "difficulty": p["difficulty"],
                "text": p["text"],
                "word_count": len(re.findall(r'\b\w+\b', p["text"])),
                "question_count": len(p["questions"]),
                "questions": [
                    {
                        "id": q["id"],
                        "type": q["type"],
                        "question": q["question"],
                        "options": q.get("options")
                    } for q in p["questions"]
                ]
            })
        return sanitized

    def get_passage_by_id(self, passage_id: str) -> Optional[Dict[str, Any]]:
        for p in GROUNDED_PASSAGES:
            if p["id"] == passage_id:
                return p
        return None

    def evaluate_comprehension(self, user_id: int, passage_id: str, answers: Dict[str, str]) -> Dict[str, Any]:
        """
        Evaluates submitted student answers against grounded reference answers,
        cites evidence sentences directly from the passage, and records attempt to SQLite.
        """
        passage = self.get_passage_by_id(passage_id)
        if not passage:
            raise ValueError(f"Passage '{passage_id}' not found.")

        q_map = {q["id"]: q for q in passage["questions"]}
        total_questions = len(passage["questions"])
        correct_count = 0
        breakdown = []

        for q_id, q_data in q_map.items():
            user_ans = answers.get(q_id, "").strip()
            q_type = q_data.get("type", "mcq")

            if q_type == "mcq":
                is_correct = (user_ans.upper() == q_data.get("correct_answer", "").upper())
                expected = q_data.get("correct_answer", "")
            else:
                # Semantic / keyword check for short answer
                keywords = [k.lower() for k in q_data.get("keywords", [])]
                user_lower = user_ans.lower()
                matches = sum(1 for kw in keywords if kw in user_lower)
                is_correct = (matches >= max(1, len(keywords) // 2))
                expected = q_data.get("reference_answer", "")

            if is_correct:
                correct_count += 1

            breakdown.append({
                "question_id": q_id,
                "question": q_data["question"],
                "type": q_type,
                "user_answer": user_ans,
                "expected_answer": expected,
                "is_correct": is_correct,
                "passage_evidence": q_data.get("evidence", "Evidence directly from passage.")
            })

        score_pct = round((correct_count / max(1, total_questions)) * 100, 1)

        # Log attempt in SQLite database
        save_exercise_attempt(
            user_id=user_id,
            exercise_type="reading_comprehension",
            category="reading_comprehension",
            difficulty=passage["difficulty"],
            score=score_pct,
            total_questions=total_questions,
            correct_answers=correct_count,
            details={"passage_id": passage_id, "title": passage["title"], "breakdown": breakdown}
        )

        return {
            "passage_id": passage_id,
            "title": passage["title"],
            "score_percentage": score_pct,
            "correct_count": correct_count,
            "total_questions": total_questions,
            "breakdown": breakdown
        }

reading_comprehension_service = ReadingComprehensionService()
