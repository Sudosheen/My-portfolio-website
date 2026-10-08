import { execSync } from 'node:child_process';

function git(args: string): string | null {
    try {
        return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || null;
    } catch {
        return null;
    }
}

/** Real build facts only: nothing here is invented or hard-coded. */
export const buildInfo = {
    sha: git('rev-parse --short HEAD') ?? 'dev',
    date: new Date().toISOString().slice(0, 10),
};
