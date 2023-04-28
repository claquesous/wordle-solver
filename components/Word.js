import { useState, useEffect } from 'react'
import Letter from './Letter.js'

export default function Word({ guess, attempt, onSubmit }) {
  const [cursor, setCursor] = useState(null)
  const [word, setWord] = useState([])
  const [outcome, setOutcome] = useState({
    known: [],
    misplaced: [[], [], [], [], []],
    missing: [],
    counts: {},
  })

  useEffect(() => {
    if (guess === attempt) {
      setCursor(0)
    }
  }, [attempt])

  function handleLetter(position, letter) {
    word[position] = letter
    outcome.missing.push(letter)
    setOutcome(outcome)
    setWord(word)
    setCursor(position+1)
  }

  function handleBackspace(position, letter) {
    const newPosition = !letter ? position -1 : position
    const deletedLetter = word[newPosition]
    delete word[newPosition]
    if (outcome.known[newPosition]===deletedLetter) {
      delete outcome.known[newPosition]
      outcome.counts[deletedLetter]--
    }
    else if (outcome.misplaced[newPosition].includes(deletedLetter)) {
      outcome.misplaced[newPosition].splice(outcome.misplaced[newPosition].indexOf(deletedLetter),1)
      outcome.counts[deletedLetter]--
    }
    else {
      outcome.missing.splice(outcome.missing.indexOf(deletedLetter),1)
    }
    setOutcome(outcome)
    setWord(word)
    setCursor(newPosition)
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

  function isValid() {
    return word.join('').length === 5
  }

  function handleKeyDown(e) {
    if (e.key === 'Tab') {
      e.preventDefault()
    }
    else if (e.key === 'Enter') {
      if (isValid()) {
        onSubmit(outcome)
      }
    }
  }

  return (
    <div onKeyDown={ handleKeyDown }>
      <Letter position={ 0 } onSetLetter={ handleLetter } onBack={ handleBackspace } onSetResult={ handleResult } cursor={ cursor } />
      <Letter position={ 1 } onSetLetter={ handleLetter } onBack={ handleBackspace } onSetResult={ handleResult } cursor={ cursor } />
      <Letter position={ 2 } onSetLetter={ handleLetter } onBack={ handleBackspace } onSetResult={ handleResult } cursor={ cursor } />
      <Letter position={ 3 } onSetLetter={ handleLetter } onBack={ handleBackspace } onSetResult={ handleResult } cursor={ cursor } />
      <Letter position={ 4 } onSetLetter={ handleLetter } onBack={ handleBackspace } onSetResult={ handleResult } cursor={ cursor } />
    </div>
  )
}

