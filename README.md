# CodeSync

CodeSync is a highly robust, real-time collaborative web-based IDE. It allows multiple users to write, sync, and execute code simultaneously without merge conflicts, featuring a modern CRDT (Conflict-free Replicated Data Type) architecture, role-based access control, and hybrid database persistence.

## 🚀 Features

* **Real-Time Collaboration:** Powered by Yjs CRDTs, allowing multiple users to edit the same document simultaneously with sub-millisecond latency and zero cursor desync.
* **Role-Based Access Control:** Users join as Viewers, Editors, or Hosts. Hosts can promote Viewers, and Viewers cannot edit the code until granted permission.
* **Hybrid State Persistence:**
  * **Hot State (RAM):** Active sessions are managed in Node.js memory for instant WebSocket broadcasting.
  * **Warm State (Redis):** Code state is debounced and cached as Base64 strings every 2 seconds to prevent data loss during sudden server crashes.
  * **Cold State (PostgreSQL):** When a room closes, the final code, language, and user permissions are permanently archived to Postgres. Rejoining a room restores everything instantly.
* **Local Code Execution:** Used docker images of each language and run them on docker containers on demand.
* **Customizable Editor:** Built on Monaco Editor, featuring language selection, font size scaling, tab size adjustments, and word wrap toggles.

## 🛠️ Tech Stack

**Frontend:**
* React (Vite)
* Chakra UI (for layout/styling)
* `@monaco-editor/react` (Core editor)
* `yjs` & `y-monaco` (CRDTs and editor bindings)

**Backend:**
* Node.js & Express
* Socket.IO (Real-time WebSockets)
* Redis (Temporary high-frequency caching)
* PostgreSQL / Neon DB (Permanent cold storage, `pg` driver)
* Docker (Local images for executing supported languages)

---

## ⚙️ Architecture Overview

CodeSync solves the classic "collaborative text syncing" problem by avoiding full-text string replacements. Instead, as a user types, Yjs calculates the exact mathematical delta (e.g., "insert 'x' at index 42") and broadcasts that binary update via Socket.IO. The server merges these mathematical updates into a master document and reflects them to all clients.

To handle scale and persistence without hammering a database on every keystroke, the server saves the binary state to Redis only when typing pauses, and performs a single bulk `INSERT/UPDATE` to PostgreSQL when the session completely ends.

---

## 💻 Local Setup & Installation

### Prerequisites
* Node.js (v18+)
* Docker (for local Redis and language execution containers)
* PostgreSQL instance (Neon DB recommended)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/CodeSync.git
cd CodeSync
```

### 2. Setup the Backend
Navigate to the server directory and install dependencies:
```bash
cd Server
npm install
```

Create a `.env` file in the `Server` directory:
```env
# Database Connections
DATABASE_URL="postgresql://[user]:[password]@[neon-hostname]/neondb?sslmode=require"
REDIS_URL="redis://localhost:6379" 
```

Start your local Redis container:
```bash
docker run -p 6379:6379 -d redis
```

Pull the required Docker images for local code execution (examples based on your supported languages):
```bash
docker pull openjdk:latest
docker pull python:latest
docker pull gcc:latest
docker pull node:latest
```

Start the backend server:
```bash
npm run dev
```

### 3. Setup the Frontend
Open a new terminal, navigate to the client directory, and install dependencies:
```bash
cd Client
npm install
```

Start the Vite development server:
```bash
npm run dev
```

---

## 🗄️ Database Schema

Run these queries in your PostgreSQL database to set up the persistence tables:

```sql
CREATE TABLE rooms (
    room_id VARCHAR(255) PRIMARY KEY,
    host_email VARCHAR(255) NOT NULL, 
    language VARCHAR(50) DEFAULT 'java',
    yjs_state TEXT, 
    plain_text_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE room_users (
    id SERIAL PRIMARY KEY,
    room_id VARCHAR(255) REFERENCES rooms(room_id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'viewer', 
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, email) 
);
```

---

## 👨‍💻 Author
Built by Alok Negi.
