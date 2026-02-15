#!/usr/bin/env node

/**
 * Build script to fetch page content from Airtable and update HTML files
 * Runs at build time only - generates static HTML files
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const glob = require('glob');

// Configuration from environment variables
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// Pages configuration - add new pages here
const PAGES = [
  {
    name: 'Home',
    table: 'home',
    files: {
      en: path.join(__dirname, '..', 'index.html'),
      he: path.join(__dirname, '..', 'index-he.html')
    }
  },
  {
    name: 'About',
    table: 'about',
    files: {
      en: path.join(__dirname, '..', 'about.html'),
      he: path.join(__dirname, '..', 'about-he.html')
    }
  },
  {
    name: 'Therapy',
    table: 'therapy',
    files: {
      en: path.join(__dirname, '..', 'therapy.html'),
      he: path.join(__dirname, '..', 'therapy-he.html')
    }
  },
  {
    name: 'Meditation',
    table: 'meditation',
    files: {
      en: path.join(__dirname, '..', 'zen-meditation.html'),
      he: path.join(__dirname, '..', 'zen-meditation-he.html')
    }
  }
];

// Global sections that appear across multiple pages
const GLOBAL_SECTIONS = [
  {
    name: 'Newsletter',
    table: 'newsletter',
    // Will update all HTML files in the root directory
    pattern: '*.html'
  },
  {
    name: 'Contact',
    table: 'contact',
    pattern: '*.html'
  }
];

/**
 * Fetch content from Airtable table
 */
async function fetchAirtableContent(tableName) {
  return new Promise((resolve, reject) => {
    if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
      resolve(null);
      return;
    }

    const options = {
      hostname: 'api.airtable.com',
      path: `/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            resolve(json.records);
          } catch (error) {
            console.error(`❌ Error parsing ${tableName} response:`, error.message);
            resolve(null);
          }
        } else {
          console.error(`❌ Airtable API error for ${tableName} (${res.statusCode}):`, data);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Network error fetching ${tableName}:`, error.message);
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
    // Support both 'Section' and 'section_key' field names
    const sectionKey = record.fields['Section'] || record.fields['section_key'];
    const copyEng = record.fields['Copy (eng)'] || record.fields['copy (eng)'] || '';
    const copyHeb = record.fields['Copy (heb)'] || record.fields['copy (heb)'] || '';

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
  // This regex extracts: tag name, full opening tag, section key, content, closing tag
  const regex = /<(\w+)([^>]*data-section-key=["']([^"']+)["'][^>]*)>([\s\S]*?)<\/\1>/g;

  html = html.replace(regex, (match, tagName, attributes, sectionKey, currentContent) => {
    if (contentMap[sectionKey] && contentMap[sectionKey][language]) {
      const newContent = contentMap[sectionKey][language];
      updated = true;
      console.log(`  ✏️  Updated ${sectionKey} (${language})`);
      return `<${tagName}${attributes}>${newContent}</${tagName}>`;
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
 * Build a single page
 */
async function buildPage(pageConfig) {
  console.log(`\n📄 Building ${pageConfig.name} page...`);

  try {
    // Fetch content from Airtable
    console.log(`📡 Fetching from '${pageConfig.table}' table...`);
    const records = await fetchAirtableContent(pageConfig.table);

    if (!records || records.length === 0) {
      console.log(`⚠️  No data found for ${pageConfig.name}. Using static content.`);
      return false;
    }

    console.log(`✅ Fetched ${records.length} content sections`);

    // Build content map
    const contentMap = buildContentMap(records);
    console.log(`📝 Processing ${Object.keys(contentMap).length} sections\n`);

    // Update English page
    console.log(`English (${path.basename(pageConfig.files.en)}):`);
    updateHTMLFile(pageConfig.files.en, contentMap, 'eng');

    // Update Hebrew page
    console.log(`\nHebrew (${path.basename(pageConfig.files.he)}):`);
    updateHTMLFile(pageConfig.files.he, contentMap, 'heb');

    return true;
  } catch (error) {
    console.error(`\n❌ Error building ${pageConfig.name}:`, error.message);
    return false;
  }
}

/**
 * Build a global section that appears across multiple pages
 */
async function buildGlobalSection(sectionConfig) {
  console.log(`\n🌍 Building global ${sectionConfig.name} section...`);

  try {
    // Fetch content from Airtable
    console.log(`📡 Fetching from '${sectionConfig.table}' table...`);
    const records = await fetchAirtableContent(sectionConfig.table);

    if (!records || records.length === 0) {
      console.log(`⚠️  No data found for ${sectionConfig.name}. Using static content.`);
      return false;
    }

    console.log(`✅ Fetched ${records.length} content sections`);

    // Build content map
    const contentMap = buildContentMap(records);
    console.log(`📝 Processing ${Object.keys(contentMap).length} sections\n`);

    // Find all HTML files matching the pattern
    const files = glob.sync(path.join(__dirname, '..', sectionConfig.pattern));

    if (files.length === 0) {
      console.log(`⚠️  No HTML files found matching pattern: ${sectionConfig.pattern}`);
      return false;
    }

    console.log(`Found ${files.length} HTML files to update\n`);

    let updatedCount = 0;

    // Update each file
    files.forEach(filePath => {
      const fileName = path.basename(filePath);

      // Determine language from filename
      const isHebrew = fileName.includes('-he.html');
      const language = isHebrew ? 'heb' : 'eng';

      console.log(`Updating ${fileName} (${language}):`);
      const wasUpdated = updateHTMLFile(filePath, contentMap, language);
      if (wasUpdated) {
        updatedCount++;
      }
    });

    console.log(`\n✅ Updated ${updatedCount} file(s) with ${sectionConfig.name} content`);
    return updatedCount > 0;

  } catch (error) {
    console.error(`\n❌ Error building ${sectionConfig.name}:`, error.message);
    return false;
  }
}

/**
 * Main build function
 */
async function buildAllPages() {
  console.log('\n🔨 Building pages from Airtable CMS...\n');

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.warn('⚠️  Airtable credentials not found.');
    console.log('⚠️  Using existing static content for all pages.');
    console.log('✅ Build complete (fallback mode)\n');
    return;
  }

  let successCount = 0;
  let failCount = 0;
  let globalSuccessCount = 0;
  let globalFailCount = 0;

  // Build each page
  for (const pageConfig of PAGES) {
    const success = await buildPage(pageConfig);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  // Build global sections
  for (const sectionConfig of GLOBAL_SECTIONS) {
    const success = await buildGlobalSection(sectionConfig);
    if (success) {
      globalSuccessCount++;
    } else {
      globalFailCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Build complete!`);
  console.log(`   ${successCount} page(s) updated from Airtable`);
  if (failCount > 0) {
    console.log(`   ${failCount} page(s) using static content (fallback)`);
  }
  if (globalSuccessCount > 0) {
    console.log(`   ${globalSuccessCount} global section(s) updated across all pages`);
  }
  if (globalFailCount > 0) {
    console.log(`   ${globalFailCount} global section(s) using static content (fallback)`);
  }
  console.log('='.repeat(50) + '\n');
}

// Run the build
buildAllPages();
