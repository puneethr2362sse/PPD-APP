# VerifyAI — Neural Fact-Checking & Deepfake Forensics Platform

[![Live Website](https://img.shields.io/badge/Live_Website-https%3A%2F%2Fapp--eight--woad--32.vercel.app-06B6D4?style=for-the-badge&logo=vercel&logoColor=white)](https://app-eight-woad-32.vercel.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-puneethr2362sse%2FPPD--APP-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/puneethr2362sse/PPD-APP)
[![CI/CD Pipeline](https://img.shields.io/badge/CI%2FCD-Passing-10B981?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/puneethr2362sse/PPD-APP/actions)
[![Tests Passing](https://img.shields.io/badge/Tests-329%20Passed-10B981?style=for-the-badge&logo=vitest&logoColor=white)](https://github.com/puneethr2362sse/PPD-APP/actions)
[![Firebase DB](https://img.shields.io/badge/Database-Firebase%20Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Expo Mobile](https://img.shields.io/badge/Mobile-Expo%20%2F%20React%20Native-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)

---

## 🌐 Live Production & Deployment Links
- **Primary Production Domain**: [https://app-eight-woad-32.vercel.app](https://app-eight-woad-32.vercel.app)
- **Direct Vercel Deployment**: [https://app-mndieewpv-puneethr2362sse-1511.vercel.app](https://app-mndieewpv-puneethr2362sse-1511.vercel.app)
- **GitHub Repository**: [https://github.com/puneethr2362sse/PPD-APP](https://github.com/puneethr2362sse/PPD-APP)
- **CI/CD Workflow Runs**: [https://github.com/puneethr2362sse/PPD-APP/actions](https://github.com/puneethr2362sse/PPD-APP/actions)

---

## 📊 Automated Test Execution Matrix (329 Tests)

VerifyAI includes an industrial-grade automated verification test suite spanning **329 comprehensive tests** running across 7 dedicated suites:

| Test Suite | Total Tests | Passed | Failed | Duration | Status | Report Artifact |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Selenium Web E2E Suite** | **80** | 80 | 0 | ~329ms | ✅ PASSED | `selenium-report` |
| **Appium Mobile Native Suite** | **75** | 75 | 0 | ~19ms | ✅ PASSED | `appium-report` |
| **High-Concurrency Load Suite** | **75** | 75 | 0 | ~340ms | ✅ PASSED | `load-report` |
| **Security Assessment Suite** | **75** | 75 | 0 | ~76ms | ✅ PASSED | `security-report` |
| **Real-Time Fact Verification Suite** | **7** | 7 | 0 | ~48s | ✅ PASSED | `realtime-report` |
| **User ID & Profile Flow Suite** | **17** | 17 | 0 | ~300ms | ✅ PASSED | `profile-report` |
| **TOTAL** | **329** | **329** | **0** | **~50s** | 🏆 **100%** | **Published Artifacts** |

---

## 📦 GitHub Actions Artifacts Produced During Runtime

Each run of the GitHub Actions CI/CD pipeline produces downloadable artifacts:
1. 📄 **`selenium-report`**: Web interaction, OTP auto-advance, responsive desktop shell, and veracity workflow test reports.
2. 📱 **`appium-report`**: Mobile Expo camera, photo gallery selection, 4-box OTP, and touch gesture test reports.
3. ⚡ **`load-report`**: High-concurrency throughput benchmarks, Firestore atomic write tests, and latency reports.
4. 🛡️ **`security-report`**: Zero-password architecture validation, XSS sanitization, and multi-tenant isolation assessment.
5. 🌐 **`web-build`**: Full production distribution bundle.

---

## 🛠️ Architecture & Dual Experience

```
VerifyAI Platform
├── 1. Web Application (React 19 + TypeScript + Tailwind CSS + Vite)
│   ├── Responsive desktop shell (no artificial phone frames)
│   ├── Floating device switcher with QR Code modal for mobile phones
│   └── 4-Box auto-advancing OTP authentication
│
├── 2. Native Mobile App (React Native + Expo SDK 51)
│   ├── Located in /mobile directory
│   ├── Native Camera & Photo Gallery integration (expo-image-picker)
│   ├── React Navigation (Auth Stack & Bottom Tabs)
│   └── AsyncStorage native offline caching
│
└── 3. Backend & Vercel Serverless Layer (Express.js + Firebase / Firestore)
    ├── api/index.ts: Vercel Serverless Functions Entrypoint
    ├── Users Collection: User profiles (ID, Name, Email, Phone)
    ├── OTPs Collection: Cryptographic 4-digit OTPs with 10-minute expiry
    ├── Scans Collection: Isolated forensic records with 0/100 or 100/100 scoring
    └── News Collection: Curated fact-checked trending news
```

---

## 🚀 Running the Project Locally

### 1. Web Application & Backend Server
```bash
npm install
npm run dev
```
- **Web App**: `http://localhost:5173/`
- **Express Backend**: `http://localhost:5000/api`

### 2. Native Expo Mobile App
```bash
npm run mobile
```
Scan the generated QR code in the **Expo Go** app on your iPhone or Android phone.

### 3. Running the Automated Tests
```bash
npm test
```
*(or `npx vitest run`)*

---

## 🔒 Security Architecture
- **100% Passwordless**: No passwords stored in the database. Authentication is handled exclusively through single-use 4-digit OTP codes.
- **Tenant Isolation**: All scans and history queries are strictly scoped to the authenticated user's email.
- **Strict Scoring**: Veracity verdicts are scored strictly as **`0/100 FAKE`** (with glowing rose alert) or **`100/100 REAL`** (with glowing emerald alert).
