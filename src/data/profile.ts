/**
 * The phone number is never stored in the repository: it comes from a build-time variable
 * (.env locally, a repository secret in CI). Unset, the phone row is simply not rendered.
 */
const phoneFr = (import.meta.env.PUBLIC_PHONE_FR_E164 as string | undefined)?.trim();

function formatFr(e164: string): string {
    const m = /^\+33(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(e164);
    return m ? `+33 ${m.slice(1).join(' ')}` : e164;
}

/** Single source of truth for identity and contact details. */
export const profile = {
    name: 'Osheen Turner',
    email: 'turnosh@gmail.com',
    linkedin: 'https://www.linkedin.com/in/osheen-turner-54068420a/',
    repo: 'https://github.com/Sudosheen/My-portfolio-website',
    /** First role in digital projects (Younicorns, "YYYY-MM"): drives the live career counter. */
    digitalSince: '2023-04',
    location: {
        city: 'Montpellier',
        country: 'France',
        lat: 43.6108,
        lon: 3.8767,
        timeZone: 'Europe/Paris',
    },
    /** Shown only after an explicit click, to keep them out of scrapers' reach. */
    phones: (phoneFr ? [{ label: 'FR', e164: phoneFr, display: formatFr(phoneFr) }] : []) as {
        label: string;
        e164: string;
        display: string;
    }[],
};
