#!/usr/bin/env python3
"""
Build script for generating posts.json and config.json.

Usage:
    python build.py
"""

import os
import re
import json
import yaml
from datetime import datetime
from pathlib import Path
from collections import defaultdict


def parse_front_matter(content: str) -> tuple[dict, str]:
    """Parse YAML front matter from markdown content."""
    pattern = r'^---\n(.*?)\n---\n'
    match = re.match(pattern, content, re.DOTALL)

    if not match:
        return {}, content

    front_matter_str = match.group(1)
    body = content[match.end():]

    # Simple YAML parsing
    front_matter = {}
    for line in front_matter_str.split('\n'):
        line = line.strip()
        if not line or ':' not in line:
            continue

        key, value = line.split(':', 1)
        key = key.strip()
        value = value.strip()

        # Handle arrays: [tag1, tag2, tag3]
        if value.startswith('[') and value.endswith(']'):
            items = value[1:-1].split(',')
            value = [item.strip().strip('"\'') for item in items if item.strip()]
        else:
            value = value.strip('"\'')

        front_matter[key] = value

    return front_matter, body


def slugify(text: str) -> str:
    """Convert text to URL-friendly slug."""
    slug = text.lower()
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'[^\w\-]', '', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    return slug


def parse_filename(filename: str) -> tuple[str, str]:
    """
    Parse filename to extract slug and language.

    Examples:
        how-to-read.md -> ('how-to-read', 'original')
        how-to-read.en.md -> ('how-to-read', 'en')
        how-to-read.zh.md -> ('how-to-read', 'zh')
    """
    stem = filename.rsplit('.md', 1)[0]

    # Check for language suffix
    for lang in ['en', 'zh', 'ja']:
        if stem.endswith(f'.{lang}'):
            slug = stem.rsplit(f'.{lang}', 1)[0]
            return slug, lang

    return stem, 'original'


def build_posts_index(posts_dir: Path) -> dict:
    """Build index from all markdown files in posts directory."""
    posts_by_slug = defaultdict(lambda: {
        'slug': '',
        'date': '',
        'tags': [],
        'versions': {}
    })
    all_tags = set()
    languages_found = {'original'}

    if not posts_dir.exists():
        print(f"Warning: {posts_dir} does not exist")
        return {
            "posts": [],
            "languages": ["original"],
            "tags": [],
            "generated_at": datetime.now().isoformat()
        }

    for md_file in sorted(posts_dir.glob('*.md')):
        print(f"Processing: {md_file.name}")

        content = md_file.read_text(encoding='utf-8')
        front_matter, body = parse_front_matter(content)

        if 'title' not in front_matter:
            print(f"  Skipping: no title found")
            continue

        slug, lang = parse_filename(md_file.name)
        languages_found.add(lang)

        # Extract fields
        title = front_matter.get('title', md_file.stem)
        date = front_matter.get('date', datetime.now().strftime('%Y-%m-%d'))
        tags = front_matter.get('tags', [])
        summary = front_matter.get('summary', '')

        if isinstance(tags, str):
            tags = [tags]

        # Update post entry
        post = posts_by_slug[slug]
        post['slug'] = slug

        # Use date from original or first version found
        if lang == 'original' or not post['date']:
            post['date'] = date
            post['tags'] = tags

        # Add version
        post['versions'][lang] = {
            'title': title,
            'summary': summary,
            'file': f'posts/{md_file.name}'
        }

        all_tags.update(tags)

    # Convert to list and sort by date
    posts = list(posts_by_slug.values())
    posts.sort(key=lambda p: p['date'], reverse=True)

    # Sort languages and tags
    languages = ['original'] + sorted([l for l in languages_found if l != 'original'])
    all_tags = sorted(all_tags)

    return {
        'posts': posts,
        'languages': languages,
        'tags': all_tags,
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


def main():
    script_dir = Path(__file__).parent
    posts_dir = script_dir / 'posts'
    posts_output = script_dir / 'posts.json'
    config_input = script_dir / 'config.yaml'
    config_output = script_dir / 'config.json'

    # Build posts index
    print(f"Scanning posts: {posts_dir}")
    posts_index = build_posts_index(posts_dir)

    with open(posts_output, 'w', encoding='utf-8') as f:
        json.dump(posts_index, f, indent=2, ensure_ascii=False)

    print(f"\nGenerated posts.json: {len(posts_index['posts'])} posts, {len(posts_index['tags'])} tags")

    # Build config
    if config_input.exists():
        print(f"\nProcessing config: {config_input}")
        config = build_config(config_input)

        with open(config_output, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2, ensure_ascii=False)

        print(f"Generated config.json")


if __name__ == '__main__':
    main()