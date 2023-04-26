import { useState } from 'react'
import Letter from './Letter.js'

export default function Word() {
  const [cursor, setCursor] = useState(0)

  let guess = []

  function handleLetter(position, letter) {
    guess[position] = letter
    setCursor(position+1)
  }

  return (
    <div onKeyPress={handleLetter}>
      <Letter position={ 0 } onSetLetter={ handleLetter } cursor={ cursor } />
      <Letter position={ 1 } onSetLetter={ handleLetter } cursor={ cursor } />
      <Letter position={ 2 } onSetLetter={ handleLetter } cursor={ cursor } />
      <Letter position={ 3 } onSetLetter={ handleLetter } cursor={ cursor } />
      <Letter position={ 4 } onSetLetter={ handleLetter } cursor={ cursor } />
    </div>
  )
}

