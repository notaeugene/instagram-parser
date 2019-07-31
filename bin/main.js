#!/usr/bin/env node

const fs = require('fs');

const program = require('commander');
const puppeteer = require('puppeteer');
const shortid = require('shortid');

program
  .option('-u, --username <username>', 'Set username')
  // .option('-o, --offset [offset]', 'Set images offset')
  // .option('-l, --limit [limit]', 'Set limit of images')
  .parse(process.argv);

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const { username } = program;

  await page.goto(`https://instagram.com/${username}`);

  // Get list images
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
  for (let url of imgSourceList) {
    const { filename, buffer } = await getImgByUrl(url);

    await fs.writeFile(`${filename}.jpg`, buffer, (err) => {
      if (err) throw err;
    });
  }

  await browser.close();
})();
