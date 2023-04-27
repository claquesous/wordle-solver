import { useState } from 'react'
import Letter from './Letter.js'

export default function Word() {
  const [cursor, setCursor] = useState(0)
  const [guess, setGuess] = useState([])
  const [outcome, setOutcome] = useState({
    known: [],
    misplaced: [[], [], [], [], []],
    missing: [],
    counts: {},
  })

  function handleLetter(position, letter) {
    guess[position] = letter
    outcome.missing.push(letter)
    setOutcome(outcome)
    setGuess(guess)
    setCursor(position+1)
  }

  function handleResult(result, letter, position) {
    switch (result) {
      case 0:
        outcome.missing.push(letter)
        delete outcome.known[position]
        outcome.counts[letter]--
        break;
      case 1:
        outcome.misplaced[position].push(letter)
        outcome.counts[letter] = (outcome.counts[letter] || 0) +1
        outcome.missing.splice(outcome.missing.indexOf(letter),1)
        break;
      case 2:
        outcome.known[position] = letter
        outcome.misplaced[position].splice(outcome.misplaced[position].indexOf(letter),1)
        break;
    }
    setOutcome(outcome)
  }

  function handleKeyDown(e) {
    if (e.key === 'Tab') {
      e.preventDefault()
    }
  }

  return (
    <div onKeyDown={ handleKeyDown }>
      <Letter position={ 0 } onSetLetter={ handleLetter } onSetResult={ handleResult } cursor={ cursor } />
      <Letter position={ 1 } onSetLetter={ handleLetter } onSetResult={ handleResult } cursor={ cursor } />
      <Letter position={ 2 } onSetLetter={ handleLetter } onSetResult={ handleResult } cursor={ cursor } />
      <Letter position={ 3 } onSetLetter={ handleLetter } onSetResult={ handleResult } cursor={ cursor } />
      <Letter position={ 4 } onSetLetter={ handleLetter } onSetResult={ handleResult } cursor={ cursor } />
    </div>
  )
}

