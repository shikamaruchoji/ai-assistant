🤖 AI Assistant

A locally powered AI assistant built with Ollama, featuring conversational AI, resume analysis, and persistent chat history.

The application is designed to provide a private, locally hosted AI experience while allowing users to analyze resumes and continue conversations even after refreshing the browser.

✨ Features
🤖 Local AI Assistant

Powered by Ollama and locally running AI models.

Chat with the AI through an interactive web interface.

Keeps the AI processing environment local, depending on the Ollama model and configuration you use.

📄 Resume Analyzer

Upload and analyze a resume using the AI assistant.

The resume analysis can be used to help identify:

Skills and technologies

Experience and qualifications

Strengths and potential gaps

Relevant information from the resume

Areas that could be improved

💬 Persistent Chat History

Your conversations don't disappear when you refresh the browser.

The application maintains previous conversations so you can:

Continue previous discussions

Review earlier messages

Refresh the page without losing the conversation

Maintain context across sessions, depending on the application's storage configuration

🏗️ Project Structure
ai-assistant/
│
├── backend/
│   └── Backend application and AI-related functionality
│
├── frontend/
│   └── Web interface for the AI assistant
│
├── .gitignore
└── README.md

🧠 How It Works

The application consists of a frontend and backend working together:

┌─────────────────────┐
│      Frontend       │
│                     │
│  Chat Interface     │
│  Resume Upload      │
│  Chat History       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│       Backend       │
│                     │
│  Request Handling   │
│  Resume Processing  │
│  Chat Persistence   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│       Ollama        │
│                     │
│   Local AI Model    │
└─────────────────────┘

🚀 Getting Started
Prerequisites

Make sure you have the following installed:

Ollama

Git

The runtime/environment required by the backend

The runtime/environment required by the frontend

1. Clone the repository
git clone https://github.com/shikamaruchoji/ai-assistant.git
cd ai-assistant

2. Set up Ollama

Install Ollama and download a model that you want to use.

For example:

ollama pull llama3


Start Ollama if it isn't already running:

ollama serve


The model name may be different depending on which model your application is configured to use.

3. Set up the backend

Navigate to the backend:

cd backend


Install the backend dependencies according to the project's dependency file.

Then start the backend server using the project's configured start command.

4. Set up the frontend

Open another terminal and navigate to:

cd frontend


Install the frontend dependencies and start the development server using the project's configured commands.

5. Open the application

Once the frontend and backend are running, open the local development URL shown by the frontend server.

You can then:

Start a conversation with the AI.

Upload a resume.

Ask questions about the resume.

Continue previous conversations.

Refresh the browser and verify that your chat history remains available.

🔒 Privacy

One of the main goals of this project is to support a local AI workflow using Ollama.

Because the AI model can run locally, prompts and documents can potentially remain on the local machine instead of being sent to a third-party hosted AI API.

However, actual data privacy depends on the application's implementation, storage mechanism, network configuration, and the models/services being used.

Never commit sensitive information to this repository, including:

.env
API keys
Passwords
Access tokens
Private keys
Credentials

🛠️ Project Goals

This project explores the development of a practical AI application combining:

Local LLMs

Conversational AI

Resume analysis

Persistent application state

Frontend/backend architecture

Document-based AI interaction

🔮 Future Improvements

Potential improvements include:

 Multiple AI model selection

 Improved resume scoring and feedback

 Resume-to-job-description matching

 Conversation search

 Multiple conversation threads

 Export conversations

 Resume comparison

 Improved document parsing

 Streaming AI responses

 Authentication and user accounts

 More persistent storage options

 Deployment support

📸 Screenshots

Add screenshots of the application here:

Coming soon...


Example:

![AI Assistant](screenshots/chat.png)

🤝 Contributing

Contributions, ideas, and suggestions are welcome.

If you'd like to contribute:

git clone https://github.com/shikamaruchoji/ai-assistant.git


Create a feature branch:

git checkout -b feature/your-feature


Commit your changes:

git commit -m "Add your feature"


Push the branch:

git push origin feature/your-feature


Then open a pull request.

📄 License

Add your preferred license here.

If you haven't selected one yet, this project is currently presented without an explicit open-source license.

👨‍💻 Author

Shikamaru Choji

GitHub:
https://github.com/shikamaruchoji

⭐ If you find this project useful, consider giving it a star!
