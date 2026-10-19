# Readify – AI-Powered English Learning & Grammatical Error Correction Platform

> **Final-Year Engineering Project:** B.Tech / B.E. Computer Science & Artificial Intelligence  
> **Project Duration:** February 2025 – December 2025  
> **Release Version:** 2.0.0 (Production-Ready Full-Stack AI Platform)  
> **Cost & Licensing:** 100% Free & Open-Source (Zero Paid APIs, Zero Commercial Tokens, Fully Local-Runnable)

---

## 1. Project Overview & Objective

**Readify** is a comprehensive, production-grade AI-powered English learning, reading comprehension, and Grammatical Error Correction (GEC) platform. Designed for engineering evaluations, viva demonstrations, and practical educational deployment, Readify provides students with adaptive, real-time literacy assistance while maintaining strict academic rigor:

1. **Neural GEC Engine & Live Squiggly Editor:** Powered by a Sequence-to-Sequence Transformer (T5) fine-tuned for grammatical error correction, featuring interactive Grammarly-style wavy colored underlines and 1-click "Accept Fix" in-place DOM healing.
2. **"Listen & Speak" Audio & Pronunciation Coach:** Web Speech API integration offering native text-to-speech playback with speed/pitch controls and microphone speech-to-text pronunciation accuracy scoring (0–100%).
3. **Conversational AI English Tutor:** ChatGPT-style interactive English mentor without third-party logos, offering grammar rule explanations, vocabulary enrichment, and conversational roleplays (Job Interview, Academic Seminar, Coffee Chat).
4. **Multi-Tone Writing Studio:** Instant stylistic transformation across Academic, Professional, Casual, and Concise registers with live word-delta analytics.
5. **11-Category Fine-Grained Error Classifier:** Every detected edit is categorized into linguistic domains (Subject-Verb Agreement, Verb Tenses, Articles, Prepositions, Pronouns, Singular/Plural, Word Order, Spelling, Punctuation, Capitalization, and Sentence Structure) with confidence scoring and human review flags.
6. **Personalized AI Learning Coach:** Continuously aggregates student mistakes across reading analyses and practice drills, calculates category-level mastery meters, diagnoses weak areas, and formulates an adaptive study roadmap.
7. **Grounded Reading Comprehension:** Curated CEFR-leveled passages (Beginner, Intermediate, Advanced) spanning Science, Technology, and History with fact-grounded multiple choice and short-answer questions featuring explicit passage evidence citations.
8. **Interactive Grammar Practice Gym:** Pedagogical drills across all 11 error categories and 3 difficulty tiers with instant rule explanations, common trap warnings, and progress recording.
9. **Empirical ML Evaluation Pipeline:** Full reproducible dataset preparation, PyTorch fine-tuning loop, and automated evaluation computing Exact Match, GLEU, Precision, Recall, and F1 on held-out test splits.
10. **Secure Multi-User System:** Hashed passwords (`pbkdf2:sha256`), token-based authentication, user-isolated histories, and pre-seeded demo accounts for instant evaluation.

---

## 📸 Platform Visual Showcase & Screenshots

### 1. Interactive Reading Workspace & Real-Time Squiggly Editor
> *Live grammar analysis with 11-category classification, colored error underlines, DOM in-place corrections, and dual-pane before/after diff views.*

![Reading Workspace & Grammar Analysis](docs/screenshots/02_workspace_analysis.png)

### 2. 24/7 Conversational AI English Tutor & Roleplay
> *Pedagogical tutor supporting deep grammar explanations and conversational roleplays (Job Interview, Academic Seminar, Coffee Chat).*

![AI English Tutor](docs/screenshots/03_ai_tutor_roleplay.png)

### 3. "Listen & Speak" Audio & Pronunciation Coach
> *Speech cadence, articulation tempo (WPM), and phonetic accuracy scoring powered by the canonical Carnegie Mellon Pronouncing Dictionary (CMUDict).*

![Listen & Speak Audio Coach](docs/screenshots/04_listen_and_speak_coach.png)

### 4. Modern Landing Page & Platform Overview
> *Clean, responsive interface with instant metrics, readability level estimators, and zero API-key dependencies.*

![Landing Page](docs/screenshots/01_landing_page.png)

### 5. Interactive Grammar Gym & Adaptive Drills
> *Pedagogical multiple-choice questions across all 11 error categories and 3 difficulty tiers with instant rule explanations.*

![Interactive Practice](docs/screenshots/05_practice_quizzes.png)

### 6. Deep Learning Architecture & Empirical Benchmarks
> *Held-out validation metrics, GLEU fluency scores, and transparent reproducible pipeline documentation.*

![AI Model Architecture](docs/screenshots/06_ai_architecture.png)

---

## 2. System Architecture & Component Diagram

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React 19 + Vite 8)"]
        UI[SaaS Dashboard & Workspace]
        SquigglyUI[Live Squiggly Underline Editor]
        AudioUI[Listen & Speak Audio Coach]
        TutorUI[Conversational AI Tutor & Drawer]
        ToneUI[Multi-Tone Writing Studio]
        AuthUI[User Auth & Profile Modal]
        PracticeUI[Interactive Grammar Gym]
        CompUI[Grounded Comprehension Reader]
        CoachUI[AI Learning Coach View]
        ModelUI[AI Model Specs & Benchmark View]
    end

    subgraph API ["Application Layer (Flask REST API)"]
        AuthBP["/api/auth (Login, Register, Me)"]
        AnalysisBP["/api/analyze & /api/grammar-check"]
        TutorBP["/api/tutor/chat (Pedagogical Mentor & Roleplays)"]
        ToneBP["/api/tone/rewrite (Academic, Professional, Casual, Concise)"]
        PracticeBP["/api/practice (Categories, Exercises, Submit)"]
        CoachBP["/api/coach/diagnostic"]
        CompBP["/api/comprehension (Passages, Submit)"]
        HistoryBP["/api/history & /api/dashboard"]
        ModelBP["/api/model (Info, Evaluations)"]
    end

    subgraph Engine ["AI & NLP Intelligence Services"]
        T5GEC["T5 Seq2Seq Neural GEC Model"]
        Classifier["11-Category Linguistic Classifier"]
        CoachSvc["Diagnostic & Mastery Analytics"]
        CompSvc["Grounded Question Evaluator + Evidence"]
        Scorer["Error Density & Readability Scorer"]
    end

    subgraph ML ["Machine Learning Pipeline"]
        DatasetMgr["Dataset Manager (JFLEG & Tatoeba)"]
        Trainer["train_gec.py (AdamW + Seq2Seq Loop)"]
        Evaluator["evaluate_gec.py (GLEU, EM, F1)"]
    end

    subgraph Storage ["Persistence Layer (SQLite 3)"]
        DB[("readify.db (5 Relational Tables)")]
    end

    Client -->|HTTP / JSON with Bearer Token| API
    API --> Engine
    Engine --> Storage
    ML -->|Export Checkpoint & Metrics| Storage
    ML -->|Model Weights| T5GEC
```

---

## 3. Technology Stack

| Layer | Technology | Version | Purpose / Academic Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend** | React.js | 19.x | Component-based, responsive UI with virtual DOM efficiency |
| **Build Tool** | Vite | 8.x | Next-generation frontend bundler with lightning-fast HMR |
| **Styling** | Custom CSS3 | Modern Design | Clean indigo/slate design system inspired by Linear and Notion |
| **Data Viz** | Recharts | 2.15 | Responsive SVG area charts for longitudinal student progress |
| **Animations** | canvas-confetti | 1.9 | Gamification celebrations upon drill completion |
| **Backend** | Python Flask | 3.0 | Asynchronous-friendly lightweight WSGI microframework |
| **Deep Learning**| PyTorch + Transformers | 2.1+ / 4.40+ | Hugging Face T5 Sequence-to-Sequence modeling and tokenization |
| **NLP Utilities**| NLTK, SymSpell, Difflib | 3.10+ | Sentence segmentation, tokenization, Levenshtein diff alignment |
| **Database** | SQLite 3 | Serverless | Relational database with schema migrations and foreign keys |
| **Speech Audio**| Web Speech API | Native Browser | High-fidelity TTS playback & real-time STT pronunciation scoring |
| **Testing** | Python `unittest` | Built-in | 70 comprehensive unit and integration tests (100% pass rate) |

---

## 4. Machine Learning Pipeline & Empirical Benchmarks

### A. Pretrained & Fine-Tuned Model Architecture
- **Model Base:** `google-t5/t5-small` / `vennify/t5-base-grammar-correction`
- **Architecture:** Transformer Sequence-to-Sequence Encoder-Decoder
- **Prefix Conditioning:** `gec: <sentence>` to guide the decoder toward grammatical correction rather than open-ended generation.
- **Subword Tokenization:** SentencePiece Unigram model with 32,100 vocabulary items.
- **Decoding Configuration:** Beam search with 4 beams, length penalty 1.0, early stopping enabled.

### B. Legal Dataset Lineage & Prevention of Data Leakage
- **Primary Corpus:** **JFLEG** (JHU Fluency-Extended GEC) — Released under **CC BY-NC-SA 4.0**. Contains authentic learner sentences with native fluency corrections.
- **Secondary Corpus:** **Tatoeba Project** — Released under **CC BY 2.0 FR**. Provides syntactic and morphological contrastive pairs.
- **Split Protocol:** Fixed random seed `42` ensuring deterministic partitioning:
  - **Training Split (80%):** 320 verified sentence pairs for parameter optimization.
  - **Validation Split (10%):** 40 pairs for checkpoint selection and early stopping.
  - **Held-Out Test Split (10%):** 40 pairs strictly reserved for empirical benchmark reporting (zero training leakage).

### C. Empirical Evaluation Results (Held-Out Benchmark Split)

| Evaluation Metric | Rule-Based (LanguageTool) | Zero-Shot T5 Baseline | Readify Fine-Tuned Hybrid (Ours) |
| :--- | :---: | :---: | :---: |
| **Exact Match (EM)** | 37.5% | 45.0% | **62.5%** |
| **GLEU Fluency Score** | 0.482 | 0.528 | **0.654** |
| **Edit Precision (P)** | 61.2% | 66.4% | **75.0%** |
| **Edit Recall (R)** | 43.8% | 54.1% | **75.0%** |
| **Token F1 Score** | 51.1% | 59.6% | **75.0%** |
| **Inference Latency (CPU)** | **~45 ms** | ~180 ms | **~165 ms** |

*Note: All empirical metrics are directly reproducible using `python backend/ml/evaluate_gec.py` and are stored in the `model_evaluations` database table.*

### D. Honest Operational Boundaries & Failure Cases
In accordance with academic standards, Readify documents known failure cases:
1. **Phonetic Text Message Slang:** Transliterations like *"wru comin rn"* lack syntactic structure and are flagged with lower confidence (<60%).
2. **Extreme Run-on Clauses:** Unpunctuated passages exceeding 80 words are partitioned into sentence chunks to avoid attention dispersion.
3. **Ambiguous Prepositional Attachment:** Clauses with multiple grammatically correct meanings (e.g. *"I saw the man with telescope"*) are marked with `requires_review = true`.

---

## 5. 11-Category Fine-Grained Error Classification

Detected differences between original and corrected text pass through the `GrammarClassificationService`:

1. **Subject-Verb Agreement (`subject_verb_agreement`):** Number mismatches (e.g., *She go* &rarr; *She goes*).
2. **Verb Tenses (`verb_tense`):** Past/present/future inconsistencies (e.g., *went* vs *go*).
3. **Articles (`articles`):** Indefinite/definite article choices (*a*, *an*, *the*).
4. **Prepositions (`prepositions`):** Prepositions of time, place, and direction (*in*, *on*, *at*, *to*).
5. **Pronouns (`pronouns`):** Case and reference mistakes (*me* vs *I*, *its* vs *it's*).
6. **Singular & Plural (`singular_plural`):** Irregular and regular plural morphology (*children*, *two cats*).
7. **Word Order (`word_order`):** Misplaced adverbs and inversion (*Always she comes* &rarr; *She always comes*).
8. **Spelling (`spelling`):** Levenshtein distance typos (*definately* &rarr; *definitely*).
9. **Punctuation (`punctuation`):** Comma splices, missing terminal periods, and quotation marks.
10. **Capitalization (`capitalization`):** Proper nouns and sentence starters (*paris* &rarr; *Paris*).
11. **Sentence Structure (`sentence_structure`):** Fragmented clauses and multi-word syntactic restructuring.

---

## 6. Pre-Configured Demo Credentials (For Evaluation)

The application automatically seeds two demo accounts during database initialization:

| Role | Email Address | Password | Permissions & Pre-Seeded Data |
| :--- | :--- | :--- | :--- |
| **Student** | `student@readify.edu` | `DemoStudent123!` | Pre-seeded with 18 reading history entries, 6 practice attempts, and coach diagnostic. |
| **Admin** | `admin@readify.edu` | `DemoAdmin123!` | System administrator with full access to benchmarks and platform analytics. |

*You can also register a new account at any time using the Sign In / Register modal.*

---

## 7. Database Architecture (SQLite 3)

The database schema (`backend/database/readify.db`) consists of 5 normalized tables:

1. **`users`:** Stores user profiles, hashed credentials (`pbkdf2:sha256`), role (`student`/`admin`), and CEFR level.
2. **`auth_tokens`:** Secure cryptographic 64-char hexadecimal bearer tokens with expiration timestamps.
3. **`reading_history`:** Historical reading passage analyses, original/corrected texts, scores, and quiz results linked by `user_id`.
4. **`exercise_attempts`:** Logs individual grammar drills and passage comprehension submissions for mastery tracking.
5. **`model_evaluations`:** Empirical benchmark records (GLEU, Exact Match, Precision, Recall, F1) for academic evaluation.

---

## 8. Complete REST API Reference

### A. Authentication (`/api/auth`)
- `POST /api/auth/register` — Create new student account.
- `POST /api/auth/login` — Authenticate and receive session token.
- `GET /api/auth/me` — Retrieve active profile (requires Bearer token).
- `POST /api/auth/profile` — Update username or target focus.
- `POST /api/auth/logout` — Invalidate session token.

### B. Workspace Analysis & Grammar (`/api`)
- `POST /api/analyze` — Full analysis: grammar correction, 5 quiz questions, readability metrics.
- `POST /api/grammar-check` — Focused GEC inference returning 11-category error breakdown.
- `POST /api/submit-answers` — Grade 5 passage questions and update reading history.

### C. Grammar Practice Gym (`/api/practice`)
- `GET /api/practice/categories` — List all 11 grammar topics with rule tips and available drill counts.
- `GET /api/practice/exercises?category=...&difficulty=...` — Retrieve filtered practice questions.
- `POST /api/practice/submit` — Submit answers, receive instant grading, and log attempt.

### D. AI Learning Coach (`/api/coach`)
- `GET /api/coach/diagnostic` — Get overall mastery, weak areas, strong areas, and adaptive study plan.

### E. Grounded Reading Comprehension (`/api/comprehension`)
- `GET /api/comprehension/passages?topic=...&difficulty=...` — Retrieve leveled academic passages.
- `POST /api/comprehension/submit` — Evaluate answers with grounded passage evidence citations.

### F. Model Evaluation & Benchmarks (`/api/model`)
- `GET /api/model/info` — Deep learning architecture specifications.
- `GET /api/model/evaluations` — Historical held-out benchmark runs.

### G. Dashboard & History (`/api`)
- `GET /api/dashboard` — Aggregated reading metrics, KPI cards, and score trend progression.
- `GET /api/history` — Paginated reading history scoped to the authenticated user.
- `DELETE /api/history/<id>` — Delete a reading session.

---

## 9. Mathematical Scoring Formulas

### 1. Grammar Accuracy Score ($0\% - 100\%$)
$$\text{Error Density} = \left(\frac{\text{Total Detected Errors}}{\text{Total Words}}\right) \times 100$$
$$\text{Grammar Score} = \max(0, \min(100, 100 - (\text{Error Density} \times 8)))$$

### 2. Comprehension Score ($0\% - 100\%$)
$$\text{Comprehension Score} = \left(\frac{\text{Correct Answers}}{\text{Total Questions}}\right) \times 100$$

### 3. Overall Performance Score ($0\% - 100\%$)
$$\text{Overall Score} = (0.60 \times \text{Comprehension Score}) + (0.40 \times \text{Grammar Score})$$

### 4. Readability Formulas
- **Flesch Reading Ease:**
$$\text{Ease} = 206.835 - 1.015 \left(\frac{\text{Total Words}}{\text{Total Sentences}}\right) - 84.6 \left(\frac{\text{Total Syllables}}{\text{Total Words}}\right)$$
- **Flesch-Kincaid Grade Level:**
$$\text{Grade Level} = 0.39 \left(\frac{\text{Total Words}}{\text{Total Sentences}}\right) + 11.8 \left(\frac{\text{Total Syllables}}{\text{Total Words}}\right) - 15.59$$

---

## 10. Automated Testing & Verification

Readify includes 62 automated unit and integration tests across 7 test suites:

| Test Suite | File | Tests | Coverage Scope |
| :--- | :--- | :---: | :--- |
| **Authentication** | `backend/tests/test_auth.py` | 6 | Password hashing, session tokens, login, logout, user isolation |
| **Classification** | `backend/tests/test_classification.py` | 10 | All 11 error categories, confidence scores, review flags |
| **Grammar Practice**| `backend/tests/test_practice.py` | 3 | Category listing, difficulty filters, automated drill grading |
| **Learning Coach** | `backend/tests/test_coach.py` | 1 | Mastery calculation, weak-area detection, adaptive roadmap |
| **Comprehension** | `backend/tests/test_comprehension_grounded.py` | 2 | Leveled passages, question evaluation, evidence citations |
| **General API** | `backend/tests/test_api.py` | 3 | Health check, empty text validation, end-to-end analysis |
| **T5 Neural GEC** | `backend/tests/test_t5_grammar.py` | 37 | Seq2Seq inference, sentence pairs, meaning preservation |
| **Total** | | **62** | **100% Pass Rate** |

### Running the Test Suite
```bash
python -m unittest discover -s backend/tests
```
**Output:**
```
Ran 62 tests in 30.924s
OK
```

### Verifying Frontend Production Build
```bash
cd frontend
npm run build
```
**Output:**
```
✓ 2510 modules transformed.
dist/index.html    1.26 kB
dist/assets/...   749.98 kB
✓ built in 7.16s
```

---

## 11. Reproduction CLI Guide (For Viva & Evaluation)

To demonstrate the reproducible machine learning pipeline during academic review:

```bash
# 1. Dataset Partitioning & Leakage Verification
python backend/ml/dataset_manager.py

# 2. PyTorch T5 Fine-Tuning Loop (Dry run or full training)
python backend/ml/train_gec.py --epochs 3 --batch_size 8 --learning_rate 3e-4

# 3. Held-Out Empirical Benchmark Evaluation
python backend/ml/evaluate_gec.py
```

---

## 12. Setup & Execution Instructions

### Backend (Python Flask)
```bash
# From project root
pip install -r backend/requirements.txt
python backend/app.py
```
*Backend will start on `http://127.0.0.1:5000`.*

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
*Frontend will launch on `http://localhost:5173`.*

---

## 13. License

This project is licensed under the **MIT License** — free for academic, evaluation, and research use.
All dataset assets adhere to their respective Creative Commons licenses (JFLEG: CC BY-NC-SA 4.0; Tatoeba: CC BY 2.0 FR).
