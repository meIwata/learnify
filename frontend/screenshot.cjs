const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function takeScreenshots() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    // Take screenshot of prototype
    console.log('Taking screenshot of prototype...');
    const prototypePath = path.join(__dirname, 'prototype', 'index.html');
    await page.goto(`file://${prototypePath}`, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'prototype-screenshot.png', fullPage: true });
    
    // Take screenshot of current frontend (if running on port 5174)
    console.log('Taking screenshot of current frontend...');
    try {
      await page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });
      await page.screenshot({ path: 'current-frontend-screenshot.png', fullPage: true });
    } catch (error) {
      console.log('Frontend not running on port 5174, trying 5173...');
      try {
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
        await page.screenshot({ path: 'current-frontend-screenshot.png', fullPage: true });
      } catch (error) {
        console.log('Frontend not accessible. Please make sure it\'s running.');
      }
    }
    
  } catch (error) {
    console.error('Error taking screenshots:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshots();