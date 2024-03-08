import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION, SITE_URL } from '../consts';

// A helper function to standardize the structure of feed items
function createFeedItem(post, section) {
  return {
    title: post.data.title,
    description: post.data.description,
    link: `${SITE_URL}/${section}/${post.slug}/`,
    guid: `${SITE_URL}/${section}/${post.slug}/`,
    pubDate: new Date(post.data.published_at).toUTCString(),
    categories: post.data.tags ? post.data.tags.split(',') : [], // Check if tags exist and split
  };
}

export async function GET(context) {
  // Fetch posts from all collections
  const blogPosts = (await getCollection('blog'))
	.filter(post => post.data.published_at && post.data.published_at !== 'null') // Add this line to filter out posts without published_at
	.map(post => createFeedItem(post, 'blog'));
  const reviewPosts = (await getCollection('reviews'))
	.filter(post => post.data.published_at && post.data.published_at !== 'null') // Add this line to filter out posts without published_at
	.map(post => createFeedItem(post, 'reviews'));
  const travelPosts = (await getCollection('travel'))
	.filter(post => post.data.published_at && post.data.published_at !== 'null') // Add this line to filter out posts without published_at
	.map(post => createFeedItem(post, 'travel'));
  const articlePosts = (await getCollection('articles'))
	.filter(post => post.data.published_at && post.data.published_at !== 'null') // Add this line to filter out posts without published_at
	.map(post => createFeedItem(post, 'articles'));

  // Combine all posts into a single array and sort them by publication date
  const allPosts = [...blogPosts, ...reviewPosts, ...travelPosts, ...articlePosts]
    .filter(item => item.status !== 'draft') // Filter out draft posts
    .sort((a, b) => new Date(b.data.published_at) - new Date(a.data.published_at)); // Sort by date, latest first

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: SITE_URL,
    items: allPosts
  });
}