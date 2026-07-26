# 🏥 MedMind AI

> **Your AI-powered digital health companion for managing medical records, understanding reports, and accessing critical health information anytime, anywhere.**
🌐 **Live Demo:** https://medmind-ai-coral.vercel.app
---

## 📖 The Problem

Every year, people collect prescriptions, blood reports, X-rays, MRI scans, and other medical records from different hospitals and clinics. These records often end up scattered across files, phones, and hospital portals, making it difficult to keep track of one's complete medical history.

During emergencies, finding important information like blood group, allergies, or ongoing medications becomes even more challenging.

We built **MedMind AI** to solve this problem.

---

## 💡 Our Solution

MedMind AI is a centralized healthcare platform that securely stores medical records and uses AI to help users better understand their health.

Users can upload their medical reports, receive AI-generated summaries, track their health history, chat with an AI assistant for explanations, set medicine reminders, and generate an Emergency QR Health Card that can be scanned to instantly access life-saving information.

Our goal is simple:

> **Make healthcare records organized, accessible, and easy to understand for everyone.**

---

# ✨ Features

### 📄 Medical Record Management

- Upload medical reports securely
- Support for:
  - Blood Reports
  - Prescriptions
  - X-Rays
  - MRI
  - ECG
- Cloud storage using Cloudinary

---

### 🤖 AI Report Analysis

Using **Gemini AI**, MedMind AI can:

- Extract important information from reports
- Generate easy-to-understand summaries
- Highlight abnormal findings
- Suggest possible follow-up actions

---

### 💬 AI Health Assistant

Users can chat with an AI assistant to:

- Understand medical terms
- Ask questions about reports
- Get personalized health guidance
- Receive simplified explanations

---

### 📈 Health Timeline

All medical reports are organized into a timeline, helping users track their health history over time.

---

### 💊 Medicine Reminders

- Add medicines
- Manage schedules
- Never miss important doses

---

### 🚑 Emergency QR Health Card

Generate a QR code that can be scanned by doctors, hospitals, or first responders during emergencies.

The QR provides instant access to:

- Blood Group
- Allergies
- Current Medicines
- Chronic Diseases
- Emergency Contacts
- Doctor Information

No login required during emergencies.

---

### 🔒 Secure Authentication

Every user's health records remain private and secure using **Clerk Authentication**.

---

# 🏗 Tech Stack

| Category | Technologies |
|----------|--------------|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Authentication | Clerk |
| AI | Gemini API |
| Cloud Storage | Cloudinary |

---

# 📂 Project Structure

```
app/
│
├── (auth)
├── (dashboard)
├── api/
├── emergency/
│
lib/
│
prisma/
│
public/
```

---

# 🚀Getting Started

### Clone the repository

```bash
git clone https://github.com/Vaishalijharbade/MedMindAI.git

cd MedMindAI
```

### Install dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env.local` file and add:

```env
DATABASE_URL=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

GEMINI_API_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

NEXT_PUBLIC_APP_URL=
```

### Start the development server

```bash
npm run dev
```

---

# 📸 Screenshots
- Landing Page
<img width="1917" height="872" alt="image" src="https://github.com/user-attachments/assets/7db86ef5-cdfe-4345-9c76-29b872f02731" />

- Dashboard

<img width="1917" height="877" alt="image" src="https://github.com/user-attachments/assets/e3ff977b-083a-41db-aebc-a48c86f27a15" />

- Medical Report Upload
<img width="1916" height="868" alt="image" src="https://github.com/user-attachments/assets/5445b504-b000-411f-b8eb-7c8ddd814c40" />

- AI Report Analysis
<img width="1118" height="858" alt="image" src="https://github.com/user-attachments/assets/3cb9a363-e67d-420d-8ad8-4528927e3d6e" />

- AI Health Assistant

- Emergency QR Health Card
<img width="1917" height="862" alt="image" src="https://github.com/user-attachments/assets/8f52ed2f-cb71-49e4-a087-5e4b7e01dee3" />


---

# 🎯 Future Scope

Although this is a hackathon prototype, MedMind AI has the potential to grow into a complete digital healthcare platform.

Future enhancements include:

- 📱 Mobile application
- ⌚ Smartwatch & wearable integration
- 👨‍⚕️ Doctor dashboard
- 🏥 Hospital integration
- 🌍 Multi-language support
- 📊 Predictive health analytics

---

# 👥 Team

| Name | Role | Github |
|------|------| -------|
| Vaishali Jharbade | Full Stack Developer | github : https://github.com/Vaishalijharbade|
| Devesh Gupta | AI Integration | github : https://github.com/devexxxx|
| Anant Neekhra | Backend Development | github : https://github.com/Anant-Neekhra|


---

# ❤️ Why MedMind AI?

Healthcare should be simple, organized, and accessible.

MedMind AI combines secure medical record management with the power of artificial intelligence to help users understand their health, stay on top of medications, and access critical medical information when it matters the most.

---

## 🌟 Built for Hackathon 2026

If you found this project interesting, feel free to ⭐ the repository!
