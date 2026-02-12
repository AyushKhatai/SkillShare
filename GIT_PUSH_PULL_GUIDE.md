# GitHub Push/Pull Guide (Step-by-Step)

This guide explains how to move your local changes to GitHub and then download them on another machine (like your desktop).

## 1) Push local changes to GitHub

### A. Open terminal in your project folder
```bash
cd /path/to/SkillShare
```

### B. Check current branch and status
```bash
git branch --show-current
git status
```

### C. Save your work in a commit
```bash
git add .
git commit -m "Describe your changes"
```

### D. Connect GitHub remote (one-time setup)
Check if remote exists:
```bash
git remote -v
```

If nothing is shown, add your repo URL:
```bash
git remote add origin https://github.com/<username>/<repo>.git
```

### E. Push your branch
First push of this branch:
```bash
git push -u origin <branch-name>
```

Later pushes:
```bash
git push
```

---

## 2) Pull those changes on your desktop

### Case A: Repo already exists on desktop
```bash
cd /path/to/desktop/SkillShare
git fetch origin
git checkout <branch-name>
git pull origin <branch-name>
```

### Case B: Repo is not downloaded yet
```bash
git clone https://github.com/<username>/<repo>.git
cd <repo>
git checkout <branch-name>
```

---

## 3) Verify you received latest changes
```bash
git branch --show-current
git log --oneline -n 5
```

You should see the correct branch name and latest commit messages.
