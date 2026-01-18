#!/usr/bin/env python3
"""
Build script for generating posts.json and config.json.

Usage:
    python build.py
"""

import re
import json
import yaml
from datetime import datetime
from pathlib import Path
from collections import defaultdict
from html.parser import HTMLParser
from typing import Optional


class PostMetadataParser(HTMLParser):
    """Extract metadata from HTML post files."""

    def __init__(self):
        super().__init__()
        self.title = ""
        self.date = ""
        self.tags = []
        self.summary = ""

        self._in_title = False
        self._in_meta = False
        self._in_tags = False
        self._in_blockquote = False
        self._tag_class = None

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        class_attr = attrs_dict.get('class', '')

        if class_attr and 'post-page-title' in class_attr:
            self._in_title = True
        elif class_attr and 'post-page-meta' in class_attr:
            self._in_meta = True
        elif class_attr and 'post-page-tags' in class_attr:
            self._in_tags = True
        elif tag == 'blockquote' and not self.summary:
            self._in_blockquote = True
        elif tag == 'span' and class_attr and 'post-tag' in class_attr and self._in_tags:
            self._tag_class = True

    def handle_endtag(self, tag):
        if tag == 'h1':
            self._in_title = False
        elif tag == 'div':
            self._in_meta = False
            self._in_tags = False
        elif tag == 'blockquote':
            self._in_blockquote = False
        elif tag == 'span':
            self._tag_class = False

    def handle_data(self, data):
        data = data.strip()
        if not data:
            return

        if self._in_title:
            self.title = data
        elif self._in_meta:
            self.date = data
        elif self._tag_class and self._in_tags:
            self.tags.append(data)
        elif self._in_blockquote and not self.summary:
            self.summary = data


def parse_html_post(html_path: Path) -> Optional[dict]:
    """Parse metadata from HTML post file."""
    try:
        content = html_path.read_text(encoding='utf-8')
        parser = PostMetadataParser()
        parser.feed(content)

        # Parse date to YYYY-MM-DD format
        date = datetime.now().strftime('%Y-%m-%d')

        # Try to parse common date formats
        for fmt in ['%B %d, %Y', '%Y-%m-%d', '%d %B %Y']:
            try:
                date = datetime.strptime(parser.date, fmt).strftime('%Y-%m-%d')
                break
            except ValueError:
                continue

        return {
            'title': parser.title or html_path.stem,
            'date': date,
            'tags': parser.tags,
            'summary': parser.summary
        }
    except Exception as e:
        print(f"  Error parsing {html_path.name}: {e}")
        return None


def slugify(text: str) -> str:
    """Convert text to URL-friendly slug."""
    slug = text.lower()
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'[^\w\-]', '', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    return slug


def build_posts_index(posts_dir: Path) -> dict:
    """Build index from all HTML files in posts directory."""
    posts = []
    all_tags = set()

    if not posts_dir.exists():
        print(f"Warning: {posts_dir} does not exist")
        return {
            "posts": [],
            "languages": ["original"],
            "tags": [],
            "generated_at": datetime.now().isoformat()
        }

    # Scan HTML files only (ignore deprecated MD files)
    for html_file in sorted(posts_dir.glob('*.html')):
        print(f"Processing: {html_file.name}")

        metadata = parse_html_post(html_file)
        if not metadata:
            print(f"  Skipping: failed to parse metadata")
            continue

        slug = html_file.stem

        # Build post entry
        post_entry = {
            'slug': slug,
            'date': metadata['date'],
            'tags': metadata['tags'],
            'versions': {
                'original': {
                    'title': metadata['title'],
                    'summary': metadata['summary'],
                    'file': f'posts/{html_file.name}'
                }
            }
        }

        posts.append(post_entry)
        all_tags.update(metadata['tags'])

        print(f"  ✓ Title: {metadata['title']}")
        print(f"  ✓ Date: {metadata['date']}")
        print(f"  ✓ Tags: {', '.join(metadata['tags'])}")

    # Sort by date (newest first)
    posts.sort(key=lambda p: p['date'], reverse=True)

    return {
        'posts': posts,
        'languages': ['original'],
        'tags': sorted(all_tags),
        'generated_at': datetime.now().isoformat()
    }


def build_config(config_path: Path) -> dict:
    """Convert config.yaml to config.json format."""
    if not config_path.exists():
        print(f"Warning: {config_path} does not exist")
        return {}

    with open(config_path, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)

    return config


def inject_static_content(index_path: Path, config: dict, posts_index: dict):
    """Inject static content into index.html for SEO/crawlers."""
    if not index_path.exists():
        print(f"Warning: {index_path} does not exist")
        return

    html_content = index_path.read_text(encoding='utf-8')

    # Get default language content
    def get_text(obj, default=''):
        if isinstance(obj, str):
            return obj
        return obj.get('original', obj.get('en', default))

    # 1. Inject bio
    bio_text = get_text(config.get('profile', {}).get('bio', ''), 'Loading...')
    # Escape HTML and preserve line breaks
    bio_html = bio_text.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    bio_html = bio_html.replace('\n', '<br>')

    html_content = re.sub(
        r'<p class="bio" id="profile-bio">.*?</p>',
        f'<p class="bio" id="profile-bio">{bio_html}</p>',
        html_content,
        flags=re.DOTALL
    )

    # 2. Inject social links
    links_parts = []
    links_data = config.get('links', {})
    if links_data.get('github'):
        links_parts.append(f'<a href="{links_data["github"]}" target="_blank">GitHub</a>')
    if links_data.get('linkedin'):
        links_parts.append(f'<a href="{links_data["linkedin"]}" target="_blank">LinkedIn</a>')
    if links_data.get('email'):
        links_parts.append(f'<a href="#" class="email-link" data-email="{links_data["email"]}">Email</a>')
    if links_data.get('google_scholar'):
        links_parts.append(f'<a href="{links_data["google_scholar"]}" target="_blank">Scholar</a>')

    links_html = ' · '.join(links_parts) if links_parts else ''

    html_content = re.sub(
        r'<div class="links" id="social-links">.*?</div>',
        f'<div class="links" id="social-links">{links_html}</div>',
        html_content,
        flags=re.DOTALL
    )

    # 3. Inject posts list
    posts_html_parts = []
    for post in posts_index.get('posts', [])[:10]:  # Show first 10 posts
        version = post.get('versions', {}).get('original', {})
        title = version.get('title', 'Untitled')
        summary = version.get('summary', '')
        file_path = version.get('file', '')
        date = post.get('date', '')
        tags = post.get('tags', [])

        # Format date
        try:
            date_obj = datetime.strptime(date, '%Y-%m-%d')
            date_formatted = date_obj.strftime('%b %d, %Y')
        except:
            date_formatted = date

        # Build tags HTML
        tags_html = ''.join([f'<span class="post-tag">{tag}</span>' for tag in tags])

        posts_html_parts.append(f'''        <article class="post-item">
          <a href="{file_path}" class="post-link">
            <h3 class="post-title">{title}</h3>
            {f'<p class="post-summary">{summary}</p>' if summary else ''}
            <div class="post-meta">
              <span class="post-date">{date_formatted}</span>
              {f'<div class="post-tags">{tags_html}</div>' if tags else ''}
            </div>
          </a>
        </article>''')

    posts_html = '\n'.join(posts_html_parts) if posts_html_parts else '<p>No posts yet.</p>'

    # More specific regex: match from posts-list opening to its closing tag,
    # ensuring we stop at the first </div> that closes posts-list (not nested ones)
    # Pattern explanation:
    # - Find: <div class="posts-list" id="posts-list">
    # - Capture everything until: </div>\n      </section>
    # This ensures we match the entire posts-list block including the closing </div>
    pattern = r'(<div class="posts-list" id="posts-list">).*?(</div>\s*</section>)'
    replacement = rf'\1\n{posts_html}\n      \2'

    html_content = re.sub(
        pattern,
        replacement,
        html_content,
        flags=re.DOTALL,
        count=1  # Only replace the first match
    )

    # Write back
    index_path.write_text(html_content, encoding='utf-8')
    print(f"Injected static content into {index_path.name}")


def main():
    script_dir = Path(__file__).parent
    posts_dir = script_dir / 'posts'
    posts_output = script_dir / 'posts.json'
    config_input = script_dir / 'config.yaml'
    config_output = script_dir / 'config.json'
    index_html = script_dir / 'index.html'

    # Build posts index
    print(f"Scanning posts: {posts_dir}")
    posts_index = build_posts_index(posts_dir)

    with open(posts_output, 'w', encoding='utf-8') as f:
        json.dump(posts_index, f, indent=2, ensure_ascii=False)

    print(f"\nGenerated posts.json: {len(posts_index['posts'])} posts, {len(posts_index['tags'])} tags")

    # Build config
    config = {}
    if config_input.exists():
        print(f"\nProcessing config: {config_input}")
        config = build_config(config_input)

        with open(config_output, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)

        print(f"Generated config.json")

    # Inject static content into index.html
    print(f"\nInjecting static content into index.html...")
    inject_static_content(index_html, config, posts_index)


if __name__ == '__main__':
    main()