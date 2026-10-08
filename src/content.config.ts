import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const month = z.string().regex(/^\d{4}-\d{2}$/, 'Use YYYY-MM');

const experience = defineCollection({
    loader: glob({ pattern: '*.json', base: './src/content/experience' }),
    schema: z.object({
        order: z.number(),
        org: z.string(),
        unit: z.string().optional(),
        place: z.string(),
        start: month.nullable(),
        end: month.nullable(),
        current: z.boolean().default(false),
        tags: z.array(z.string()).default([]),
        en: z.object({ role: z.string(), contract: z.string().optional(), points: z.array(z.string()) }),
        fr: z.object({ role: z.string(), contract: z.string().optional(), points: z.array(z.string()) }),
    }),
});

const projectText = z.object({
    title: z.string(),
    summary: z.string(),
    role: z.string(),
    architecture: z.string().nullable().default(null),
    privacy: z.string().nullable().default(null),
    hosting: z.string().nullable().default(null),
    license: z.string().nullable().default(null),
    sections: z.array(z.object({ heading: z.string(), body: z.array(z.string()) })).default([]),
});

const projects = defineCollection({
    loader: glob({ pattern: '*.json', base: './src/content/projects' }),
    schema: z.object({
        order: z.number(),
        featured: z.boolean().default(false),
        status: z.enum(['active', 'done', 'archived']),
        start: month.nullable(),
        end: month.nullable(),
        stack: z.array(z.string()).default([]),
        /** Set to true only when a full case-study page should be generated. */
        caseStudy: z.boolean().default(false),
        en: projectText,
        fr: projectText,
    }),
});

const education = defineCollection({
    loader: glob({ pattern: '*.json', base: './src/content/education' }),
    schema: z.object({
        order: z.number(),
        school: z.string(),
        place: z.string(),
        start: month.nullable(),
        end: month.nullable(),
        en: z.object({ title: z.string(), detail: z.string().optional() }),
        fr: z.object({ title: z.string(), detail: z.string().optional() }),
    }),
});

export const collections = { experience, projects, education };
