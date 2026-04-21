/*
1. Write article in word
2. Convert to matkdown with online converter
3. Run this script - it will ask for section (eco/nature/travel), title, description, image path, tags, author, topic, status and the path to the markdown file you just created
4. New file will be created in the correct section folder and added to website
*/

// scripts/add-article.js
const fs = require('fs');
const path = require('path');
const { convertCompilerOptionsFromJson } = require('typescript')

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
    // 1. Prompt for section
    const sections = ['nature', 'eco', 'travel'];
    let section;
    do {
      section = await prompt(`Enter section (${sections.join('/')}): `);
      section = section.toLowerCase();
    } while (!sections.includes(section));

    // 2. Prompt for metadata
    const title = await prompt('Enter title: ');
    const description = await prompt('Enter description: ');
    const image = await prompt('Enter image path (e.g., "/articles/nature/image.jpg"): ');
    
    // Schema needs string, RSS does .split(',')
    const tagsInput = await prompt('Enter tags (comma-separated): ');
    const author = await prompt('Enter author (default: Andreas): ') || 'Andreas';
    const topic = await prompt('Enter topic (optional): ');
    const status = await prompt('Enter status (default: live): ') || 'live';

    // 3. Prompt for Markdown file (Make it optional)
    const mdFilePath = await prompt('Enter path to Markdown file to import (leave blank to just create the file): ');
    let content = '';
    
    if (mdFilePath) {
      try {
        content = fs.readFileSync(mdFilePath, 'utf8');
        const hasHeadings = content.split('\n').some(line => line.trim().startsWith('#'));
        if (!hasHeadings) {
          const action = await prompt('No headings found in Markdown. Continue? (y/n): ');
          if (action.toLowerCase() === 'n') return console.log('Aborting.');
        }
      } catch (err) {
        return console.error(`Error reading Markdown file: ${err.message}`);
      }
    }

    // 4. Generate slug and NEW file path
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
      
    // FIXED PATH: Now targets src/content/articles/<section>
    const contentDir = path.join(__dirname, '..', 'src', 'content', 'articles', section);
    const filePath = path.join(contentDir, `${slug}.md`);

    if (!fs.existsSync(contentDir)) {
      fs.mkdirSync(contentDir, { recursive: true });
    }

    // 5. Handle updates vs new creations
    const now = new Date().toISOString();
    let createdAt = now;
    let views = 0;
    let highlighted = false;
    let isUpdate = false;

    if (fs.existsSync(filePath)) {
      isUpdate = true;
      try {
        const existingContent = fs.readFileSync(filePath, 'utf8');
        // Extract old values to prevent overwriting metrics on update
        const createdMatch = existingContent.match(/created_at:\s*"?([^"\n]+)"?/);
        if (createdMatch) createdAt = createdMatch[1];
        
        const viewsMatch = existingContent.match(/views:\s*(\d+)/);
        if (viewsMatch) views = parseInt(viewsMatch[1], 10);
        
        const highlightMatch = existingContent.match(/highlighted:\s*(true|false)/);
        if (highlightMatch) highlighted = highlightMatch[1] === 'true';
      } catch (err) {
        console.error(`Warning: Could not read old frontmatter: ${err.message}`);
      }
    }

    // 6. Construct Zod-compliant frontmatter
    const frontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
description: "${description.replace(/"/g, '\\"')}"
section: "${section}"
topic: "${topic}"
image: "${image}"
tags: "${tagsInput}"
author: "${author}"
views: ${views}
highlighted: ${highlighted}
status: "${status}"
created_at: "${createdAt}"
published_at: "${createdAt}"
updated_at: "${now}"
---

`;

    // 7. Write the file
    fs.writeFileSync(filePath, frontmatter + content);

    if (isUpdate) {
      console.log(`\n✅ Article updated: ${filePath}`);
    } else {
      console.log(`\n✅ New article created: ${filePath}`);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();