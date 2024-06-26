import { useEffect, useState } from 'react'
import Guesses from './Guesses.js'
import Letter from './Letter.js'

export default function Outcomes({ guess, count, outcomeKeys, root }) {
  const [expand, setExpand] = useState(false)
  const [hasExpanded, setHasExpanded] = useState(false)
  const [data, setData] = useState({})

  useEffect(() => {
    if (!hasExpanded) {
      return
    }
    for (const outcome of outcomeKeys) {
      fetch(`/api/node/${outcome}`).then(res => res.json()).then(fetchedData => {
        data[outcome] = fetchedData
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

  if (!outcomeKeys) {
    console.error(root)
  }

  if (outcomeKeys.length === 0) {
    return <>{guess}: not calculated</>
  }

  function outcomeWord(key) {
    const outcome = data[key]
    if (!outcome || Object.keys(outcome).length === 0) {
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
      <Letter letter={ guess[0] } outcome={ results[0] } finalized={true} small={true} />
      <Letter letter={ guess[1] } outcome={ results[1] } finalized={true} small={true} />
      <Letter letter={ guess[2] } outcome={ results[2] } finalized={true} small={true} />
      <Letter letter={ guess[3] } outcome={ results[3] } finalized={true} small={true} />
      <Letter letter={ guess[4] } outcome={ results[4] } finalized={true} small={true} />
    </>)
  }

  return <><span onClick={ toggleExpand }>{guess} </span>
    <span className={`collapsible ${expand ? 'opened' : ''}`} />
    { hasExpanded ? (<ul className={!expand ? 'hide' : '' }>
      {outcomeKeys.map(outcome =>
        <li key={ outcome }> { outcomeWord(outcome) }
        {data[outcome]?.validAnswersRegex === guess ?
          count <6 ? ' ✓' : ' ✗' :
          <Guesses
            guesses={ Object.keys(data[outcome]?.guessOutcomes || {}) }
            outcome={ data[outcome] || {} }
            count={ count+1 }
          />
        }
        </li>
      )}
    </ul>) : ''}
    <span className={expand ? 'hide' : ''}>{outcomeKeys.length} possible outcomes</span>
  </>
}

