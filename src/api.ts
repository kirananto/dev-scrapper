import chalk from 'chalk'
import { getKeywords, getRepos, getEmailList } from './models'
import { scrapeEmails } from './core/scrapeEmails'
var bodyParser = require('body-parser')
var cors = require('cors')
const express = require('express')
const app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors())

app.get('/keywords', function(req, res) {
    getKeywords().then(result => {
        res.send(result)
    })
})

app.post('/keywords', function(req, res) {
    scrapeEmails(req.body.keywords.split(',').map(item => item.trim()), 'api')
    res.json({ message: "Enqueued the task"})
})

app.get('/keywords/:keyword', function(req, res) {
    getKeywords({ keyword: req.params.keyword }).then(result => {
        res.json(result)
    })
})

app.get('/keywords/:keyword/repos', function(req, res) {
    getRepos({ keyword: req.params.keyword }).then(result => {
        res.json(result)
    })
})

app.get('/keywords/:keyword/repos/:repoId', function(req, res) {
    getRepos({ keyword: req.params.keyword, repoId: req.params.repoId }).then(result => {
        res.json(result)
    })
})

app.get('/keywords/:keyword/repos/:repoId', function(req, res) {
    getEmailList({ keyword: req.params.keyword, repoId: req.params.repoId }).then(result => {
        res.json(result)
    })
})

app.get('/keywords/:keyword/emails/', function(req, res) {
    getEmailList({ keyword: req.params.keyword }).then(result => {
        res.json(result)
    })
})

app.listen(3241)
console.log(`Server running on ${chalk.green.bold(`http://localhost:3241`)}`)
