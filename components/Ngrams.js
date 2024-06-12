import { applyRegex } from '../regex'

export default function (props) {
  const { answerList, maxSize } = props

  const tritree = {}

  for (let i=0; i<5; i++){
    let matchSet = new Set()
    answerList.forEach(w => {
      const key = w.substring(0,i) + "." + w.substring(i+1)
      if (!matchSet.has(key)) {
        matchSet.add(key)
        const matches = applyRegex(key, answerList)
        if (matches.length >= maxSize) {
          tritree[key] = matches
        }
      }
    })
  }

  return <div className="ngrams">
    {Object.keys(tritree).map(key => (
      <div key={key}>
        <p>{key}: {tritree[key].join(", ")}</p>
      </div>
    ))}
  </div>
}

