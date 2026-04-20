// scripts/add-article.js
const fs = require('fs');
const path = require('path');

// Simple prompt function (non-async for simplicity, can be improved with inquirer)
function prompt(question) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    readline.question(question, (answer) => {
      readline.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  try {
    // Prompt for section
    const sections = ['articles', 'blog', 'eco', 'travel'];
    let section;
    do {
      section = await prompt(`Enter section (${sections.join('/')}): `);
      section = section.toLowerCase();
    } while (!sections.includes(section));

    // Prompt for title and other metadata
    const title = await prompt('Enter title: ');
    const description = await prompt('Enter description: ');
    const image = await prompt('Enter image path (e.g., "/articles/your-image.jpg"): ');
    const tagsInput = await prompt('Enter tags (comma-separated): ');
    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
    const author = await prompt('Enter author (default: Andreas): ') || 'Andreas';

    // Additional metadata based on section (customize as needed)
    let additionalMetadata = {};
    if (section === 'articles') {
      additionalMetadata = {
        topic: await prompt('Enter topic: '),
        views: 0,
        highlighted: false,
        status: 'live'
      };
    }
    // Add similar blocks for other sections if needed

    // Prompt for Markdown file
    const mdFilePath = await prompt('Enter path to Markdown file: ');
    let content;
    try {
      content = fs.readFileSync(mdFilePath, 'utf8');
    } catch (err) {
      console.error(`Error reading Markdown file: ${err.message}`);
      return;
    }

    // Basic heading check (e.g., ensure content has headings)
    const hasHeadings = content.split('\n').some(line => line.trim().startsWith('#'));
    if (!hasHeadings) {
      const action = await prompt('No headings found in Markdown. Would you like to add them? (y/n/c for continue): ');
      switch (action.toLowerCase()) {
        case 'y':
          console.log('Please add headings manually and run the script again.');
          return;
        case 'n':
          console.log('Aborting.');
          return;
        default:
          console.log('Continuing without headings (not recommended).');
      }
    }

    // Generate slug and file path
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    const contentDir = path.join(__dirname, '..', 'src', 'content', section);
    const filePath = path.join(contentDir, `${slug}.md`);

    // Ensure directory exists
    if (!fs.existsSync(contentDir)) {
      fs.mkdirSync(contentDir, { recursive: true });
    }

    // Construct frontmatter
    const createdAt = new Date().toISOString();
    const frontmatter = `---
title: "${title.replace(/"/g, '\\\\"')}"
description: "${description.replace(/"/g, '\\\\"')}"
${section !== 'articles' ? '' : `section: "${section}"\n`}
${section !== 'articles' ? '' : `topic: "${additionalMetadata.topic}"\n`}
image: "${image}"
tags: ${JSON.stringify(tags)}
author: "${author}"
views: ${additionalMetadata.views || 0}
highlighted: ${additionalMetadata.highlighted || false}
status: "${additionalMetadata.status || 'live'}"
created_at: "${createdAt}"
published_at: "${createdAt}"
updated_at: "${createdAt}"
---\n\n`;

    // Check if file exists and handle update/create
    let isUpdate = false;
    let existingFrontmatter = null;
    if (fs.existsSync(filePath)) {
      isUpdate = true;
      try {
        const existingContent = fs.readFileSync(filePath, 'utf8');
        const frontmatterMatch = existingContent.match(/---\s*(.*?)\s*---/s);
        if (frontmatterMatch) {
          existingFrontmatter = {};
          frontmatterMatch[1].split('\n').forEach(line => {
            if (line.trim()) {
              const [key, value] = line.split(':').map(s => s.trim().replace(/^"|"$/g, ''));
              existingFrontmatter[key] = value;
            }
          });
        }
      } catch (err) {
        console.error(`Error reading existing file: ${err.message}`);
      }
    }

    // Write the file
    const fullContent = frontmatter + content;
    fs.writeFileSync(filePath, fullContent);

    if (isUpdate) {
      console.log(`Article updated: ${filePath}`);
      // In a full implementation, you'd update specific fields while preserving others
    } else {
      console.log(`New article created: ${filePath}`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();