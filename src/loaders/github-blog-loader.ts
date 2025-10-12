import type { Loader, LoaderContext } from 'astro/loaders';
import yaml from 'js-yaml';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import type { MarkdownProcessor } from '@astrojs/markdown-remark';

interface GitHubLoaderOptions {
  owner: string;
  repo: string;
  path: string;
  branch?: string;
}

interface GitHubContent {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url?: string;
}

// Parse frontmatter from markdown content
function parseFrontmatter(content: string): { data: Record<string, any>; body: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return { data: {}, body: content };
  }

  const frontmatterText = match[1];
  const body = match[2];
  
  try {
    // Parse YAML frontmatter
    const data = yaml.load(frontmatterText) as Record<string, any>;
    
    // Transform date strings to Date objects
    if (data && typeof data === 'object') {
      if (data.pubDate && typeof data.pubDate === 'string') {
        data.pubDate = new Date(data.pubDate);
      }
      if (data.updatedDate && typeof data.updatedDate === 'string') {
        data.updatedDate = new Date(data.updatedDate);
      }
    }
    
    return { data: data || {}, body };
  } catch (error) {
    console.error('Failed to parse frontmatter:', error);
    return { data: {}, body: content };
  }
}

export function githubLoader(options: GitHubLoaderOptions): Loader {
  let markdownProcessor: MarkdownProcessor | null = null;

  return {
    name: 'github-loader',
    load: async (context: LoaderContext) => {
      const { owner, repo, path, branch = 'main' } = options;
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;

      // Initialize markdown processor
      if (!markdownProcessor) {
        markdownProcessor = await createMarkdownProcessor(context.config.markdown);
      }

      try {
        // Get the contents of the directory
        const response = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Astro-Loader',
          },
        });

        if (!response.ok) {
          throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
        }

        const data: GitHubContent[] = await response.json();

        // Process each file and directory
        for (const item of data) {
          await processGitHubItem(item, context, owner, repo, path, branch, markdownProcessor);
        }

        context.logger.info(`Loaded content from GitHub: ${owner}/${repo}/${path}`);
      } catch (error) {
        context.logger.error(`Failed to load content from GitHub: ${error}`);
        throw error;
      }
    },
  };
}

async function processGitHubItem(
  item: GitHubContent,
  context: LoaderContext,
  owner: string,
  repo: string,
  basePath: string,
  branch: string,
  markdownProcessor: MarkdownProcessor
): Promise<void> {
  // Process .md and .mdx files
  if (item.type === 'file' && /\.(md|mdx)$/.test(item.name)) {
    // Skip files starting with underscore
    if (item.name.startsWith('_')) return;

    if (!item.download_url) return;

    // Fetch the file content
    const contentResponse = await fetch(item.download_url);
    if (!contentResponse.ok) return;

    const rawContent = await contentResponse.text();
    
    // Parse frontmatter and body
    const { data: frontmatter, body } = parseFrontmatter(rawContent);
    
    // Create an ID from the file path
    const id = item.path.replace(`${basePath}/`, '').replace(/\.(md|mdx)$/, '');

    // Process only the markdown body (without frontmatter) to get rendered HTML and metadata
    const { code: html, metadata } = await markdownProcessor.render(body);

    // Extract remarkPluginFrontmatter from metadata
    const remarkPluginFrontmatter = metadata.frontmatter || {};

    // Store the entry with parsed frontmatter, body, and rendered content
    context.store.set({
      id,
      data: frontmatter,
      body,
      rendered: {
        html,
        metadata: {
          ...metadata,
          remarkPluginFrontmatter,
        },
      },
    });
  } else if (item.type === 'dir') {
    // Recursively process subdirectories
    const subApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${item.path}?ref=${branch}`;
    
    const subResponse = await fetch(subApiUrl, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Astro-Blog-Loader',
      },
    });

    if (!subResponse.ok) return;

    const subData: GitHubContent[] = await subResponse.json();
    
    for (const subItem of subData) {
      await processGitHubItem(subItem, context, owner, repo, basePath, branch, markdownProcessor);
    }
  }
}
