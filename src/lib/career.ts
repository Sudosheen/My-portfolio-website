/** Whole calendar months from a "YYYY-MM" start to `now` (UTC); never negative. */
export function monthsSince(start: string, now: Date): number {
    const [year, month] = start.split('-').map(Number);
    return Math.max(0, (now.getUTCFullYear() - year) * 12 + (now.getUTCMonth() + 1 - month));
}

export function yearsMonths(totalMonths: number): { years: number; months: number } {
    return { years: Math.floor(totalMonths / 12), months: totalMonths % 12 };
}
