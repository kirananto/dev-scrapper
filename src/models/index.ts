const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db/db.json')
const db = low(adapter)
db.defaults({ emails: [], keywords: [], repos: [], count: 0 }).write()

db._.mixin({
    pushUnique: function(array, key, newEl) {
        if (array.findIndex(el => el[key] === newEl[key]) === -1) {
            array.push(newEl)
        }
        return array
    },
})

// EMAIL
export const pushEmail = async ({ email, name, keyword, repoName }: { email: string; name: string; keyword: string; repoName: string }) => {
    await db
        .get('emails')
        .pushUnique('email', { email, name, keyword, repoName, repoId: repoName.split('/').join('_') })
        .write()
}

export const getEmailList = async (filterSet: { keyword?: string; repoId?: string; email?: string }) => {
    return await db
        .get('emails')
        .filter(filterSet)
        .sortBy('email')
        .value()
}

export const getEmailListCount = async (filterSet: { keyword?: string; repoName?: string; email?: string }) => {
    return await db
        .get('emails')
        .filter(filterSet)
        .sortBy('email')
        .size()
        .value()
}

export const pushKeyword = async ({ keyword, reposCount, emailsCount }: { keyword: string; reposCount: number, emailsCount: number }) => {
    await db
        .get('keywords')
        .pushUnique('keyword', { keyword: keyword, time: new Date().toISOString(), totalReposCount: reposCount, totalCompletedRepos: 0, totalEmailsCount: emailsCount, completed: false })
        .write()
}

export const getKeywords = async (filterSet?: { keyword: string }) => {
    return await db
        .get('keywords')
        .filter(filterSet)
        .sortBy('keyword')
        .value()
}

export const updateKeyword = async (filterSet?: { keyword: string }, updateContent?: object) => {
    await db
        .get('keywords')
        .find(filterSet)
        .assign(updateContent)
        .write()
}

export const pushRepo = async ({ repoName, repoUrl, keyword }: { repoName: string; repoUrl: string; keyword: string }) => {
    await db
        .get('repos')
        .pushUnique('repoName', { repoName: repoName, repoId: repoName.split('/').join('_'), repoUrl: repoUrl, keyword: keyword, completed: false })
        .write()
}

export const getRepos = async (filterSet?: { keyword: string, repoName?: string, repoId?: string }) => {
    return await db
        .get('repos')
        .filter(filterSet)
        .sortBy('repoName')
        .value()
}

export const updateRepos = async (filterSet?: { repoName: string }, updateContent?: object ) => {
    await db
        .get('repos')
        .find(filterSet)
        .assign(updateContent)
        .write()
}
