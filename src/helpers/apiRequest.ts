const tr = require('tor-request')
export const getViaTor = content =>
    new Promise<any>((resolve, reject) => {
        try {
            tr.request(
                content.url,
                {
                    url: content.url,
                    headers: { 'User-Agent': 'nodejs' },
                },
                (err, res, body) => {
                    if (!err && res.statusCode == 200) {
                        resolve({ data: JSON.parse(body) })
                    } else {
                        reject(err)
                    }
                }
            )
        } catch (error) {
            console.log('error', error)
        }
    })
