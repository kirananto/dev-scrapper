#!/usr/bin/env node

import chalk from 'chalk'
import { searchForRepos } from './searchForRepos'
import { uniqBy, sleep } from '../helpers/helpers'
import { fetchAllCommitsForSingleRepo } from './fetchAllCommitsForSingleRepo'
import { format } from 'date-fns'
import { checkForTor } from './tor'
import { pushRepo, getEmailList, updateKeyword } from '../models'
const fileName = `./output/${format(new Date(), `yyyy_MM_dd_HH_mm`)}`

const createCsvWriter = require('csv-writer').createObjectCsvWriter
export const scrapeEmails = async keywords => {
    try {
        await checkForTor(0)
        console.log(`\nSearching for keywords: \n${chalk.blue.bold(keywords.map((item, index) => `\n${index + 1}. ${item}`))}\n\n`)
        let reposList = await searchForRepos(keywords, 0, [])
        if (reposList.length > 0) {
            reposList = uniqBy(reposList, JSON.stringify)
            console.log(`\n\n${chalk.white.bgGreen.bold(` DONE `)} Retrieved ${chalk.bold(`${reposList.length}`)} repositories`)
            const repos = await reposList.map(item => {
                return {
                    full_name: item.full_name,
                    api_url: `https://api.github.com/repos/${item.full_name}/commits/`,
                    web_url: `https://github.com/${item.full_name}/commits/master`,
                }
            })
            for (let repo of repos) {
                await pushRepo({
                    repoName: repo.full_name,
                    repoUrl: repo.web_url,
                    keyword: keywords.join('_'),
                })
            }
            await sleep(500)
            console.log(`\n\n${chalk.black.bgYellow.bold(`In progress`)} Mining information from the repositories...\n\n`)
            for (let item of repos) {
                await fetchAllCommitsForSingleRepo(item.full_name, keywords, `${fileName}_${keywords.join('_').replace(/ /g, '')}.csv`)
                await updateKeyword({ keyword: keywords.join('_') }, { totalCompletedRepos: item+1 })
            }
            const uniqueEmails = await getEmailList({ keyword: keywords.join('_') })
            const csvWriter = createCsvWriter({
                path: `${fileName}_${keywords.join('_').replace(/ /g, '')}_final.csv`,
                header: [{ id: 'name', title: 'Name' }, { id: 'email', title: 'Email' }, { id: 'keyword', title: 'Keyword' }],
            })
            await csvWriter.writeRecords(uniqueEmails)
            await updateKeyword({ keyword: keywords.join('_') }, { totalEmailsCount: uniqueEmails.length, completed: true })
            console.log(
                `\n\n${chalk.green.bold(`${uniqueEmails.length}`)} emails collected successfully.\nData is available in ${chalk.whiteBright.bold(
                    `${fileName}_${keywords.join('_').replace(/ /g, '')}_final.csv`
                )}...\nThank you for using this tool.\nFor more info visit https://github.com/kirananto\n\n`
            )
            process.exit()
        } else {
            console.log('\n\nSorry no results found, Please search for something else\n')
            process.exit()
        }
    } catch {
        console.log('\n❌ Cannot connect to Tor network\n')
        console.log(`\n\t${chalk.bold.underline('Quickfixes : ')}\n\n`)
        console.log(`\tOSX: 'brew install tor && tor'         # installs and runs tor`)
        console.log(`\n\tDebian/Ubuntu: 'apt-get install tor'   # should auto run as daemon after install\n`)
        process.exit()
    }
}
