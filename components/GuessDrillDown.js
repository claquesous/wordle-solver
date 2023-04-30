import { useEffect, useState } from 'react'
import GuessList from './GuessList.js'

export default function GuessDrillDown({guess, count, outcomes = []}) {
  const [expand, setExpand] = useState(false)
  const [data, setData] = useState({})

  useEffect(() => {
    for (const outcome of outcomes) {
      if (outcome?.length === 40) {
        const file = outcome.substring( outcome.length -5 )
        fetch(`/solve/${file}.json`).then(res => res.json()).then(fetchedData => {
          data[outcome] = fetchedData[outcome]
          if (!data[outcome])
            console.log('found', outcome)
          setData({...data})
        }).catch(console.log)
      } else {
        // Not clear what causes this
        debugger
      }
    }
  }, [expand])

  function toggleExpand() {
    setExpand(!expand)
  }

  if (outcomes.length === 0) {
    return <li>{guess}: not calculated</li>
  }

  return <li><span onClick={ toggleExpand }>{guess}</span>: 
    { expand ? (<ul>
      {outcomes.map(outcome =>
        <li key={ outcome }>{ outcome }
          <GuessList 
            guesses={ Object.keys(data[outcome]?.guessOutcomes || {}) }
            outcomes={ data[outcome] }
            count={count+1}
          />
        </li>
      )}
    </ul>) : `${outcomes.length} possible outcomes` }
  </li>
}

