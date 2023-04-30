import { useState } from 'react'
import styles from './GuessList.module.css'
import GuessDrillDown from './GuessDrillDown.js'

export default function GuessList({guesses, count, outcomes = {}}) {
  const [collapsed, setCollapsed] = useState(true)

  function show() {
    setCollapsed(!collapsed)
  }

  return (<div>
    <div onClick={ show }>{`${6-count} guess${count!==5 ? 'es' : ''} remaining and `}{ guesses.length ? guesses.length : 'unknown' } possible solutions remain</div>
    <div className={ collapsed ? styles.hide : '' }>
      <div>{ outcomes.validAnswersRegex }</div>
      <ul>
        {guesses.map(guess =>
          <GuessDrillDown key={ guess } guess={ guess }
            count={ count }
            outcomes={ outcomes[guess] } />
        )}
      </ul>
    </div>
  </div>)
}

