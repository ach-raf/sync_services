# GitHub Authentication Setup Guide

This guide helps you set up authentication so the GitHub Sync System can push and pull changes without prompting for passwords.

## 🔐 Why Authentication is Needed

When the backend tries to push or pull from GitHub, it needs to authenticate. Without proper setup:

- Git will prompt for username/password (which hangs the backend)
- Operations will fail with "Authentication failed" errors
- The sync system won't work

## 🎯 Choose Your Authentication Method

### Method 1: SSH Keys (Recommended) 🔑

**Pros:** Most secure, no password prompts, works with 2FA
**Cons:** Initial setup required

#### Windows Setup:

1. **Generate SSH key:**

   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

   - Press Enter for default file location
   - Enter a passphrase (optional but recommended)

2. **Add SSH key to ssh-agent:**

   ```bash
   # Start ssh-agent
   eval "$(ssh-agent -s)"

   # Add your SSH private key
   ssh-add ~/.ssh/id_ed25519
   ```

3. **Copy public key to clipboard:**

   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```

   Copy the entire output

4. **Add key to GitHub:**

   - Go to GitHub → Settings → SSH and GPG keys
   - Click "New SSH key"
   - Paste your public key
   - Give it a title (e.g., "My PC - Sync System")
   - Click "Add SSH key"

5. **Configure your repository:**

   ```bash
   # Change remote URL to use SSH
   git remote set-url origin git@github.com:yourusername/your-repo.git
   ```

6. **Test the connection:**
   ```bash
   ssh -T git@github.com
   ```
   You should see: "Hi username! You've successfully authenticated..."

### Method 2: Personal Access Token (PAT) 🎫

**Pros:** Easy to set up, works with HTTPS
**Cons:** Token management required

#### Setup Steps:

1. **Create Personal Access Token:**

   - Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Give it a name like "Sync System"
   - Select scope: `repo` (Full control of private repositories)
   - Set expiration (recommend 1 year)
   - Click "Generate token"
   - **IMPORTANT:** Copy the token immediately (you won't see it again)

2. **Configure Git credential helper:**

   ```bash
   git config --global credential.helper store
   ```

3. **Set repository URL:**

   ```bash
   git remote set-url origin https://github.com/yourusername/your-repo.git
   ```

4. **Test authentication:**
   ```bash
   git ls-remote origin
   ```
   - Enter your GitHub username
   - Enter your **token** (not your password) when prompted

### Method 3: GitHub CLI (Easiest) 🚀

**Pros:** Handles everything automatically
**Cons:** Requires additional software

#### Setup Steps:

1. **Install GitHub CLI:**

   - Windows: Download from https://cli.github.com/
   - Or use winget: `winget install GitHub.cli`

2. **Authenticate:**

   ```bash
   gh auth login
   ```

   Follow the prompts:

   - Choose "GitHub.com"
   - Choose "HTTPS"
   - Authenticate via web browser

3. **Clone or set remote:**

   ```bash
   # If starting fresh
   gh repo clone yourusername/your-repo

   # If repository already exists
   git remote set-url origin https://github.com/yourusername/your-repo.git
   ```

## 🧪 Testing Your Setup

After setting up authentication, test it:

### For SSH:

```bash
ssh -T git@github.com
```

Should show: "Hi username! You've successfully authenticated..."

### For HTTPS (Token or GitHub CLI):

```bash
git ls-remote origin
```

Should list repository references without prompting for credentials.

### Final Test:

```bash
# Make a test change
echo "Authentication test" > test.txt
git add test.txt
git commit -m "Test authentication"
git push
```

If this works without prompting for credentials, you're all set!

## 🚨 Troubleshooting

### "Permission denied (publickey)" (SSH)

- Your SSH key isn't added to GitHub
- SSH agent isn't running
- Wrong SSH key being used

**Solution:**

```bash
ssh-add -l  # List loaded keys
ssh-add ~/.ssh/id_ed25519  # Add your key
ssh -T git@github.com  # Test again
```

### "Authentication failed" (Token)

- Token is incorrect or expired
- Using password instead of token
- Credential helper not configured

**Solution:**

```bash
git config --global credential.helper store
git credential-manager-core erase https://github.com
# Try git operation again and enter token
```

### "Could not read from remote repository"

- Wrong repository URL
- No access to repository
- Network issues

**Solution:**

```bash
git remote -v  # Check current URLs
git remote set-url origin [correct-url]
```

## 🔄 For Multiple PCs

Set up authentication on **each PC** that will use the sync system:

1. **Option A:** Use the same SSH key on all PCs

   - Copy `~/.ssh/id_ed25519` and `~/.ssh/id_ed25519.pub` to other PCs
   - Add the key to ssh-agent on each PC

2. **Option B:** Generate separate SSH keys for each PC

   - Follow the SSH setup for each PC
   - Add each public key to GitHub with different names

3. **Option C:** Use the same Personal Access Token
   - Use the same token on all PCs
   - Set up credential helper on each PC

## 🛡️ Security Best Practices

1. **SSH Keys:**

   - Use a passphrase for your SSH key
   - Don't share private keys
   - Generate new keys if compromised

2. **Personal Access Tokens:**

   - Set appropriate expiration dates
   - Use minimal required scopes
   - Revoke unused tokens

3. **General:**
   - Don't commit credentials to repositories
   - Use different authentication for different projects if needed
   - Regularly review your GitHub access settings

## ✅ Success Indicators

You know authentication is working when:

- Git push/pull operations complete without prompts
- The sync system's "Commit & Push" button works
- No "Authentication failed" errors in the backend logs
- Status shows "Up to date" or proper sync states

Once authentication is properly set up, the GitHub Sync System will work seamlessly across all your PCs!
