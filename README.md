# VerifyAI — Neural Fact-Checking & Deepfake Forensics Platform

[![Live Website](https://img.shields.io/badge/Live_Website-https%3A%2F%2Fapp--eight--woad--32.vercel.app-06B6D4?style=for-the-badge&logo=vercel&logoColor=white)](https://app-eight-woad-32.vercel.app)
[![Tests Passing](https://img.shields.io/badge/Tests-305%20Passed-10B981?style=for-the-badge&logo=vitest&logoColor=white)](https://github.com)
[![Firebase DB](https://img.shields.io/badge/Database-Firebase%20Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Expo Mobile](https://img.shields.io/badge/Mobile-Expo%20%2F%20React%20Native-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)

---

## 🌐 Live Production Website
- **Primary Live Link**: [https://app-eight-woad-32.vercel.app](https://app-eight-woad-32.vercel.app)
- **Direct Domain**: [https://app-pxt84q3x2-puneethr2362sse-1511.vercel.app](https://app-pxt84q3x2-puneethr2362sse-1511.vercel.app)

---

## 📊 Automated Test Execution Matrix (305 Tests)

VerifyAI includes an industrial-grade automated verification test suite spanning **305 comprehensive tests** running across 4 dedicated suites:

| Test Suite | Total Tests | Passed | Failed | Duration | Status | Report Artifact |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Selenium Web E2E Suite** | **80** | 80 | 0 | ~329ms | ✅ PASSED | `selenium-report` |
| **Appium Mobile Native Suite** | **75** | 75 | 0 | ~19ms | ✅ PASSED | `appium-report` |
| **High-Concurrency Load Suite** | **75** | 75 | 0 | ~340ms | ✅ PASSED | `load-report` |
| **Security Assessment Suite** | **75** | 75 | 0 | ~76ms | ✅ PASSED | `security-report` |
| **TOTAL** | **305** | **305** | **0** | **~764ms** | 🏆 **100%** | **5 Artifacts Published** |

---

## 📦 GitHub Actions Artifacts Produced During Runtime

Each run of the GitHub Actions CI/CD pipeline produces **5 downloadable artifacts**:
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
└── 3. Backend & Database Layer (Express.js + Firebase / Firestore)
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

### 3. Running the 305 Automated Tests
```bash
npm test
```
*(or `npx vitest run`)*

---

## 🔒 Security Architecture
- **100% Passwordless**: No passwords stored in the database. Authentication is handled exclusively through single-use 4-digit OTP codes.
- **Tenant Isolation**: All scans and history queries are strictly scoped to the authenticated user's email.
- **Strict Scoring**: Veracity verdicts are scored strictly as **`0/100 FAKE`** (with glowing rose alert) or **`100/100 REAL`** (with glowing emerald alert).
