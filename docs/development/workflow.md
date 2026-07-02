# Development Workflow

This project follows a strict issue-driven branching workflow.

## Branches

- `main` is the stable branch and must always remain runnable.
- `develop` is the long-lived development branch.
- All feature, bugfix, documentation, and maintenance work starts from `develop`.
- Temporary work branches must be deleted after they are merged back into `develop`.
- `develop` is merged into `main` only when preparing a release or version tag.
- `develop` must be preserved after releases and used as the base for future work.

## Required Flow

1. Open or identify a GitHub issue before starting development work.
2. Create a new branch from `develop` for the issue.
3. Implement the change on that branch.
4. Verify the change with the relevant tests, build, or manual checks.
5. Merge the branch back into `develop` after the change is confirmed.
6. Delete the temporary branch after merge.

## Bug Fixes

- If a bug fix cannot be confidently verified by automated tests or local checks, do not close the issue.
- Do not merge uncertain fixes back into `develop` until the user has tested and confirmed them.
- Do not delete the bugfix branch until the fix is confirmed and merged.

## Releases

1. Confirm `develop` is tested and ready.
2. Merge `develop` into `main`.
3. Tag the release from `main`.
4. Keep `develop` for the next development cycle.
