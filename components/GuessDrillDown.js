import { useEffect, useState } from 'react'
import GuessList from './GuessList.js'
import Letter from './Letter.js'

export default function GuessDrillDown({ guess, count, outcomeKeys }) {
  const [expand, setExpand] = useState(false)
  const [hasExpanded, setHasExpanded] = useState(false)
  const [data, setData] = useState({})

  useEffect(() => {
    for (const outcome of outcomeKeys) {
      const file = outcome.substring( outcome.length -5 )
      fetch(`/solve/${file}.json`).then(res => res.json()).then(fetchedData => {
        data[outcome] = fetchedData[outcome]
        if (!!data[outcome]) {
          setData({...data})
        }
      }).catch(console.log)
    }
  }, [hasExpanded])

  function toggleExpand() {
    setExpand(!expand)
    setHasExpanded(true)
  }

  if (outcomeKeys.length === 0) {
    return <li>{guess}: not calculated</li>
  }

  function outcomeWord(key) {
    const outcome = data[key]
    if (!outcome) {
      return
    }
    let results = []
    let counts = {...outcome.counts}

    for (let i=0; i<5; i++) {
      if (outcome.known[i]===guess[i]) {
        results[i] = 2
        counts[guess[i]]--
      }
    }

    for (let i=0; i<5; i++) {
      if (outcome.known[i]!==guess[i] && !!counts[guess[i]]) {
        results[i] = 1
        counts[guess[i]]--
      }
    }

    return (<>
      <Letter letter={ guess[0] } outcome={ results[0] } finalized={true} />
      <Letter letter={ guess[1] } outcome={ results[1] } finalized={true} />
      <Letter letter={ guess[2] } outcome={ results[2] } finalized={true} />
      <Letter letter={ guess[3] } outcome={ results[3] } finalized={true} />
      <Letter letter={ guess[4] } outcome={ results[4] } finalized={true} />
    </>)
  }

  return <li><span onClick={ toggleExpand }>{guess}</span>:
    { expand ? (<ul>
      {outcomeKeys.map(outcome =>
        <li key={ outcome }> { outcomeWord(outcome) }
          <GuessList
            guesses={ Object.keys(data[outcome]?.guessOutcomes || {}) }
            outcome={ data[outcome] || {} }
            count={ count+1 }
          />
        </li>
      )}
    </ul>) : `${outcomeKeys.length} possible outcomes` }
  </li>
}
