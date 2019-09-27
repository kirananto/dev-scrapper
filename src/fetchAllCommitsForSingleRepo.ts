import { sleep, uniqBy } from './helpers'
import Axios from 'axios'
import chalk from 'chalk'
const createCsvWriter = require('csv-writer').createObjectCsvWriter

export const fetchAllCommitsForSingleRepo = async (repo_name, keywords, fileName) => {
    const csvWriter = createCsvWriter({
        path: fileName,
        header: [{ id: 'name', title: 'Name' }, { id: 'email', title: 'Email' }, { id: 'keyword', title: 'Keyword' }],
        append: true,
    })
    try {
        await sleep(6000)
        const result = await Axios({
            url: `https://api.github.com/repos/${repo_name}/commits`,
        })
        const emails_array: any[] = result.data
            .filter(item => !(item.commit.author.email.includes('users.noreply.github.com') || item.commit.author.email.includes('@example.com')))
            .map(item => ({
                keyword: keywords,
                name: item.commit.author.name,
                email: item.commit.author.email,
            }))
        const emails = uniqBy(emails_array, JSON.stringify)
        await sleep(200)
        await csvWriter.writeRecords(emails)
        console.log(`✅ Collected ${chalk.green.bold(`${emails_array.length}`)} emails from ${chalk.green.bold(repo_name)}`)
        return emails
    } catch (error) {
        console.log(`❌ Cannot retriving data from ${chalk.red.bold(repo_name)}`)
        //   console.log("ERROR", error);
        return []
    }
}
