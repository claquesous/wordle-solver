import { useState, useRef, useEffect } from 'react'

export default function Letter({ position, onSetLetter, cursor }) {
  const [value, setValue] = useState('')
  const [outcome, setOutcome] = useState(0)

  const cursorReference = useRef(null)

  useEffect(() => {
    if (position === cursor) {
      cursorReference.current.focus()
    }
  }, [cursor, position])

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

  function cycleOutcome() {
    setOutcome((outcome+1)%3)
  }

  return (
      <input type="text" maxLength="1" value={value}
        onChange={handlePress} onClick={cycleOutcome}
	ref={cursorReference}
	pattern="[a-z]"
      />
  )
}

