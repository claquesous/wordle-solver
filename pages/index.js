import { useState, useEffect } from 'react'
import Word from '../components/Word.js'
import Guesses from '../components/Guesses.js'
import { FilteredAnswersContext } from '../contexts/FilteredAnswersContext.js'
import { mergeOutcomes } from '../outcomes.js'
import { answers } from '../answers.js'
import { constructAnswersRegex, applyRegex, regexToHash } from '../regex.js'

function HomePage({ answers }) {
  const [attempt, setAttempt] = useState(0)
  const [filteredAnswers, setFilteredAnswers] = useState(answers)
  const [mergedOutcome, setMergedOutcome] = useState({
    known: [],
    misplaced: [[], [], [], [], []],
    missing: [],
    counts: {},
  })
  const regexString = constructAnswersRegex(mergedOutcome, answers)
  const [node, setNode] = useState({})

  useEffect(() => {
    const hash = regexToHash(regexString)
    const file = hash.substring( hash.length -5 )
    fetch(`/solve/${file}.json`).then(res => res.json()).then((data) => {
      setNode(data[hash] || {})
    }).catch(() => setNode({}))
  }, [mergedOutcome])

  function handleAttempt(outcome) {
    setAttempt(attempt+1)
    const newOutcome = mergeOutcomes(mergedOutcome,outcome)
    setMergedOutcome(newOutcome)
    const regexString = constructAnswersRegex(newOutcome, answers)
    setFilteredAnswers(applyRegex(regexString,filteredAnswers))
  }

  return <>
    <Word active={ attempt===0 } onSubmit={ handleAttempt } />
    <Word active={ attempt===1 } onSubmit={ handleAttempt } />
    <Word active={ attempt===2 } onSubmit={ handleAttempt } />
    <Word active={ attempt===3 } onSubmit={ handleAttempt } />
    <Word active={ attempt===4 } onSubmit={ handleAttempt } />
    <Word active={ attempt===5 } onSubmit={ handleAttempt } />
    <FilteredAnswersContext.Provider value={ filteredAnswers }>
      <Guesses count={ attempt } guesses={ filteredAnswers } outcome={ node } />
    </FilteredAnswersContext.Provider>
  </>
}

export async function getStaticProps() {
  return {
    props: {
      answers,
    }
  }
}

export default HomePage

