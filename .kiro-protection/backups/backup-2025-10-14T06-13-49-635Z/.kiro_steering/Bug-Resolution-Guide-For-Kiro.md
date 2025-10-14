<!------------------------------------------------------------------------------------
   Add Rules to this file or a short description and have Kiro refine them for you:   # 🧰 Kiro Bug Handling Guide – Based on Jobs-to-be-Done (JTBD)

This guide outlines how to approach bug detection and resolution using the **Jobs-to-be-Done (JTBD)** framework, inspired by *"Competing with Luck"* by Clayton M. Christensen.

## 🎯 Core Principle

> Bugs are not just technical errors — they are **interruptions in the user's progress toward a goal** (a "job to be done").

Your mission is not just to fix a line of code. It is to restore the **user's ability to complete their job** successfully, reliably, and with confidence.

---

## 🧩 Step-by-Step Process

### 🥇 Step 1: Identify the Job to Be Done
Ask:
- What **progress** was the user trying to make?
- What **outcome** were they expecting?
- What **circumstance** were they in when the issue occurred?

Example:
> “User tried to confirm their email to access the visibility report. The confirmation link failed.”

> JTBD = *"Get trustworthy visibility analysis of my restaurant, fast and without confusion."*

---

### 🥈 Step 2: Surface the Friction
Ask:
- Where did the process **break down**?
- Was the **UI unclear**? Was the **system too slow**, or **unresponsive**?
- Did the user feel **stuck**, **confused**, or **doubtful**?

Collect:
- Logs (CloudWatch, Sentry, etc.)
- Screenshots or error messages
- User actions leading up to the bug

---

### 🥉 Step 3: Classify the Root Cause
Use one or more of these categories:
- Logic Error (e.g., condition not met)
- Broken Flow (e.g., missing redirect, null field)
- Wrong Assumption (e.g., language param always present)
- Race Condition / Timeout
- Configuration Mismatch (e.g., email not sent due to bad secrets)
- DX / UX Misalignment (e.g., unclear feedback)

Be precise — only then can you improve *future robustness*.

---

### 🛠️ Step 4: Design the Resolution
Fix the root cause — *but do not stop there*.

Also ask:
- How do we prevent this in the future?
- What test would catch this next time?
- Should we update monitoring, UX, onboarding instructions?

---

### ✅ Step 5: Validate the Outcome
Ask:
- Does the user now **successfully complete their job**?
- Do they understand what’s happening?
- Is there any residual **confusion, risk, or loss of trust**?

---

### 📈 Bonus: Track Repeat Patterns
Over time, group similar bugs into **Job Failures**:
- “Onboarding breaks at email confirmation stage.”
- “AI analysis fails silently.”
- “User doesn’t know what to do after result page.”

Then build **systemic improvements** to eliminate whole bug classes.

---

## 🧠 Mindset Summary
> Don’t fix bugs — *fix broken progress*.

Kiro, your job is not just to write clean code, but to ensure that users can confidently move forward toward their goals.


-------------------------------------------------------------------------------------> 