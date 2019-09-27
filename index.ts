import axios from "axios";
import chalk from "chalk";
import Axios from "axios";
const _cliProgress = require('cli-progress');
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: "emails.csv",
  header: [{ id: "name", title: "Name" }, { id: "email", title: "Email" }]
});

const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question(
  `\n\n${chalk.green.bold(`Welcome to Scrapebot..!!`)}\n\nThis is a tool where you can enter keywords and get email addresses of\ndevelopers that have worked${` `}on some technologies related to the keywords... \n\n################################################################################\n\nPlease enter the keywords you wish to search for (comma seperated) : `,
  async keywords => {
    console.log(`\nSearching for keywords - ${chalk.blue.bold(keywords)}!\n\n`);
    const url = encodeURI(
      `https://api.github.com/search/repositories?q=${keywords
        .split(",")
        .join("+")}`
    );
    readline.close();

    const reposList = await searchForRepos(keywords, 0, []);
    console.log(`\n\n${chalk.white.bgGreen.bold('DONE')} Retrieved ${chalk.bold(
        `${reposList.length}`)} repositories`)

    await sleep(100);
    if (reposList.length !== 0) {
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
      console.log(`\n\n${chalk.black.bgYellow.bold(`In progress`)} Mining information from the repositories...\n\n`);
      Axios.all(repos.map(item => fetchAllCommitsAPI(item.full_name))).then(
        (result: any[]) => {
          const array_of_array = result.map(item =>
            Array.from(item).map(item => item[1])
          );
          const new_array = Array.prototype.concat.apply([], array_of_array);
          csvWriter
            .writeRecords(new_array)
            .then(() =>
              console.log(
                `\n\nAll emails collected successfully. Emails are available on ${chalk.whiteBright.bold(
                  `emails.csv`
                )}...\nThank you for using this tool.For more info visit https://github.com/kirananto`
              )
            );
        }
      );
    } else {
      console.log("\nSorry no results found, Please search for something else");
    }
  }
);
const bar1 = new _cliProgress.SingleBar({}, _cliProgress.Presets.shades_classic);

const searchForRepos = async (keywords: string, page: number,prevReposList: any[]) => {
const reposList = prevReposList;
  let result;
  try {
    result = await axios({
      url: encodeURI(
        `https://api.github.com/search/repositories?q=${keywords
          .split(",")
          .join("+")}`
      )
    });
    if(reposList.length === 0) {
        bar1.start(result.data.total_count, 0);
    }
    await reposList.push(...result.data.items);
    bar1.update(reposList.length);
    if (result.data.total_count > reposList.length ) {
      await sleep(result.data.total_count > 270 ? 1000 : 10);
      return await searchForRepos(keywords, page + 1,reposList)
    } else {
      return reposList;
    }
  } catch (e) {
    console.log(e, 'err')
    await sleep(1000);
    return searchForRepos(keywords, page, reposList);
  }
};

const fetchAllCommitsAPI = repo_name => {
  return axios({
    url: `https://api.github.com/repos/${repo_name}/commits`
  })
    .then(result => {
      console.log(
        `Got emails from ${chalk.green.bold(repo_name)}, Processing it...`
      );
      const emails = new Map(
        result.data
          .filter(item => {
            return !item.commit.author.email.includes(
              "users.noreply.github.com"
            );
          })
          .map(item => [
            item.commit.author.email,
            {
              name: item.commit.author.name,
              email: item.commit.author.email
            }
          ])
      );
      return emails;
    })
    .catch(error => {
    //   console.log("ERROR", error);
    });
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
