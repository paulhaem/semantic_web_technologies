import readline from 'readline'
import fs from 'fs'

const path = './resources/'
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
      // index time
      buildVocabulary()

      // query time
      const queryTerms = answer.toLowerCase().split(' ')
      const results = search(queryTerms)
      console.log("Results:")
      console.log(results)

      recursiveAsyncReadLine()
  })
}

recursiveAsyncReadLine()

// Implementation: index time
function buildVocabulary() {
  fs.readdirSync(path).forEach(file => {
    const terms = fs.readFileSync(path + file, 'utf8').replace(/[.,\/#!$%\^&\*;:{}=\_`~()]/g,'').toLowerCase().split(/[\W-]+/)

		terms.forEach((term) => {
			if(vocabulary.has(term)) {
        if(!vocabulary.get(term).includes(file)) {
          vocabulary.get(term).push(file)
        }
      }
      else {
        vocabulary.set(term, [file])
			}
		})
  })
}

// Implementation: query time
function search(queryTerms) {
  let results = new Set(vocabulary.get(queryTerms[0]))
  queryTerms.shift()

  queryTerms.forEach(queryTerm => {
    const files = new Set(vocabulary.get(queryTerm))
    if (files) {
      results = new Set(
        [...results].filter(x => files.has(x)));
    }
  })
  
  return Array.from(results).sort()
}
