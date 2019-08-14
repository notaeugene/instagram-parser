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
  .option('-l, --limit <limit>', 'Set images limit')
  .parse(process.argv);

const IMG_DEST = program.dest || process.cwd();
const PROFILE_URL = `https://instagram.com/${program.username}`;

function wait (ms) {
  return new Promise(resolve => setTimeout(() => resolve(), ms));
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const bodyHandle = await page.$('body');
  const { height } = await bodyHandle.boundingBox();
  await bodyHandle.dispose();

  let imgSrcList = [];

  await page.goto(PROFILE_URL);

  const limit = program.limit || await page.evaluate(() => {
    const postsAmountStr = document.querySelector('header li:first-child').innerText;
    return parseInt(postsAmountStr);
  });

  // Get urls list
  while (imgSrcList.length < limit) {
    const batchSrcList = await page.evaluate(() => {
      const imgSelector = 'main[role="main"] article img:not(.is-parsed)';
      const imgElementsList = Array.from(document.querySelectorAll(imgSelector));

      imgElementsList.forEach(img => img.classList.add('is-parsed'));

      return imgElementsList.map(img => img.src);
    });

    imgSrcList.push(...batchSrcList);

    await page.evaluate(`window.scrollBy(0, ${height})`);

    await wait(100);
  }

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

  for (let url of imgSrcList) {
    const { filename, buffer } = await getImgByUrl(url);
    const imgPath = path.resolve(IMG_DEST, `${filename}.jpg`);

    await fs.writeFile(imgPath, buffer, (err) => {
      if (err) throw err;
    });
  }

  await browser.close();
})();
