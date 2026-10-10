/** Whole calendar months from a "YYYY-MM" start to `now` (UTC); never negative. */
export function monthsSince(start: string, now: Date): number {
    const [year, month = 1] = start.split('-').map(Number);
    const months = (now.getUTCFullYear() - year) * 12 + (now.getUTCMonth() + 1 - month);
    return Number.isFinite(months) ? Math.max(0, months) : 0;
}

export function yearsMonths(totalMonths: number): { years: number; months: number } {
    return { years: Math.floor(totalMonths / 12), months: totalMonths % 12 };
}
