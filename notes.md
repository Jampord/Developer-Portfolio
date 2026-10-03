Do this after the first PR, because the CI check has to have run once before GitHub lets you require it.

Repo → Settings → Rules → Rulesets → New ruleset → New branch ruleset.
Name it Protect main, set Enforcement status to Active, and under Target branches add the default branch.
Turn on:
Restrict deletions
Block force pushes
Require a pull request before merging, with required approvals set to 0. You're the only developer, and you can't approve your own PR, so a higher number would lock you out.
Require status checks to pass, then add ci (the job name from the workflow).
Save.

From now on, a direct git push origin main is rejected, and every change goes through a branch, a PR, a passing CI run and a Vercel preview.

Your daily loop

#### powershell

git checkout main
git pull
git checkout -b feat/hero-section

# ...work, then commit as you go...

git push -u origin feat/hero-section

# open the PR, check the preview, squash and merge

git checkout main
git pull
git branch -d feat/hero-section

Keep each PR small and about one thing, such as one section or one animation. They're easier to review, and the Vercel preview lets you check the result on your phone before it reaches production.
