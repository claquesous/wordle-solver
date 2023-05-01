import { useContext, useEffect, useState } from 'react'
import styles from './GuessList.module.css'
import GuessDrillDown from './GuessDrillDown.js'
import { FilteredAnswersContext } from '../contexts/FilteredAnswersContext.js'
import { applyRegex } from '../regex.js'

export default function GuessList({guesses, count, outcome = {}}) {
  const [collapsed, setCollapsed] = useState(true)
  const filteredAnswers = useContext(FilteredAnswersContext)
  const [ filteredGuesses, setFilteredGuesses ] = useState(guesses)

  function show() {
    setCollapsed(!collapsed)
  }

  useEffect(() => {
    if (outcome.validAnswersRegex && guesses.length === 0) {
      setFilteredGuesses(applyRegex(outcome.validAnswersRegex, filteredAnswers))
    }
  }, [outcome.validAnswersRegex])

  return (<div>
    <div onClick={ show }>{`${6-count} guess${count!==5 ? 'es' : ''} remaining and `}{ filteredGuesses.length ? filteredGuesses.length : 'unknown' } possible solutions remain</div>
    <div className={ collapsed ? styles.hide : '' }>
      <div>{ outcome.validAnswersRegex }</div>
      <ul>
        {filteredGuesses.map(guess =>
          <GuessDrillDown key={ guess } guess={ guess }
            count={ count }
            outcomeKeys={ outcome[guess] } />
        )}
      </ul>
    </div>
  </div>)
}

