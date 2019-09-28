import { sleep, uniqBy } from './helpers'
import chalk from 'chalk'
import { RequestForNewIP } from './tor'
import { getViaTor } from './apiRequest'
const createCsvWriter = require('csv-writer').createObjectCsvWriter

export const fetchAllCommitsForSingleRepo = async (repo_name, keywords, fileName) => {
    const csvWriter = createCsvWriter({
        path: fileName,
        header: [{ id: 'name', title: 'Name' }, { id: 'email', title: 'Email' }, { id: 'keyword', title: 'Keyword' }],
        append: true,
    })
    const emails_array = []
    let page = 0
    let emails_new = []
    do {
        try {
            await sleep(6000)
            const result = await getViaTor({
                url: `https://api.github.com/repos/${repo_name}/commits?page=${page}`
            })
            emails_new = result.data
                .filter(item => !(item.commit.author.email.includes('users.noreply.github.com') || item.commit.author.email.includes('@example.com')))
                .map(item => ({
                    keyword: keywords,
                    name: item.commit.author.name,
                    email: item.commit.author.email,
                }))
            page++
            emails_array.push(...emails_new)
            const emails = uniqBy(emails_new, JSON.stringify)
            await sleep(200)
            await csvWriter.writeRecords(emails)
            console.log(`🔄 ${chalk.bgBlue.bold(` PASS ${page} `)} Retrieved ${chalk.green.bold(`${emails_array.length - emails.length}`)} unique emails from page ${page} of ${chalk.green.bold(repo_name)}`)
        } catch (error) {
            console.log(`\n⚠️ Rate limit reached, Trying to refresh the ip address\n`)
            try {
                await RequestForNewIP()
            } catch {
                console.log(`\n❌ Cannot retrieving data from ${chalk.red.bold(repo_name)}, stopping mining in this repo`)
                emails_new = []
                const uniqueEmails = uniqBy(emails_array, JSON.stringify)
                return uniqueEmails
            }
        }
    } while (emails_new.length !== 0)
    const uniqueEmails = uniqBy(emails_array, JSON.stringify)
    console.log(`✅ Collected total ${chalk.green.bold(`${uniqueEmails.length}`)} unique emails from ${chalk.green.bold(repo_name)}\n`)
    return uniqueEmails
}
