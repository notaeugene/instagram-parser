#!/usr/bin/env node

const program = require('commander');
const puppeteer = require('puppeteer');

program
  .option('-u, --username <username>', 'Set username')
  .parse(process.argv);

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const { username } = program;

  await page.goto(`https://instagram.com/${username}`);

  console.log(username);

  await browser.close();
})();
