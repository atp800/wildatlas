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


const products = defineCollection({
	loader: glob({ 
		pattern: "**/*.{md,mdx}", 
		base: "./src/content/products", // Create this folder!
	}),
	schema: ({ image }) => z.object({
		title: z.string(),
		description: z.string(),
		
		// STORE SPECIFIC FIELDS
		price: z.number(), // e.g., 25.00
		stripePriceId: z.string(), // Crucial: The price_xxxxxx ID from your Stripe dashboard
		
		// CATEGORIZATION
		physical: z.boolean(), // Helps you decide whether to collect shipping info
		downloadURL: z.string().optional(), // For digital products, provide a download link after purchase
		category: z.string(), // e.g., "clothing", "ebook", "digital-print", "eco"
		type: z.string().optional(), // e.g., "t-shirt", "hoodie", "poster", "guide"
		collections: z.array(z.string()).optional(), // e.g., ["summer-collection", "best-sellers"]
		gender: z.enum(["men", "women", "unisex"]).optional(), // If applicable

		// IMAGES
		image: image(), // Main product thumbnail
		gallery: z.array(image()).optional(), // Optional array of extra images
		
		// OTHER INFO
		inStock: z.boolean().default(true),
		live: z.boolean().default(false),
		features: z.array(z.string()).optional(), // Bullet points e.g.,["100% Cotton", "Eco-friendly"]
		created_at: z.coerce.date().optional(),
	}),
});

// 3. Export BOTH collections
export const collections = { articles, products };
