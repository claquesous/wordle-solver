import { useState, useEffect } from 'react'
import Letter from './Letter.js'

export default function Word({ active, onSubmit }) {
  const [cursor, setCursor] = useState(null)
  const [word, setWord] = useState([])
  const [finalized, setFinalized] = useState(false)
  const [outcome, setOutcome] = useState({
    known: [],
    misplaced: [[], [], [], [], []],
    missing: [],
    counts: {},
  })

  useEffect(() => {
    if (active) {
      setCursor(0)
    }
  }, [active])

  function handleLetter(letter) {
    word[cursor] = letter
    outcome.missing.push(letter)
    setOutcome(outcome)
    setWord(word)
    if (cursor !==4) {
      setCursor(cursor+1)
    }
  }

  function handleBackspace(letter) {
    if (cursor===0) {
      return
    }
    const newPosition = !letter ? cursor -1 : cursor
    const deletedLetter = word[newPosition]
    delete word[newPosition]
    if (outcome.known[newPosition]===deletedLetter) {
      delete outcome.known[newPosition]
      outcome.counts[deletedLetter]--
      if (outcome.counts[deletedLetter]===0) {
        delete outcome.counts[deletedLetter]
      }
    }
    else if (outcome.misplaced[newPosition].includes(deletedLetter)) {
      outcome.misplaced[newPosition].splice(outcome.misplaced[newPosition].indexOf(deletedLetter),1)
      outcome.counts[deletedLetter]--
      if (outcome.counts[deletedLetter]===0) {
        delete outcome.counts[deletedLetter]
      }
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
        if (outcome.counts[letter] === 0) {
          delete outcome.counts[letter]
        }
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
        setFinalized(true)
        onSubmit(outcome)
      }
    }
  }

  const letterProps = {
        onSetLetter: handleLetter,
        onBack: handleBackspace,
        onSetResult: handleResult,
        cursor,
        finalized,
  }

  return (
    <div onKeyDown={ handleKeyDown }>
      <Letter position={ 0 } current= { cursor===0 } { ...letterProps } />
      <Letter position={ 1 } current= { cursor===1 } { ...letterProps } />
      <Letter position={ 2 } current= { cursor===2 } { ...letterProps } />
      <Letter position={ 3 } current= { cursor===3 } { ...letterProps } />
      <Letter position={ 4 } current= { cursor===4 } { ...letterProps } />
    </div>
  )
}

