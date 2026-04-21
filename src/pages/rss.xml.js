import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION, SITE_URL } from '../consts';

function createFeedItem(post) {
  // Catch invalid dates before processing
  if (!post.data.published_at || isNaN(new Date(post.data.published_at).getTime())) {
    return null;
  }
  
  return {
    title: post.data.title,
    description: post.data.description,
    // post.id is already formatted as "category/slug" (e.g. "travel/reef-safe-sunscreens")
    link: `${SITE_URL}/${post.id}/`,
    guid: `${SITE_URL}/${post.id}/`,
    pubDate: new Date(post.data.published_at).toUTCString(),
    categories: post.data.tags ? post.data.tags.split(',') :[],
  };
}

export async function GET(context) {
  // Fetch the unified Articles collection (includes nature, eco, and travel folders)
  const articlesRaw = await getCollection('articles');
  
  const allPosts = articlesRaw
    ? articlesRaw
        .filter(post => post.data.status !== 'draft') // Filter out drafts natively
        .map(post => createFeedItem(post))
        .filter(item => item !== null) // Remove any null items from mapping
    :[];

  // Sort by publication date descending (newest first)
  allPosts.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: SITE_URL,
    items: allPosts
  });
}