import chalk from "chalk"
import { getKeywords, getRepos, getEmailList } from "./models"
var cors = require('cors')

const express = require('express')
const app = express()
app.use(cors())
 
app.get('/keywords', function (req, res) {
    getKeywords().then(result => {
        res.send(result)
    })
})

app.get('/keywords/:keyword', function (req, res) {
    getKeywords({ keyword: req.params.keyword}).then(result => {
        res.json(result)
    })
})

app.get('/keywords/:keyword/repos', function (req, res) {
    getRepos({ keyword: req.params.keyword}).then(result => {
        res.json(result)  
    })
})

app.get('/keywords/:keyword/repos/:repoId', function (req, res) {
    getRepos({ keyword: req.params.keyword, repoId: req.params.repoId }).then(result => {
        res.json(result)  
    })
})

app.get('/keywords/:keyword/repos/:repoId', function (req, res) {
    getEmailList({ keyword: req.params.keyword, repoId: req.params.repoId }).then(result => {
        res.json(result)  
    })
})

app.get('/keywords/:keyword/emails/', function (req, res) {
    getEmailList({ keyword: req.params.keyword}).then(result => {
        res.json(result)  
    })
})


app.listen(3241)
console.log(`Server running on ${chalk.green.bold(`https://localhost:3241`)}`)