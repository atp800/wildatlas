# Markdown writing guide

[Documentation index](README.md) · [Content and frontmatter](CONTENT.md)

- Use the article title from frontmatter; start body sections at ##, then ###.
- Use short paragraphs, descriptive headings and descriptive link text.
- Add a blank line before and after lists, tables and code blocks.
- Use meaningful alt text for images, and cite sources beside factual claims.
- Use .md for ordinary articles; use [MDX](using-mdx.mdx) when importing components.

```markdown
## A section heading

A paragraph with **emphasis** and a [descriptive link](https://example.com).

- First point
- Second point

> A short quotation, followed by attribution and its source.

| Feature | Detail |
| --- | --- |
| Habitat | Coastal waters |

![Description of the image](../../../assets/nature/example.jpg)
```

Replace sample image paths with real files and preview the result. Use fenced code
blocks with a language label for code. Do not copy obsolete blog-placeholder image
paths or the old blog-section frontmatter from starter examples.
