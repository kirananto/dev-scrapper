#!/usr/bin/env node

import chalk from 'chalk'
import { searchForRepos } from './searchForRepos'
import { uniqBy, sleep } from './helpers'
import { fetchAllCommitsForSingleRepo } from './fetchAllCommitsForSingleRepo'
import { format, compareAsc } from 'date-fns'
const fileName = `output/${format(new Date(), `yyyy/MM/dd'T'HH:mm`)}`

const createCsvWriter = require('csv-writer').createObjectCsvWriter

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
})

readline.question(
    `\n\n${chalk.green.bold(
        `🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥\n\nWelcome to DevScrapper..!!`
    )}\n\nThis is a tool where you can enter keywords and get email addresses of\ndevelopers that have worked${` `}on some technologies related to the keywords... \n\n🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥\n\nPlease enter the keywords you wish to search for (comma seperated) : `,
    async keywords => {
        console.log(`\nSearching for keywords - ${chalk.blue.bold(keywords)}!\n\n`)
        const url = encodeURI(`https://api.github.com/search/repositories?q=${keywords.split(',').join('+')}`)
        readline.close()
        let reposList = await searchForRepos(keywords, 0, [])
        if (reposList.length > 0) {
            reposList = uniqBy(reposList, JSON.stringify)
            console.log(`\n\n${chalk.white.bgGreen.bold(` DONE `)} Retrieved ${chalk.bold(`${reposList.length}`)} repositories`)
            await sleep(100)
            const repos = reposList.map(item => {
                return {
                    full_name: item.full_name,
                    api_url: `https://api.github.com/repos/${item.full_name}/commits/`,
                    web_url: `https://github.com/${item.full_name}/commits/master`,
                }
            })

            await sleep(500)
            console.log(`\n\n${chalk.black.bgYellow.bold(`In progress`)} Mining information from the repositories...\n\n`)
            const totalEmails = []
            for (const item of repos) {
                const emailsArray = await fetchAllCommitsForSingleRepo(item.full_name, keywords, `${fileName}-${keywords.split(',').join('_')}.csv`)
                totalEmails.push(...emailsArray)
            }

            const uniqueEmails = uniqBy(totalEmails, JSON.stringify)
            const csvWriter = createCsvWriter({
                path: `${fileName}_${keywords.split(',').join('-')}_final.csv`,
                header: [{ id: 'name', title: 'Name' }, { id: 'email', title: 'Email' }, { id: 'keyword', title: 'Keyword' }],
            })

            await csvWriter.writeRecords(uniqueEmails)

            console.log(
                `\n\n${chalk.green.bold(`${uniqueEmails.length}`)} emails collected successfully. Data is available in ${chalk.whiteBright.bold(
                    `./${fileName}_${keywords.split(',').join('-')}_final.csv`
                )}...\nThank you for using this tool.For more info visit https://github.com/kirananto\n\n`
            )
            process.exit()
        } else {
            console.log('\n\nSorry no results found, Please search for something else\n')
            process.exit()
        }
    }
)
