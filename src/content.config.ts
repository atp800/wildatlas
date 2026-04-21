import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articles = defineCollection({
	// Tell Astro to load all md and mdx files from this specific folder
	loader: glob({ 
		pattern: "**/*.{md,mdx}", 
		base: "./src/content/articles", 
		// generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/, ''), 
	}),
	schema: ({ image }) => z.object({
		title: z.string(),		
		image: image(),
		description: z.string(),
		section: z.string(),
		topic: z.string().optional().nullable(),
		tags: z.string().optional().nullable(),
		author: z.string().optional().nullable(),
		views: z.coerce.number().optional(),
		highlighted: z.boolean(),
		status: z.string(),
		created_at: z.coerce.date(),		
		published_at: z.string().nullable().transform((val) => val === "null" ? null : new Date(val)),
		updated_at: z.string().nullable().transform((val) => val === "null" ? null : new Date(val)),
		deleted_at: z.string().nullable().transform((val) => val === "null" ? null : new Date(val)),
	}),
});


export const collections = { articles };