const tr = require('tor-request')
const { spawn } = require('child_process')
import { sleep } from './helpers'
tr.TorControlPort.password = 'giraffe'
// tr.request('https://api.ipify.org', (err, res, body) => {
//     if (!err && res.statusCode == 200) {
//         console.log('Your public (through Tor) IP is: ' + body)
//     } else {
//         console.error('e', err)
//     }
// })

export const checkForTor = retryCount => {
    if (retryCount) {
        console.log(`\n🔄 [${retryCount + 1}/5]Initializing for Tor connection`)
    } else {
        console.log('\n🔄 Checking for Tor connection')
    }
    return new Promise((resolve, reject) => {
        tr.request('https://api.ipify.org', async (err, res, body) => {
            if (!err && res.statusCode == 200) {
                await tr.newTorSession(err => {
                    if (err) {
                        console.log(err)
                        console.log(
                            `\n\nYou need to enable the Tor ControlPort if you want to programmatically refresh the Tor session \n For more info read - https://github.com/talmobi/tor-request#optional-configuring-tor-enabling-the-controlport\n`
                        )
                        console.log(`\n💀 Killing tor instance, Please do the above and run the command again\n`)
                        const kill = spawn('pkill tor')
                        sleep(1000).then(result => {
                            reject()
                        })
                    } else {
                        console.log('\n✅ You are connected to tor network\nYour public (through Tor) IP is: ' + body)
                        resolve()
                    }
                })
            } else {
                if (retryCount > 5) {
                    reject()
                } else {
                    console.log(retryCount === 0 ? `\n⚠️ No running instance of tor found, attempting to connect` : ``)
                    const tor = spawn('tor')
                    sleep(1000).then(result => {
                        resolve(checkForTor(retryCount + 1))
                    })
                }
                // Reject after attempt
                // reject()
            }
        })
    })
}

export const RequestForNewIP = () =>
    new Promise((resolve, reject) => {
        tr.newTorSession(err => {
            if (err) {
                console.log(err)
                console.log(
                    `\n\nYou need to enable the Tor ControlPort if you want to programmatically refresh the Tor session \n For more info read - https://github.com/talmobi/tor-request#optional-configuring-tor-enabling-the-controlport\n`
                )
                console.log(`\n💀 Killing tor instance, Please do the above and run the command again\n`)
                const kill = spawn('pkill tor')
                sleep(1000).then(result => {
                    reject()
                })
            } else {
                console.log('\n✅ Your IP is rotated')
                tr.request('https://api.ipify.org', async (err, res, body) => {
                    if (!err && res.statusCode == 200) {
                        console.log('\nYour public (through Tor) IP is: ' + body)
                        resolve()
                    } else {
                        reject(new Error('Error rotating ip'))
                    }
                })
            }
        })
    })
