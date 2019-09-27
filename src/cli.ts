#!/usr/bin/env node

import axios from "axios";
import chalk from "chalk";
import Axios from "axios";
const _cliProgress = require("cli-progress");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const fileName = `output/${new Date()
  .toUTCString()
  .replace(/ /g, "_")
  .toLowerCase()}.csv`;
const csvWriter = createCsvWriter({
  path: fileName,
  header: [
    { id: "name", title: "Name" },
    { id: "email", title: "Email" },
    { id: "keyword", title: "Keyword" }
  ],
  append: true
});

const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question(
  `\n\n${chalk.green.bold(
    `🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥\n\nWelcome to Scrapebot..!!`
  )}\n\nThis is a tool where you can enter keywords and get email addresses of\ndevelopers that have worked${` `}on some technologies related to the keywords... \n\n🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥\n\nPlease enter the keywords you wish to search for (comma seperated) : `,
  async keywords => {
    console.log(`\nSearching for keywords - ${chalk.blue.bold(keywords)}!\n\n`);
    const url = encodeURI(
      `https://api.github.com/search/repositories?q=${keywords
        .split(",")
        .join("+")}`
    );
    readline.close();
    let reposList = await searchForRepos(keywords, 0, []);
    if (reposList.length > 0) {
      reposList = uniqBy(reposList, JSON.stringify);
      console.log(
        `\n\n${chalk.white.bgGreen.bold(` DONE `)} Retrieved ${chalk.bold(
          `${reposList.length}`
        )} repositories`
      );
      await sleep(100);
      const repos = reposList.map(item => {
        return {
          full_name: item.full_name,
          api_url: `https://api.github.com/repos/${item.full_name}/commits/`,
          web_url: `https://github.com/${item.full_name}/commits/master`
        };
      });
      //   await repos.forEach((item, index) => {
      //     console.log(`${index + 1}. ${item.full_name}`);
      //   });

      await sleep(500);
      console.log(
        `\n\n${chalk.black.bgYellow.bold(
          `In progress`
        )} Mining information from the repositories...\n\n`
      );
      const totalEmails = [];
      for (const item of repos) {
        const emailsArray = await fetchAllCommitsAPI(item.full_name, keywords);
        totalEmails.push(...emailsArray);
      }

      console.log(
        `\n\n${chalk.green.bold(
          `${totalEmails.length}`
        )} emails collected successfully. Data is available in ${chalk.whiteBright.bold(
          `./${fileName}`
        )}...\nThank you for using this tool.For more info visit https://github.com/kirananto\n\n`
      );

      process.exit();
    } else {
      console.log(
        "\n\nSorry no results found, Please search for something else\n"
      );
      process.exit();
    }
  }
);
const bar1 = new _cliProgress.SingleBar(
  {},
  _cliProgress.Presets.shades_classic
);

const searchForRepos = async (
  keywords: string,
  page: number,
  prevReposList: any[]
) => {
  const reposList = uniqBy(prevReposList, JSON.stringify);
  let result;
  try {
    result = await axios({
      url: encodeURI(
        `https://api.github.com/search/repositories?q=${keywords
          .split(",")
          .join("+")}`
      )
    });
    if (reposList.length === 0) {
      bar1.start(result.data.total_count, 0);
    }
    await reposList.push(...result.data.items);

    bar1.update(reposList.length);
    if (result.data.total_count > reposList.length) {
      await sleep(result.data.total_count > 270 ? 6100 : 10);
      return await searchForRepos(keywords, page + 1, reposList);
    } else {
      bar1.update(result.data.total_count);
      await sleep(1000);
      return reposList;
    }
  } catch (e) {
    console.log(
      `${chalk.red.bold(`\n\n\nRate Limited `)} - Sleeping for 1 minute\n`
    );
    await sleep(30000);
    console.log('30 seconds left...\n')
    await sleep(20000);
    console.log('10 seconds left...\n')
    await sleep(7000);
    console.log('3 seconds left...\n')
    await sleep(3000);
    return searchForRepos(keywords, page, reposList);
  }
};

const fetchAllCommitsAPI = async (repo_name, keywords) => {
  try {
    await sleep(6000);
    const result = await axios({
      url: `https://api.github.com/repos/${repo_name}/commits`
    });
    const emails_array: any[] = result.data
      .filter(
        item =>
          !(
            item.commit.author.email.includes("users.noreply.github.com") ||
            item.commit.author.email.includes("@example.com")
          )
      )
      .map(item => ({
        keyword: keywords,
        name: item.commit.author.name,
        email: item.commit.author.email
      }));
    const emails = uniqBy(emails_array, JSON.stringify);
    await sleep(200);
    await csvWriter.writeRecords(emails);
    console.log(
      `✅ Collected ${chalk.green.bold(
        `${emails_array.length}`
      )} emails from ${chalk.green.bold(repo_name)}`
    );
    return emails;
  } catch (error) {
    console.log(`❌ Cannot retriving data from ${chalk.red.bold(repo_name)}`);
    //   console.log("ERROR", error);
    return [];
  }
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function uniqBy(a, key) {
  let seen = new Set();
  return a.filter(item => {
    let k = key(item);
    return seen.has(k) ? false : seen.add(k);
  });
}
