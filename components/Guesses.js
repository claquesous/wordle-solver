import { useContext, useEffect, useState } from 'react'
import Outcomes from './Outcomes.js'
import { FilteredAnswersContext } from '../contexts/FilteredAnswersContext.js'
import { applyRegex } from '../regex.js'

export default function Guesses({ guesses, count, outcome }) {
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

  if (guesses.length === 0) {
    guesses = filteredGuesses
  }

  function sortGuesses(word1, word2) {
    return !!outcome.guessOutcomes &&
      outcome.guessOutcomes[word1] && outcome.guessOutcomes[word2] ?
      outcome.guessOutcomes[word2].length - outcome.guessOutcomes[word1].length : 0
  }

  return (<>
    <div onClick={ show }
      className={`collapsible ${collapsed ? '' : 'opened'}`} >
      {`${6-count} guess${count===5 ? '' : 'es'}`} remaining and { guesses.length || 'unknown' } possible solutions remain
    </div>
    <div className={ collapsed ? 'hide' : '' }>
      <ul>
        {guesses.sort(sortGuesses).map(guess =>
          <li key={ guess }>
            <Outcomes
              guess={ guess }
              count={ count }
              outcomeKeys={ !!outcome.guessOutcomes ? outcome.guessOutcomes[guess] : [] }
              root={outcome.key}
            />
          </li>
        )}
      </ul>
    </div>
  </>)
}

