#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const program = require('commander');
const puppeteer = require('puppeteer');
const shortid = require('shortid');

program
  .option('-u, --username <username>', 'Set username')
  .option('-d, --dest <dest>', 'Set destionation folder')
  // .option('-o, --offset [offset]', 'Set images offset')
  // .option('-l, --limit [limit]', 'Set limit of images')
  .parse(process.argv);

const IMG_DEST = program.dest || process.cwd();
const PROFILE_URL = `https://instagram.com/${program.username}`;

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(PROFILE_URL);

  // Get list of images
  const imgSourceList = await page.evaluate(() => {
    const imgSelector = 'main[role="main"] article img';
    const imgElementsList = Array.from(document.querySelectorAll(imgSelector));
    return imgElementsList.map(img => img.src);
  });

  // Get image by url
  const getImgByUrl = async url => {
    const viewSource = await page.goto(url);
    const buffer = await viewSource.buffer();
    const filename = shortid.generate();

    return { filename, buffer };
  };

  // Save images to disk
  if (program.dest) {
    await fs.mkdir(IMG_DEST, (err) => {
      if (err) throw err;
    });
  }

  for (let url of imgSourceList) {
    const { filename, buffer } = await getImgByUrl(url);
    const imgPath = path.resolve(IMG_DEST, `${filename}.jpg`);

    await fs.writeFile(imgPath, buffer, (err) => {
      if (err) throw err;
    });
  }

  await browser.close();
})();
