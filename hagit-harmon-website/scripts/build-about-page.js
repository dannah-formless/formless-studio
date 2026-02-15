#!/usr/bin/env node

/**
 * Build script to fetch About page content from Airtable and update HTML files
 * Runs at build time only - generates static HTML files
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration from environment variables
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const TABLE_NAME = 'about';

// File paths
const ABOUT_EN_PATH = path.join(__dirname, '..', 'about.html');
const ABOUT_HE_PATH = path.join(__dirname, '..', 'about-he.html');

/**
 * Fetch content from Airtable
 */
async function fetchAirtableContent() {
  return new Promise((resolve, reject) => {
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      console.warn('⚠️  Airtable credentials not found. Using fallback static content.');
      resolve(null);
      return;
    }

    const options = {
      hostname: 'api.airtable.com',
      path: `/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(TABLE_NAME)}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`
      }
    };

    console.log('📡 Fetching About page content from Airtable...');

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            console.log(`✅ Fetched ${json.records.length} content sections from Airtable`);
            resolve(json.records);
          } catch (error) {
            console.error('❌ Error parsing Airtable response:', error.message);
            resolve(null);
          }
        } else {
          console.error(`❌ Airtable API error (${res.statusCode}):`, data);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Network error fetching from Airtable:', error.message);
      resolve(null);
    });

    req.end();
  });
}

/**
 * Convert Airtable records to a map of section_key => {eng, heb}
 */
function buildContentMap(records) {
  const contentMap = {};

  records.forEach(record => {
    const sectionKey = record.fields['section_key'];
    const copyEng = record.fields['copy (eng)'] || '';
    const copyHeb = record.fields['copy (heb)'] || '';

    if (sectionKey) {
      contentMap[sectionKey] = {
        eng: copyEng,
        heb: copyHeb
      };
    }
  });

  return contentMap;
}

/**
 * Update HTML file with Airtable content
 */
function updateHTMLFile(filePath, contentMap, language) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return false;
  }

  let html = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  // Find all elements with data-section-key and replace their content
  const regex = /(<[^>]+data-section-key=["']([^"']+)["'][^>]*>)([\s\S]*?)(<\/[^>]+>)/g;

  html = html.replace(regex, (match, openTag, sectionKey, currentContent, closeTag) => {
    if (contentMap[sectionKey] && contentMap[sectionKey][language]) {
      const newContent = contentMap[sectionKey][language];
      updated = true;
      console.log(`  ✏️  Updated ${sectionKey} (${language})`);
      return openTag + newContent + closeTag;
    }
    return match;
  });

  if (updated) {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✅ Updated ${path.basename(filePath)}`);
    return true;
  } else {
    console.log(`ℹ️  No updates for ${path.basename(filePath)}`);
    return false;
  }
}

/**
 * Main build function
 */
async function buildAboutPages() {
  console.log('\n🔨 Building About pages...\n');

  try {
    // Fetch content from Airtable
    const records = await fetchAirtableContent();

    if (!records || records.length === 0) {
      console.log('⚠️  Using existing static content (no Airtable data available)');
      console.log('✅ Build complete (fallback mode)\n');
      return;
    }

    // Build content map
    const contentMap = buildContentMap(records);
    console.log(`\n📝 Processing ${Object.keys(contentMap).length} content sections\n`);

    // Update English page
    console.log('English page (about.html):');
    updateHTMLFile(ABOUT_EN_PATH, contentMap, 'eng');

    // Update Hebrew page
    console.log('\nHebrew page (about-he.html):');
    updateHTMLFile(ABOUT_HE_PATH, contentMap, 'heb');

    console.log('\n✅ About pages build complete!\n');
  } catch (error) {
    console.error('\n❌ Build error:', error.message);
    console.log('⚠️  Using existing static content as fallback');
    console.log('✅ Build complete (fallback mode)\n');
  }
}

// Run the build
buildAboutPages();
