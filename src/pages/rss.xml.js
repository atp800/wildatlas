import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION, SITE_URL } from '../consts';


function createFeedItem(post, section) {
	if (isNaN(new Date(post.data.published_at).getTime())) {
		return null;
	}
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
    .map(post => createFeedItem(post, 'blog'))
    .filter(item => item !== null); // Filter out null items after mapping

  const reviewPosts = (await getCollection('reviews'))
    .map(post => createFeedItem(post, 'reviews'))
    .filter(item => item !== null); // Filter out null items after mapping

  const travelPosts = (await getCollection('travel'))
    .map(post => createFeedItem(post, 'travel'))
    .filter(item => item !== null); // Filter out null items after mapping

  const articlePosts = (await getCollection('articles'))
    .map(post => createFeedItem(post, 'articles'))
    .filter(item => item !== null);

  // Combine all posts into a single array and sort them by publication date
  const allPosts = [...blogPosts, ...reviewPosts, ...travelPosts, ...articlePosts]
    .filter(item => item.status !== 'draft') // Filter out draft posts
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: SITE_URL,
    items: allPosts
  });
}