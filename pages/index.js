import { useState } from 'react'
import Word from '../components/Word.js'

function HomePage() {
  const [attempt, setAttempt] = useState(0)

  function handleAttempt(outcome) {
    setAttempt(attempt+1)
  }

  return <div>
    <Word guess={ 0 } attempt={attempt} onSubmit={ handleAttempt } />
    <Word guess={ 1 } attempt={attempt} onSubmit={ handleAttempt } />
    <Word guess={ 2 } attempt={attempt} onSubmit={ handleAttempt } />
    <Word guess={ 3 } attempt={attempt} onSubmit={ handleAttempt } />
    <Word guess={ 4 } attempt={attempt} onSubmit={ handleAttempt } />
    <Word guess={ 5 } attempt={attempt} onSubmit={ handleAttempt } />
  </div>
}

export default HomePage

