import { uniqBy, sleep } from './helpers'
import Axios from 'axios'
import chalk from 'chalk'
const _cliProgress = require('cli-progress')

const bar1 = new _cliProgress.SingleBar({}, _cliProgress.Presets.shades_classic)

export const searchForRepos = async (keywords: string, page: number, prevReposList: any[]) => {
    const reposList = uniqBy(prevReposList, JSON.stringify)
    let result
    try {
        result = await Axios({
            url: encodeURI(`https://api.github.com/search/repositories?q=${keywords.split(',').join('+')}`),
        })
        if (reposList.length === 0) {
            bar1.start(result.data.total_count, 0)
        }
        await reposList.push(...result.data.items)

        bar1.update(reposList.length)
        if (result.data.total_count > reposList.length) {
            await sleep(result.data.total_count > 100 ? 6100 : 10)
            return await searchForRepos(keywords, page + 1, reposList)
        } else {
            bar1.update(result.data.total_count)
            await sleep(1000)
            return reposList
        }
    } catch (e) {
        console.log(`${chalk.red.bold(`\n\n\nRate Limited `)} - Sleeping for 1 minute\n`)
        await sleep(30000)
        console.log('30 seconds left...\n')
        await sleep(20000)
        console.log('10 seconds left...\n')
        await sleep(7000)
        console.log('3 seconds left...\n')
        await sleep(3000)
        return searchForRepos(keywords, page, reposList)
    }
}
