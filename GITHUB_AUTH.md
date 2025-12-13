# GitHub Authentication Setup

The push failed because GitHub requires authentication. Choose one method:

## Option 1: Personal Access Token (Recommended)

1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name it (e.g., "ChessApp Push")
4. Select scope: **repo** (full control of private repositories)
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)

Then run:
```bash
git push -u origin main
```
When prompted:
- Username: `Tredoux555`
- Password: **Paste your token** (not your GitHub password)

## Option 2: SSH (More Secure)

1. Generate SSH key (if you don't have one):
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

2. Add to GitHub:
   - Copy: `cat ~/.ssh/id_ed25519.pub`
   - Go to: https://github.com/settings/keys
   - Click "New SSH key"
   - Paste and save

3. Change remote to SSH:
```bash
git remote set-url origin git@github.com:Tredoux555/ChessApp-2.git
git push -u origin main
```

## Option 3: GitHub CLI

```bash
gh auth login
git push -u origin main
```

