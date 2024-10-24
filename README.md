# word-hunt SWE experience project

Welcome to the word-hunt SWE experience project! Here we will go over everything you'll need to know to make contributions, as well as understanding a little bit about GitHub contribution essentials

## Table of Contents
- [Project Management](#project-management)
- [Issue Management](#issue-management)
- [Labeling System](#labeling-system)
- [How to Contribute](#how-to-contribute)
- [Resolving Conflicts](#resolving-conflicts)
- [Important Commands](#important-commands)

## Project Management

In GitHub, we will be utilizing these tools to help keep track of features and changes
- **Issues**: To track tasks and features
- **Project Boards**: To visualize progress and manage workflow

## Issue Management

If you come across a bug or a feature you'd like to see but don't want to develop it yourself, you are free to create an issue yourself in hopes that someone else may pick it up. If you are able to develop a feature on your own, you can create a pull request with the new code for approval. As usual, if you are to create a pull request and make a contribution, please follow the [contribution guidelines](#contribution-guidelines)

### Creating Issues
- Navigate to the **Issues** tab
- Click **New issue**

When creating an issue, please include:
- A clear title
- A detailed description of the task or bug
- A detailed explanation of why the issue is neccessary or is major enough to be offloaded to all the contributors to work on. Include neccessary context
- Examples of existing issue structures can be seen in the **Issues** tab
- Labels to categorize the issue (see [Labeling System](#labeling-system))

### Status Tracking
Contributors should update the status of issues regularly. Use the project board to move issues from the **To Do** column to the **In Progress** column when starting work and to **Completed** when finished

## Labeling System

These labels will be used to improve clarity in the development process

- **Type of Work**:
  - `backend`
  - `frontend`
  - `bug`
  - `feature`

- **Status**:
  - `to do`
  - `in progress`
  - `in review`
  - `completed`

- **Priority**:
  - `high priority`
  - `medium priority`
  - `low priority`

## How to Contribute

### Forking the repository
First, you want to fork the repository to make a working copy of the `main` branch. This can be done by clicking the **Fork** button while on the repository page.

### Clone your newly forked repository
To make changes to the codebase, you must clone the repository. To do so, run this script in your terminal on your local machine
```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/word-hunt.git
```
This command can also be found inside the repository page under the **Code** button. Use HTTPS for cloning, unless you have SSH keys set up on your GitHub account.

### Set the original repository as the `upstream` repository
To be able to pull changes from the original repository, you must configure it as a remote on your local repository
```bash
git remote add upstream https://github.com/davidjnovak/word-hunt
```
After running this, you can run commands like `git fetch upstream`

### Claiming Issues
Contributors should assign themselves issues as follows
1. Navigate ot the **Issues** tab
2. Click on the issue you wish to work on
3. Comment on the issue with a message like "Claiming this issue"
4. Add the **In Progress** label to the issue

### Create a branch on your forked repository
After claiming a new issue, you must create a new branch for the new feature development. The purpose of creating a branch is to ensure that the changes you make stay isolated in your development environment (branch), and makes [resolving conflicts](#resolving-conflicts) simpler.

To create a new branch, run the following command in your terminal where {feature-name} is the name of the feature you're adding
```bash
git checkout -b feature/{feature-name}
```

To switch to your branch, or to a different one, you can run
```bash
git checkout {branch-name}
```

**NOTE**: It is good practice to periodically pull (fetch and merge) the upstream repository to your forked one to ensure you are up-to-date on your local repository. To do so, make sure you are switched to your feature development branch, and run
```bash
git fetch upstream
```
This will allow you to view changes that were made to the upstream repository, and see what changes will be made to your local one. This will NOT make changes to your local repository. To finalize the pull and make changes, you must run
```bash
git merge upstream/main
```

### Make Changes
After you have made your changes, you must commit them with a clear and meaningful message. You can make multiple commits before pushing, and it is good practice to make commits after every milestone in your development (you finished an important part of your feature).
```bash
git add .
git commit -m "Add new feature"
```

### Push Changes
Push your commits to your forked repository at the feature branch
```bash
git push origin feature/{feature-name}
```

### Create a Pull Request on Main Repository and Merge Changes
Once your development is complete, you can create a pull request on the main repository (not your forked one). To make a pull request, go to the pull requests tab on the repository and click "New pull request". You should then be able to select your fork and branch (if you cannot see the option to select a fork, click **compare across forks**).

To select your fork and branch to merge, leave the base repository and base branch alone as this is the main repository in which you are merging into, and modify the head repository to be your forked repository and the compare branch to be the feature branch you created. Make sure you are merging the corrct feature branch that corresponds to the feature of the pull request you are creating.



You should then properly title and describe the pull request, and if the changes are non-breaking and achieves the goal of the ticket you are creating the feature for, then your change will be merged into the upstream repository.

## Resolving Conflicts
Occasionally, there will be a time where you pull changes from the upstream repository, and one of the changes you pulled contained changes to a file you're working on. This will cause a conflict in the changes between your file and the pulled file, and in order for you to be able to continue making changes and push to the repository, you need to resolve those changes. If you are using Visual Studio Code, it should show you the upstream changes, and the final change on your local branch after the conflicts are resolved. If you are not using VSC or another IDE that supports conflict resolving, you can follow GitHub's [official guide](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/addressing-merge-conflicts/resolving-a-merge-conflict-using-the-command-line) on resolving conflicts using the terminal.

## Important Commands
Here is a comprehensive list of all the `Git` commands you may need or encounter during development, as well as what they do


### Setting Up
**Clone a repository**: Clones a repository from a HTTPS or SSH url to your current local directory
```bash
git clone {repository-url}
```

### Debugging Commands
**Check current working status**: Shows the status of your working directory and staging area. This will also show you conflicts if ran after a conflicting merge
```bash
git status
```

**Show commit history**: Show the commit history of your forked repository
```bash
git log
```

### Branches
**Create a new branch**: Creates a new feature branch from the main branch
```bash
git checkout -b feature/{feature-name}
```

**Switch to another branch**: Switches the current branch to another branch (given it exists)
```bash
git checkout {branch-name}
```

**Show all branches**: Lists out all the branches you have made, ideally one for each feature you've developed
```bash
git branch
```

### Fetching and Merging (Pulling)
**Fetch changes from upstream repository**: Gets the changes from upstream without applying the changes to your local repository
```bash
git fetch upstream
```

**Merge changes**: After running `git fetch`, this will apply the changes that were fetched to your local repository
```bash
git merge upstream/main
```

### Committing, Staging, and Pushing
**Stage changes**: Takes all the current changes and places them in the staging area. This must be done before committing
```bash
git add .
```
Optionally, you can also run the following to stage specific files
```bash
git add {filename}
```

**Commit staged changes**: Takes the files from the staging area and packages them to a commit with a message
```bash
git commit -m "Commit message"
```

**Push changes**: Takes all commits and pushes it to your local forked repository
```bash
git push origin feature/{feature-name}
```

### Un-doing Changes
**Revert uncommitted changes**: Discard changes that were not yet committed
```bash
git checkout -- {filename}
```

**Reset staged changes**: Unstage changes
```bash
git reset {filename}
```