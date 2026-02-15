# Airtable CMS Setup - About Page

## Overview

The About page content is managed through Airtable and fetched at **build time only**. This generates static HTML files - no client-side JavaScript is needed for content loading.

## Architecture

- **Build-time static generation**: Content is fetched from Airtable during the Netlify build process
- **Fallback support**: If Airtable is unavailable, the existing static content in the HTML files is preserved
- **No runtime dependencies**: The generated pages are pure static HTML with no CMS JavaScript

## Airtable Table Structure

### Table Name
`about_content`

### Fields

| Field Name | Type | Description |
|------------|------|-------------|
| `section_key` | Single line text | Stable identifier for the content section (e.g., `hero_title`, `bio_paragraph_1`) |
| `copy (eng)` | Long text | English content for this section |
| `copy (heb)` | Long text | Hebrew content for this section |

### Section Keys

The following `section_key` values are used:

**Hero Section:**
- `hero_title` - Page title (e.g., "ABOUT" / "אודות")
- `hero_name` - Name (e.g., "HAGIT HARMON" / "חגית הרמון")
- `hero_subtitle` - Subtitle/tagline

**Bio Section:**
- `bio_heading` - Section heading (e.g., "About me" / "על עצמי")
- `bio_paragraph_1` - First paragraph
- `bio_paragraph_2` - Second paragraph
- `bio_paragraph_3` - Third paragraph
- `bio_paragraph_4` - Fourth paragraph (Hebrew only - optional)

**Story Section:**
- `story_heading` - Section heading (e.g., "How I got here" / "איך הגעתי עד הלום")
- `story_paragraph_1` - First paragraph
- `story_paragraph_2` - Second paragraph
- `story_paragraph_3` - Third paragraph

## Environment Variables Setup

### Required Variables

Add these to your Netlify site's environment variables:

1. **AIRTABLE_API_KEY**
   - Your Airtable Personal Access Token
   - Get it from: https://airtable.com/create/tokens
   - Required scopes: `data.records:read`

2. **AIRTABLE_BASE_ID**
   - Your Airtable Base ID
   - Found in the URL: `https://airtable.com/[BASE_ID]/...`
   - Example: `apptjSc9CHXlZKntH`

### Setting Environment Variables in Netlify

1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Click **Add a variable**
4. Add `AIRTABLE_API_KEY` with your API token
5. Add `AIRTABLE_BASE_ID` with your base ID
6. Click **Save**

### Local Development

For local testing, create a `.env` file in the project root:

```bash
AIRTABLE_API_KEY=your_api_key_here
AIRTABLE_BASE_ID=your_base_id_here
```

**Important:** Never commit the `.env` file to git. It's already in `.gitignore`.

## How It Works

### Build Process

1. When you deploy to Netlify, the build command `npm run build` runs
2. The script `scripts/build-about-page.js` executes:
   - Fetches all records from the `about_content` table
   - Reads `about.html` and `about-he.html`
   - Finds all elements with `data-section-key` attributes
   - Replaces their content with the corresponding Airtable data
   - Writes the updated HTML files back to disk
3. Netlify deploys the updated static HTML files

### Fallback Behavior

If Airtable is unavailable (missing credentials, API error, network issue):
- The build script logs a warning
- The existing static content in the HTML files is preserved
- The build completes successfully in "fallback mode"

## Updating Content

### Via Airtable (Recommended)

1. Log in to Airtable
2. Open the `about_content` table
3. Edit the content in the `copy (eng)` or `copy (heb)` fields
4. Trigger a new Netlify deployment:
   - Option A: Push a commit to your repository
   - Option B: Manually trigger a deploy in Netlify dashboard
   - Option C: Set up Airtable webhooks to auto-deploy (advanced)

### Via HTML Files (Fallback)

If you need to update content without Airtable:
1. Edit the HTML files directly (`about.html` or `about-he.html`)
2. Update the content inside elements with `data-section-key` attributes
3. Commit and deploy

**Note:** Content updated this way will be overwritten on the next build if Airtable data exists.

## HTML Integration

Content sections are marked with `data-section-key` attributes:

```html
<h2 data-section-key="hero_title">ABOUT</h2>
<p data-section-key="bio_paragraph_1">
  I spent 12 years as a buddhist nun...
</p>
```

The build script finds these elements and replaces their innerHTML with Airtable content.

## Troubleshooting

### Content Not Updating

1. **Check Netlify build logs** for errors or warnings
2. **Verify environment variables** are set correctly in Netlify
3. **Check Airtable field names** match exactly: `section_key`, `copy (eng)`, `copy (heb)`
4. **Verify section_key values** in Airtable match the HTML attributes

### Build Failures

- The build script is designed to never fail the build
- If Airtable is unavailable, it falls back to static content
- Check build logs for detailed error messages

### Testing Locally

Run the build script locally:

```bash
# Set environment variables
export AIRTABLE_API_KEY="your_key"
export AIRTABLE_BASE_ID="your_base_id"

# Run the build
npm run build
```

Or use a `.env` file with a tool like `dotenv`:

```bash
npm install dotenv-cli --save-dev
npx dotenv -e .env -- npm run build
```

## Adding New Content Sections

To add a new editable section:

1. **Add to HTML**: Add `data-section-key="new_key"` attribute to the element
2. **Add to Airtable**: Create a new record with:
   - `section_key`: `new_key`
   - `copy (eng)`: English content
   - `copy (heb)`: Hebrew content
3. **Deploy**: Trigger a new build

## Security Notes

- API keys are stored securely in Netlify environment variables
- Keys are only used during build time (server-side)
- Keys are never exposed to the client/browser
- Use read-only Airtable tokens with minimal scopes

## Future Enhancements

Possible improvements for the future:

- Auto-deploy on Airtable changes using webhooks
- Preview deployments before publishing
- Support for rich text formatting (currently plain text/HTML)
- Content versioning and rollback
- Support for additional pages beyond About
