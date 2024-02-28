import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	type: 'content',
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string(),		
		image: z.string(),
		description: z.string(),
		section: z.string().optional(),
		topic: z.string().optional(),
		tags: z.string().optional(),
		author: z.string().optional(),
		views: z.coerce.number().optional(),
		status: z.string().optional(),
		// Transform string to Date object
		created_at: z.coerce.date(),		
		published_at: z.coerce.date().optional(),
		updated_at: z.coerce.date().optional(),
		deleted_at: z.coerce.date().optional(),
	}),
});

export const collections = { blog };
