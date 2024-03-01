import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	type: 'content',
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string(),		
		image: z.string(),
		description: z.string(),
		section: z.string(),
		topic: z.string().optional().nullable(),
		tags: z.string().optional().nullable(),
		author: z.string().optional().nullable(),
		views: z.coerce.number().optional(),
		highlighted: z.boolean(),
		status: z.string(),
		// Transform string to Date object
		created_at: z.coerce.date(),		
		published_at: z.string().nullable().transform((val) => val === "null" ? null : new Date(val)),
		updated_at: z.string().nullable().transform((val) => val === "null" ? null : new Date(val)),
		deleted_at: z.string().nullable().transform((val) => val === "null" ? null : new Date(val)),
	}),
});


const articles = defineCollection({
	type: 'content',
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string(),		
		image: z.string(),
		description: z.string(),
		section: z.string(),
		topic: z.string().optional().nullable(),
		tags: z.string().optional().nullable(),
		author: z.string().optional().nullable(),
		views: z.coerce.number().optional(),
		highlighted: z.boolean(),
		status: z.string(),
		// Transform string to Date object
		created_at: z.coerce.date(),		
		published_at: z.string().nullable().transform((val) => val === "null" ? null : new Date(val)),
		updated_at: z.string().nullable().transform((val) => val === "null" ? null : new Date(val)),
		deleted_at: z.string().nullable().transform((val) => val === "null" ? null : new Date(val)),
	}),
});


const reviews = defineCollection({
	type: 'content',
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string(),		
		image: z.string(),
		description: z.string(),
		section: z.string(),
		topic: z.string().optional().nullable(),
		tags: z.string().optional().nullable(),
		author: z.string().optional().nullable(),
		views: z.coerce.number().optional(),
		highlighted: z.boolean(),
		status: z.string(),
		// Transform string to Date object
		created_at: z.coerce.date(),		
		published_at: z.string().nullable().transform((val) => val === "null" ? null : new Date(val)),
		updated_at: z.string().nullable().transform((val) => val === "null" ? null : new Date(val)),
		deleted_at: z.string().nullable().transform((val) => val === "null" ? null : new Date(val)),
	}),
});


const travel = defineCollection({
	type: 'content',
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string(),		
		image: z.string(),
		description: z.string(),
		section: z.string(),
		topic: z.string().optional().nullable(),
		tags: z.string().optional().nullable(),
		author: z.string().optional().nullable(),
		views: z.number().optional(),
		highlighted: z.boolean(),
		status: z.string(),
		// Transform string to Date object
		created_at: z.coerce.date(),		
		published_at: z.string().nullable().transform((val) => val === "null" ? null : new Date(val)),
		updated_at: z.string().nullable().transform((val) => val === "null" ? null : new Date(val)),
		deleted_at: z.string().nullable().transform((val) => val === "null" ? null : new Date(val)),
	}),
});

export const collections = { blog, articles };