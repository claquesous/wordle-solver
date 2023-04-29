import { useState } from 'react'
import styles from './GuessList.module.css'

export default function GuessList({guesses, outcomes = {}}) {
  const [collapsed, setCollapsed] = useState(true)

  function show() {
    setCollapsed(!collapsed)
  }

  return (<div onClick={ show } >
    <div>{guesses.length} possible solutions remain</div>
    <ul className={ collapsed ? styles.hide : '' }>
      {guesses.map(guess =>
        <li key={guess}>{guess}: {Object.hasOwn(outcomes,guess) ? outcomes[guess]?.length : 'unknown'}</li>
      )}
    </ul>
  </div>)
}

