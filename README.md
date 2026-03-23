# Synaply — AI-Powered Language Learning Platform

**Synaply** is a high-performance backend service built with Go 1.26, designed to radically improve the foreign language learning process. The platform combines the scientific precision of Spaced Repetition Systems (SRS) with the power of Generative AI and a unique cyclic reinforcement logic.

---

## 🧠 Hybrid Learning Algorithm

The uniqueness of Synaply lies in its dual-layer approach to memorization:

### 1. Long-Term Mastery (FSRS v4)
The system implements the modern **Free Spaced Repetition Scheduler (FSRS v4)** algorithm. It tracks metrics such as stability, difficulty, and lapse counts for every word, calculating the optimal time for the next review to ensure maximum information retention in long-term memory.

### 2. Short-Term Reinforcement (Cyclic Practice)
Unlike standard SRS applications, Synaply applies **Round-Robin (In-Circle)** logic during active lessons:
- Words are not marked as "learned" after the first attempt.
- An internal indexing system via **Redis** is used to cycle through a set of words.
- If a word is skipped or answered incorrectly, it moves to the end of the current lesson queue.
- This ensures that the user encounters difficult words multiple times within a single session, solidifying neural connections before the word is scheduled for long-term review.

---

## 🚀 Key Features

### 🤖 AI Integration (Google Gemini)
- **AI-Driven Word Analysis:** Generation of localized explanations, phonetic transcriptions (using the user's native alphabet), CEFR levels, collocations, and vivid mnemonic rules.
- **Interactive Practice:** A test generator that creates contextual sentences for translation with real-time feedback.
- **Automated Vocabulary Generation:** Creation of thematic word lists (100+ items) based on user requests or specific topics.

### 🌍 Translations and Content
- **High-Precision Translations:** Seamless integration with the **DeepL API** for accurate translation of words and phrases.
- **Mass Management:**
    - Batch saving of up to 500 words in a single request.
    - Data import from CSV and JSON files.
- **Community and Playlists:** Public word lists and "Playlists" — curated collections of lists for various purposes and levels.

---

## 🛠 Tech Stack

- **Language:** [Go 1.26](https://go.dev/) (modern idioms, high-performance architecture)
- **Database:** [PostgreSQL 15](https://www.postgresql.org/) (primary storage)
- **Caching & Queues:** [Redis 7](https://redis.io/) (lesson logic and session management)
- **API:** [Chi Router](https://github.com/go-chi/chi) (RESTful API, logging middleware, CORS, and rate limits)
- **Documentation:** [Swagger / OpenAPI 2.0](https://swagger.io/)
- **AI & External Services:** Google Gemini, DeepL API
- **Infrastructure:** Docker, Docker Compose, Nginx (with SSL/Certbot support)

---

## 🚦 Quick Start (Docker)

The project is fully containerized and ready for deployment via Docker Compose.

1. **Environment Setup:**
   Create a `.env` file based on the example and fill in the required keys:
   ```bash
   DEEPL_KEY=your_deepl_key
   GEMINI_API_KEY=your_gemini_key
   JWT_SECRET=your_secret
   # DB and Redis settings
   ```

2. **Launch:**
   ```bash
   docker-compose up -d --build
   ```

Once started, the API will be available at `http://localhost:8080/api/v1`, and the Swagger documentation at `http://localhost:8080/swagger/index.html`.

For a better viewing experience, you can view the [Interactive API Documentation (GitHub Pages)](https://stastolmachov.github.io/synaply_v2/).

---

## 🔗 Key API Endpoints

### Users (`/api/v1/users`)
- `POST /create` — Register a new user.
- `POST /login` — Authentication and JWT retrieval.
- `GET /lang` — List of supported languages.

### Words and Learning (`/api/v1/words`, `/api/v1/lesson`)
- `POST /words/create` — Add a new word.
- `POST /words/translate` — Translate via DeepL.
- `GET /words/stats` — Progress statistics (FSRS).
- `GET /lesson/start` — Start a learning session (cyclic logic).
- `POST /lesson/check` — Verify answer and update FSRS metrics.

### AI Features (`/api/v1/practice`, `/api/v1/words`)
- `POST /words/wordInfo` — Detailed word information from Gemini.
- `POST /practice/startPractice` — Context-based exercise generation.
- `POST /words/wordList` — Thematic word list generation.

### Public Content (`/api/v1/public-lists`, `/api/v1/playlists`)
- `GET /public-lists` — View publicly available word lists.
- `POST /playlists` — Create list collections.

---

## 📄 License

Copyright (c) 2025 Stanislav Tolmachov. All rights reserved.

The source code for the "Synaply" project is the sole property of the author. Any reproduction, modification, or distribution of this code, in whole or in part, for any purpose is strictly prohibited without the express prior written permission of the copyright owner.

This software is provided for demonstration purposes only as part of a professional portfolio. Open access to the source code is granted by the author solely for the demonstration of professional skills and job seeking. Any other use, copying, or distribution of the code without the written consent of the author is prohibited. Details can be found in the [LICENSE](LICENSE) file.