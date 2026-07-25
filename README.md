# Microsoft Entra ID IAM Homelab v3

A rebuilt interactive homelab with **31 labs** and **130 guided steps**.

## What was fixed
- All 31 lab cards open real interactive content.
- No placeholder alert-only labs.
- Previous / Mark Done & Continue / step-number navigation are explicitly wired.
- Lab review screen works.
- Dark mode persists.
- Notes and progress persist in localStorage.
- Search works in the sidebar and dashboard.
- Export progress works.
- Reset progress works.
- Help modal creates a prompt for the exact current step.
- Existing Lab 1 progress is migrated from older versions when those localStorage keys exist.
- Dynamic-group troubleshooting explicitly accounts for processing delay and Validate Rules.

## Instruction format
Every guided step contains:
1. **Where to go**
2. **What to click / do**
3. **What to enter / configure**
4. **Why you're doing it**
5. **How to verify it worked**
6. **Troubleshooting**
7. **SC-300 / interview connection** when useful
8. **Lab safety** when the action could affect access or secrets

## Important
This is a lab environment. Keep Conditional Access in Report-only while learning, avoid assigning Global Administrator just to complete a task, and never put passwords, Temporary Access Pass values, or client-secret values in GitHub.

Replace the old `index.html` and `README.md` in the existing GitHub Pages repository with these files.
