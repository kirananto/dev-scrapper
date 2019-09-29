import { sleep, uniqBy } from '../helpers/helpers'
import chalk from 'chalk'
import { RequestForNewIP } from './tor'
import { getViaTor } from '../helpers/apiRequest'
import { pushEmail, getEmailListCount, updateRepos } from '../models'

export const fetchAllCommitsForSingleRepo = async (repo_name, keywords, fileName) => {
    let page = 0
    let emails_new = []
    do {
        try {
            // 6 seconds is the ideal, let's try reducing
            await sleep(1000)
            const result = await getViaTor({
                url: `https://api.github.com/repos/${repo_name}/commits?page=${page}`,
            })
            emails_new = result.data
                .filter(item => !(item.commit.author.email.includes('users.noreply.github.com') || item.commit.author.email.includes('@example.com')))
                .map(item => ({
                    keyword: keywords.join('_'),
                    name: item.commit.author.name,
                    email: item.commit.author.email,
                }))
            page++
            const emails = uniqBy(emails_new, JSON.stringify)
            await sleep(100)
            for (let email of emails) {
                await pushEmail({
                    email: email.email,
                    keyword: email.keyword,
                    name: email.name,
                    repoName: repo_name,
                })
            }
            console.log(
                `🔄 ${chalk.bgBlue.bold(` PASS ${page} `)} Retrieved ${chalk.green.bold(
                    `${emails.length}`
                )} emails from page ${page} of ${chalk.green.bold(repo_name)}`
            )
        } catch (error) {
            console.log(`\n⚠️ Rate limit reached, Trying to refresh the ip address\n`)
            try {
                await RequestForNewIP()
            } catch {
                console.log(`\n❌ Cannot retrieving data from ${chalk.red.bold(repo_name)}, stopping mining in this repo`)
                emails_new = []
            }
        }
    } while (emails_new.length !== 0)
    const emailsCount = await getEmailListCount({ keyword: keywords.join('_'), repoName: repo_name })
    await updateRepos({ repoName: repo_name }, { completed: true, emailCount: emailsCount })
    console.log(`✅ Collected total ${chalk.green.bold(`${emailsCount}`)} unique emails from ${chalk.green.bold(repo_name)}\n`)
}
