# Git Feature Branch Workflow for LankaFIX Team

## 1. Start a New Feature
**Always start from the latest code.**
```bash
# Switch to main and get latest changes
git checkout main
git pull origin main

# Create your feature branch
# Naming: feature/<your-feature-name>
# Example: feature/worker-profiles
git checkout -b feature/worker-profiles
```

## 2. Work & Commit
Make your changes in your branch. Commit often!
```bash
git add .
git commit -m "Added worker profile model and repository"
```

## 3. Push to GitHub
Upload your branch so the team can see it.
```bash
# The first time you push a new branch:
git push -u origin feature/worker-profiles

# Afterwards, just:
git push
```

## 4. Option A: Merge via GitHub (Recommended)
**Best for teams (Code Review).**
1. Go to GitHub.
2. Click "Compare & pull request".
3. Before merging, run these checks locally:
   - `./mvnw test` from `backend/WedaLK/demo`
   - `npm run lint` from `frontend`
   - `npm test -- --watchAll=false` from `frontend`
4. Review changes.
5. Click "Merge Pull Request".

## 5. Option B: Merge via Terminal (Manual)
**Use this if you are a solo admin or don't need code reviews.**

1. Switch to main and update it:
   ```bash
   git checkout main
   git pull origin main
   ```

2. Merge your feature branch into main:
   ```bash
   git merge feature/worker-profiles
   ```
   *(Replace `feature/worker-profiles` with your actual branch name)*

3. Push the updated main to GitHub:
   ```bash
   git push origin main
   ```

## 6. Cleanup
After merging (via Option A or B), delete the old branch:
```bash
# Delete local branch
git branch -d feature/worker-profiles

# Option: Delete remote branch
git push origin --delete feature/worker-profiles
```
