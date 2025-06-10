#!/bin/bash

# Exit on any error
set -e

# The first argument is the GitHub repository name (e.g., "owner/repo")
repo_name=$1
if [ -z "$repo_name" ]; then
    echo "Error: GitHub repository name not provided as the first argument."
    exit 1
fi

# Get git info
commit_date=$(git log -1 --format=%cd --date=format:"%Y-%m-%d %H:%M:%S")
commit_message_subject=$(git log -1 --format=%s)

# Generate the HTML for the list of script files
file_list_html_raw=""
for filename in *.js; do
  # Ensure we only process actual files
  if [ -f "$filename" ]; then
    file_list_html_raw="${file_list_html_raw}      <li><a href=\"${filename}\">${filename}</a></li>\n"
  fi
done

# Interpret the newlines to create the final HTML
file_list_html=$(printf "%b" "$file_list_html_raw")

# Create the final index.html file in the docs directory
cat <<EOF > docs/index.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>油猴脚本库</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #f8f9fa;
            --card-bg-color: #ffffff;
            --text-color: #212529;
            --heading-color: #000000;
            --link-color: #007bff;
            --border-color: #e9ecef;
            --shadow-color: rgba(0, 0, 0, 0.04);
            --footer-link-color: #555;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg-color: #121212;
                --card-bg-color: #1e1e1e;
                --text-color: #e0e0e0;
                --heading-color: #ffffff;
                --link-color: #69b3ff;
                --border-color: #333;
                --shadow-color: rgba(0, 0, 0, 0.2);
                --footer-link-color: #aaa;
            }
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: var(--text-color);
            background-color: var(--bg-color);
            max-width: 800px;
            margin: 40px auto;
            padding: 0 20px;
            transition: background-color 0.3s, color 0.3s;
        }

        h1 {
            text-align: center;
            font-size: 2.8em;
            font-weight: 700;
            margin-bottom: 20px;
            background: linear-gradient(45deg, #0d6efd, #6f42c1);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            color: #0d6efd; /* Fallback for browsers that don't support background-clip */
        }

        .info-box {
            background: var(--card-bg-color);
            padding: 20px 25px;
            border-radius: 12px;
            box-shadow: 0 4px 15px var(--shadow-color);
            margin-bottom: 40px;
            text-align: center;
            border: 1px solid var(--border-color);
            transition: background-color 0.3s, border-color 0.3s;
        }
        .info-box strong {
            color: var(--heading-color);
            transition: color 0.3s;
        }
        .info-box .label {
            font-size: 0.9em;
            color: #6c757d;
        }
        ul {
            list-style-type: none;
            padding: 0;
        }
        li {
            background: var(--card-bg-color);
            margin-bottom: 12px;
            border-radius: 10px;
            box-shadow: 0 4px 15px var(--shadow-color);
            transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s;
            border: 1px solid var(--border-color);
        }
        li:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 20px var(--shadow-color);
        }
        a {
            display: flex;
            align-items: center;
            padding: 18px 22px;
            text-decoration: none;
            color: var(--link-color);
            font-weight: 500;
            font-size: 1.1em;
            word-break: break-all;
            transition: color 0.3s;
        }
        a::before {
            content: '📜';
            margin-right: 14px;
            font-size: 1.2em;
            opacity: 0.8;
        }
        footer {
            text-align: center;
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid var(--border-color);
            font-size: 0.9em;
            color: #6c757d;
            transition: border-color 0.3s;
        }
        footer a {
            color: var(--footer-link-color);
            text-decoration: none;
            display: inline;
            padding: 0;
            font-weight: normal;
        }
        footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <h1>My Scripts</h1>
    <div class="info-box">
        <span class="label">Last Updated:</span> <strong>$commit_date</strong><br>
        <span class="label">Latest Change:</span> <strong>$commit_message_subject</strong>
    </div>

    <ul>
${file_list_html}
    </ul>
    <footer>
        <p>Generated by GitHub Actions</p>
        <a href="https://github.com/${repo_name}" target="_blank">GitHub Repository</a>
ons
