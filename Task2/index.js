import readline from 'readline'
import fs from 'fs'
import _ from 'lodash'

const path = './simple-wikipedia/corpus/'
// const path = './resources/'
const vocabulary = new Map()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const recursiveAsyncReadLine = () => {
  rl.question(`Enter query, empty to quit: `, (answer) => {
      if (answer.length === 0) {
        return rl.close()
      }

      // query time
      const queryTerms = answer.toLowerCase().split(' ')
      const results = search(queryTerms)
      const top5 = Array.from(results).sort((a, b) => {
        return a[1].score - b[1].score;
      }).slice(0, 5)

      console.log(`Found ${results.size} results, showing top 5`)

      top5.forEach(file => {
        const document = results.get(file[0])
        console.log(`\n${file[0]}: score ${document.score}`)

        document.terms.forEach((score, term) => {
          console.log(`${term}: ${score}`)
        })
      })

      console.log('\n')
      recursiveAsyncReadLine()
  })
}

// index time
buildVocabulary()

// start recusrive asking for query
recursiveAsyncReadLine()

// Implementation: index time
function buildVocabulary() {
  let docNum = 0

  // create vocabulary and count tf
  fs.readdirSync(path).forEach(file => {
    docNum += 1
    const terms = fs.readFileSync(path + file, 'utf8').replace(/[.,\/#!$%\^&\*;:{}=\_`~()]/g,'').toLowerCase().split(/[\W-]+/)

		terms.forEach(term => {
      // term e.g. 'book' is already in vocabulary, add document or increment document occurence
			if(vocabulary.has(term)) {
        // increase document occurence by 1
        if(vocabulary.get(term).docs.has(file)) {
          vocabulary.get(term).docs.set(file, vocabulary.get(term).docs.get(file) + 1)
        }
        // add document and set occurence to 1
        else {
          vocabulary.get(term).docs.set(file, 1)
        }
      }
      // term e.g. 'book' is not in the vocabulary, add the therm with intial object structure
      else {
        const termObj = {
          'idf': -1,
          'docs': new Map([[file, 1]])
        }
        vocabulary.set(term, termObj)
			}
		})
  })

  // calculate idf
  vocabulary.forEach(termObj => {
    termObj.idf = docNum / termObj.docs.size
  })
}

// Implementation: query time
function search(queryTerms) {
  const queries = Array.from(queryTerms)
  let results = new Set(Array.from(vocabulary.get(queries[0]).docs.keys()))
  queries.shift()

  queries.forEach(query => {
    const files = new Set(Array.from(vocabulary.get(query).docs.keys()))

    if (files) {
      results = new Set(
        [...results].filter(x => files.has(x)));
    }
  })

  const documents = Array.from(results)
  const result = new Map()
  
  // calculate tf-idf score
  documents.forEach(document => {
    const docObj = {
      score: 0,
      terms: new Map()
    }
    result.set(document, docObj)

    queryTerms.forEach(term => {
      let termScore = Math.round(vocabulary.get(term).docs.get(document) * vocabulary.get(term).idf)
      result.get(document).terms.set(term, termScore)
      result.get(document).score = result.get(document).score + termScore
    })
  })

  return result
}
