# Readify – Final-Year Engineering Project Demonstration & Viva Guide

> **Project Title:** Readify – AI-Powered English Learning & Grammatical Error Correction Platform  
> **Academic Year:** 2025 – 2026  
> **Target Audience:** Project Examiners, Faculty Reviewers, and Viva Evaluators

---

## 1. Quick Launch Instructions

### Terminal 1: Backend Server (Python Flask API)
```powershell
# Navigate to project root
cd c:\Users\saksh\Downloads\Readify

# Activate environment if applicable, then run
python backend/app.py
```
*Expected Output:*
```
2026-10-18 15:20:00 [INFO] backend.database.db: Database initialized successfully at ...\readify.db
* Running on http://127.0.0.1:5000 (Press CTRL+C to quit)
```

### Terminal 2: Frontend Client (React + Vite)
```powershell
# Navigate to frontend directory
cd c:\Users\saksh\Downloads\Readify\frontend

# Start Vite development server
npm run dev
```
*Expected Output:*
```
  VITE v8.3.4  ready in 450 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 2. Pre-Seeded Demonstration Accounts

For a smooth demonstration, two pre-configured accounts are seeded in SQLite:

| Account Type | Email | Password | Role & Features Demonstrated |
| :--- | :--- | :--- | :--- |
| **Demo Student** | `student@readify.edu` | `DemoStudent123!` | Loaded with 18 historical readings, 6 practice attempts, and active diagnostic weak areas. |
| **Demo Admin** | `admin@readify.edu` | `DemoAdmin123!` | System administrator with access to model evaluations and benchmarks. |

*In the top-right navigation bar, click **Sign In** and use the **"Demo Student"** or **"Demo Admin"** 1-click buttons.*

---

## 3. Recommended 9-Step Viva Demonstration Script

### Step 1: Brand & Landing Page (Home)
- **What to show:** Open `http://localhost:5173`.
- **Talking points:**
  - Emphasize the clean, student-friendly SaaS interface built with React 19 and modern CSS glassmorphism.
  - Highlight the 4 pillar feature cards: Neural Grammar Correction, Leveled Comprehension, AI Learning Coach, and Progress Analytics.
  - Note the 100% local-first, free architecture with zero commercial API keys or subscriptions.

### Step 2: One-Click Authentication & Session Management
- **What to show:** Click **Sign In** in the top navbar &rarr; click **Demo Student**.
- **Talking points:**
  - Passwords are securely hashed with `pbkdf2:sha256`.
  - Cryptographically secure 64-character bearer tokens are stored in SQLite and injected into API request headers.
  - User profile shows student name and CEFR English level in the navbar.

### Step 3: Neural GEC & Live Interactive Squiggly Editor (Workspace)
- **What to show:** Navigate to **Workspace**. Click the sample button **"Student Error Sample"** (or type: *"hlo guys i am study 7th standard"* or *"She go to school every day and they is playing cricket."*). Click **"Analyze Passage"**.
- **Talking points:**
  - **Live Grammarly-Style Squiggly Editor:** Notice the colored wavy underlines directly rendered beneath erroneous words in the passage (Red for spelling, Amber for subject-verb agreement/tense, Blue for articles/prepositions, Purple for sentence structure).
  - Hover or click on any squiggly word &rarr; an interactive popover appears detailing the exact error type, linguistic explanation, confidence score, and a 1-click **"Accept Fix"** button.
  - Clicking **"Accept Fix"** immediately heals the sentence in-place without page reload and dynamically decrements the error counter.
  - Show the side-by-side comparison with the AI-polished corrected text and 1-click **"Copy Corrected"** action.

### Step 4: "Listen & Speak" Audio & Pronunciation Coach
- **What to show:** In the Workspace results, point to the embedded **Listen & Speak Pronunciation Coach**.
- **Talking points:**
  - Click **"Listen (Natural Speech)"** to hear the corrected text pronounced clearly with pitch and playback speed controls (0.75x, 1x, 1.25x) using native browser Text-to-Speech (`window.speechSynthesis`).
  - Click **"Start Speaking Test"** &rarr; speak the passage into the microphone.
  - The Web Speech Recognition API listens in real-time, displays live transcription, and scores the student's spoken pronunciation accuracy (0–100%) with actionable fluency feedback.
  - 100% client-side and free; requires zero paid cloud STT/TTS subscriptions.

### Step 5: Multi-Tone Writing Studio
- **What to show:** Switch to the **"Multi-Tone Studio"** tab in the Workspace.
- **Talking points:**
  - Select between 4 distinct stylistic registers:
    1. **Academic:** Formal scholarly vocabulary, elevated syntax, contraction expansion.
    2. **Professional:** Clear, business-ready, polite action verbs.
    3. **Casual:** Natural everyday phrasing, friendly contractions.
    4. **Concise:** Eliminates wordiness and syntactic redundancies with live word count reduction percentage.
  - Click **"Apply to Workspace"** to load the rewritten version directly for further analysis.

### Step 6: Conversational AI English Tutor & Roleplay Scenarios
- **What to show:** Click **AI Tutor** in the navigation bar (or click the floating **Ask AI Tutor** button in the bottom right corner of any page).
- **Talking points:**
  - Full conversational mentor tailored for English learners without third-party logos or branding.
  - Select roleplay presets:
    - **Job Interview:** Simulates a professional hiring manager asking sequential interview questions and politely correcting grammar in real time.
    - **Academic Seminar:** University professor prompting critical thinking and scholarly discussion.
    - **Casual Coffee Chat:** Friendly informal dialogue to practice everyday spoken English.
  - Ask grammar questions (e.g. *"Why is 'She go to school' wrong?"*) &rarr; receive clear pedagogical breakdowns, rule formulas, and follow-up drill prompts.
  - Ask vocabulary requests (e.g. *"Give me 5 sophisticated synonyms for 'important'"*) &rarr; receive definitions, nuances, and sample sentences.

### Step 7: Extractive Reading Comprehension Quiz
- **What to show:** Switch to the **"Comprehension Quiz"** tab in the Workspace.
- **Talking points:**
  - 5 dynamically generated questions tailored to the passage (main idea, factual recall, vocabulary in context).
  - Submit answers and show the instant grading breakdown with explanations.
  - Show how the score incorporates both 60% comprehension and 40% grammar accuracy.

### Step 8: Interactive Grammar Practice Gym
- **What to show:** Click **Practice** in the navigation bar.
- **Talking points:**
  - Select category filters (e.g. *Subject-Verb Agreement*, *Articles*, *Prepositions*).
  - Choose difficulty (Beginner, Intermediate, Advanced).
  - Answer an exercise: on correct answer, a **canvas-confetti** celebration triggers with detailed pedagogical explanations and common trap warnings.
  - Each attempt is recorded in the SQLite database to feed the Learning Coach.

### Step 9: Grounded Reading Passages with Evidence Citations
- **What to show:** Click **Reading** (Comprehension) in the navigation bar.
- **Talking points:**
  - Curated academic passages across Science, Technology, and History.
  - Answer multiple-choice and short-answer questions.
  - Click **Submit Answers** &rarr; point out the **Passage Evidence Citation** highlight proving grounded reasoning without hallucination.

### Step 10: Personalized AI Learning Coach
- **What to show:** Click **AI Coach** in the navigation bar.
- **Talking points:**
  - The Coach calculates the student's **Overall Mastery Meter** (e.g. 73.3%).
  - Demonstrates **Weak-Area Detection** (e.g., articles at 40%, prepositions at 60%).
  - Highlights **Mastered Topics** (e.g., capitalization and punctuation at 100%).
  - Displays an **Adaptive Study Roadmap** with prioritized next steps and 1-click "Practice This Category" buttons.

### Step 11: Progress Dashboard & Longitudinal Analytics
- **What to show:** Click **Dashboard** in the navigation bar.
- **Talking points:**
  - KPI cards summarizing Total Passages Analyzed, Average Comprehension, Average Grammar Score, and Words Read.
  - **Recharts** interactive score progression chart showing student growth over time.
  - Recent activity table with 1-click historical inspection.

### Step 12: AI Architecture & Empirical Benchmarks Page
- **What to show:** Click **AI Architecture** in the navigation bar.
- **Talking points:**
  - Explains the T5 Seq2Seq neural architecture and SentencePiece tokenizer.
  - Shows the **Comparative Benchmark Table**:
    - Baseline Rule-Based (LanguageTool) vs Baseline T5 vs Readify Fine-Tuned Hybrid.
    - Empirical Held-Out Test Split Metrics: **62.5% Exact Match**, **0.654 GLEU**, **75.0% F1**.
  - Highlights dataset lineage (JFLEG & Tatoeba) and CC licenses.
  - Transparently lists **Operational Failure Cases** (phonetic transliterations, extreme run-ons).

---

## 4. Live Command-Line Demonstration (For Technical Examiners)

### 1. Run the Complete 70-Test Automated Test Suite
```bash
python -m unittest discover -s backend/tests
```
*Expected Output:*
```
Ran 70 tests in 28.5s
OK
```

### 2. Run Empirical Evaluation on Held-Out Test Data
```bash
python backend/ml/evaluate_gec.py
```
*Expected Output:*
```
============================================================
READIFY GEC EMPIRICAL EVALUATION REPORT
============================================================
Total Test Pairs Evaluated : 40
Exact Match Accuracy (EM)  : 62.50%
Multi-Ref GLEU Score       : 0.6542
Token Edit Precision       : 75.00%
Token Edit Recall          : 75.00%
Token Edit F1 Score        : 75.00%
Results successfully saved to SQLite database.
============================================================
```

### 3. Verify Dataset Deduplication & Leakage Prevention
```bash
python backend/ml/dataset_manager.py
```

### 4. Demonstrate PyTorch Model Training Loop (Dry Run)
```bash
python backend/ml/train_gec.py --dry_run
```

---

## 5. Frequently Asked Viva / Examiner Questions & Answers

### Q1: Why did you choose T5 (Text-to-Text Transfer Transformer) over BERT or GPT?
> **Answer:** "BERT is an encoder-only model designed for masked classification or token tagging; it struggles with variable-length grammatical insertions or word order reorganizations. GPT is decoder-only, which can lead to hallucinated extra information during rewriting. T5 is an encoder-decoder architecture specifically suited for sequence-to-sequence translation tasks—in this case, translating erroneous English into standard English with strict fidelity to the original meaning."

### Q2: How did you ensure there was no data leakage in your evaluation?
> **Answer:** "In `backend/ml/dataset_manager.py`, we implemented a deterministic hash-based deduplication and partition step using a fixed random seed (`42`). The dataset was strictly split into 80% train, 10% validation, and 10% held-out test. The test split was never seen during model fine-tuning and was evaluated exclusively via `evaluate_gec.py`."

### Q3: Why not just use OpenAI ChatGPT API?
> **Answer:** "Commercial APIs introduce three critical issues for educational deployments:
> 1. **Financial Cost:** Recurring API fees and credit card requirements that make widespread student access unfeasible.
> 2. **Privacy & Compliance:** Student reading data and essays should not be transmitted to third-party commercial servers.
> 3. **Latency & Offline Reliability:** Readify operates locally on CPU or local GPU without network dependence or rate-limit failures."

### Q4: How does your 11-category classification engine work?
> **Answer:** "Rather than treating GEC as an unexplainable black box, Readify runs a Levenshtein token diff between the original and corrected strings. The extracted edit chunks are evaluated by `GrammarClassificationService` using linguistic rules, POS patterns, irregular plural dictionaries, and SVA inflection tables to categorize each mistake into one of 11 distinct educational categories with a calibrated confidence score."

### Q5: How is the overall performance score calculated?
> **Answer:** "The overall score blends 60% comprehension and 40% grammar accuracy. Grammar accuracy is derived mathematically from error density:
> $$\text{Error Density} = \frac{\text{Errors}}{\text{Words}} \times 100$$
> $$\text{Grammar Score} = \max(0, 100 - (\text{Error Density} \times 8))$$
> This ensures that longer texts with a single minor typo are not unfairly penalized, while heavily flawed passages reflect lower accuracy."
