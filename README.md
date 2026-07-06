# DisasterReady 🌍

**DisasterReady** (DisasterEdu) is a full-stack disaster preparedness education platform that helps students learn how to respond to natural and man-made disasters through interactive, gamified learning modules — with a dedicated admin panel for managing content, assignments, and student progress.

🔗 **Live Demo:** [https://disasterreadyy.netlify.app/](https://disasterreadyy.netlify.app/)

---

## ✨ Features

### For Students
- 🔐 **Secure Authentication** — Registration and login with dual-save support (Firebase + MySQL)
- 📚 **Interactive Learning Modules** — Slide-based, carousel-driven lessons covering disasters like Earthquake, Flood, Fire, and Tsunami
- 📈 **Progress Tracking** — Local and server-side tracking of module completion and quiz scores
- 📝 **Quizzes** — Module-linked quizzes to reinforce key safety concepts
- 📂 **Assignments Tab** — View assigned tasks and files (PDF/PPT/DOC) from instructors, with progress sliders and clear action buttons
- 🎯 **Student Dashboard** — Centralized view of modules, assignments, and progress

### For Admins
- 🛠️ **Dynamic Module Management** — Create, edit, and publish learning modules without touching code (fully database-driven, no hardcoded content)
- 📤 **Assignment System** — Assign tasks and upload supporting files (PDF/PPT/DOC) to individual students or groups
- 📊 **Admin Dashboard** — Monitor student progress and manage content from a single interface
- 🗂️ **Structured Content Storage** — Modules, sections, and quizzes organized into dedicated database tables for scalability

---

## 🧰 Tech Stack

| Layer          | Technology                              |
|----------------|------------------------------------------|
| Frontend       | React                                    |
| Backend        | Node.js / Express                        |
| Database       | PostgreSQL / MySQL (Aiven)               |
| Auth & Storage | Firebase                                 |
| Deployment     | Netlify (frontend)                       |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- MySQL/PostgreSQL database instance
- Firebase project credentials

### Installation

```bash
# Clone the repository
git clone https://github.com/m-akanksha49/DisasterReady.git
cd DisasterReady

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### Environment Variables

Create a `.env` file in both `frontend/` and `backend/` directories with the required credentials (database connection strings, Firebase config, JWT secrets, etc.).

### Running Locally

```bash
# Start backend
cd backend
npm start

# Start frontend (in a separate terminal)
cd frontend
npm start
```

---

## 📁 Project Structure

```
DisasterReady/
├── backend/     # Express API, database models, routes
├── frontend/    # React application (student & admin dashboards)
├── netlify.toml # Netlify deployment config
└── .gitignore
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to open a pull request or raise an issue.

---

## 📄 License

This project currently has no license specified.
