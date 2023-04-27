import { useState, useRef, useEffect } from 'react'
import styles from './Letter.module.css'

export default function Letter({ position, onSetLetter, onSetResult, cursor }) {
  const [value, setValue] = useState('')
  const [result, setResult] = useState(0)

  const cursorReference = useRef(null)
  let currentStyle
  switch(result) {
    case 0:
      currentStyle = styles.missing
      break
    case 1:
      currentStyle = styles.misplaced
      break
    case 2:
      currentStyle = styles.known
      break
  }

  useEffect(() => {
    if (position === cursor) {
      cursorReference.current.focus()
    }
  }, [cursor])

  function handlePress({ nativeEvent }) {
    const key = nativeEvent.data
    if (key?.match(/[a-zA-Z]/)) {
      setValue(key.toUpperCase())
      onSetLetter(position, key.toLowerCase())
    }
    else {
      setValue(value)
    }
  }

  function cycleResult() {
    if (!!value) {
      const newResult = (result+1)%3
      setResult(newResult)
      onSetResult(newResult, value.toLowerCase(), position)
    }
  }

  return (
      <input className={currentStyle}
        type="text"
        maxLength="1"
        value={value}
        onChange={handlePress}
        onClick={cycleResult}
        ref={cursorReference}
      />
  )
}

