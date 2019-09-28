export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

export const uniqBy = (a, key) => {
    let seen = new Set()
    return a.filter(item => {
        let k = key(item)
        return seen.has(k) ? false : seen.add(k)
    })
}
