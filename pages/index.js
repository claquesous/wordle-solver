import { useState, useEffect } from 'react'
import Word from '../components/Word.js'
import GuessList from '../components/GuessList.js'
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
  const [count, setCount] = useState(0)

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
    setCount(count+1)
  }

  return <div>
    <Word guess={ 0 } attempt={attempt} onSubmit={ handleAttempt } mergedOutcome={ mergedOutcome } />
    <Word guess={ 1 } attempt={attempt} onSubmit={ handleAttempt } mergedOutcome={ mergedOutcome } />
    <Word guess={ 2 } attempt={attempt} onSubmit={ handleAttempt } mergedOutcome={ mergedOutcome } />
    <Word guess={ 3 } attempt={attempt} onSubmit={ handleAttempt } mergedOutcome={ mergedOutcome } />
    <Word guess={ 4 } attempt={attempt} onSubmit={ handleAttempt } mergedOutcome={ mergedOutcome } />
    <Word guess={ 5 } attempt={attempt} onSubmit={ handleAttempt } mergedOutcome={ mergedOutcome } />
    <FilteredAnswersContext.Provider value={ filteredAnswers }>
      <GuessList count={ count } guesses={ filteredAnswers } outcome={ node } />
    </FilteredAnswersContext.Provider>
    <div>{ regexString }</div>
    <div>{ JSON.stringify(mergedOutcome) }</div>
    <div>{ regexToHash(regexString) }</div>
  </div>
}

export async function getStaticProps() {
  return {
    props: {
      answers,
    }
  }
}

export default HomePage

