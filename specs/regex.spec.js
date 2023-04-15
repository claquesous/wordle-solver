import { vi, describe, it, expect } from 'vitest'
import { constructAnswersRegex } from '../regex.js'

vi.mock('../cache.js', () => { return {}; } )

describe('constructAnswersRegex', () => {
  it ('handles default', () => {
    let answer = constructAnswersRegex({known:[], misplaced: [[],[],[],[],[]], missing: [], counts: {}})
    expect(answer).toBe(".....")
  })

  it ('handles known letters', () => {
    let answer = constructAnswersRegex({known:['a'], misplaced: [[],[],[],[],[]], missing: [], counts: {}})
    expect(answer).toBe("a....")
  })

  it ('handles sparse known letters', () => {
    let answer = constructAnswersRegex({known:[null,'a'], misplaced: [[],[],[],[],[]], missing: [], counts: {}})
    expect(answer).toBe(".a...")
  })

  it ('handles misplaced letters', () => {
    let answer = constructAnswersRegex({known:[], misplaced: [['a'],[],[],[],[]], missing: [], counts: {}})
    expect(answer).toBe("[^a]....")
  })

  it ('sorts misplaced letters', () => {
    let answer = constructAnswersRegex({known:[], misplaced: [['b', 'a'],[],[],[],[]], missing: [], counts: {}})
    expect(answer).toBe("[^ab]....")
  })

  it ('ignores misplaced letters if all accounted for', () => {
    let answer = constructAnswersRegex({known:['a'], misplaced: [[],['a'],[],['a'],[]], missing: ['a'], counts: {a: 1}})
    expect(answer).toBe("a....(?<=([^a].*){4})")
  })

  it ('handles missing letters', () => {
    let answer = constructAnswersRegex({known:[], misplaced: [[],[],[],[],[]], missing: ['a'], counts: {}})
    expect(answer).toBe(".....(?<!([a].*))")
  })
  
  it ('sorts missing letters', () => {
    let answer = constructAnswersRegex({known:[], misplaced: [[],[],[],[],[]], missing: ['b', 'a'], counts: {}})
    expect(answer).toBe(".....(?<!([ab].*))")
  })

  it ('ensures minimum counts when no letters known', () => {
    let answer = constructAnswersRegex({known:[], misplaced: [[],['a'],[],[],[]], missing: [], counts: {a: 1}})
    expect(answer).toBe(".[^a]...(?<=(a.*){1})")
  })

  it ('ensures minimum counts when a letter is known', () => {
    let answer = constructAnswersRegex({known:['a'], misplaced: [[],['a'],[],[],[]], missing: [], counts: {a: 2}})
    expect(answer).toBe("a[^a]...(?<=(a.*){2})")
  })

  it ('ensures exact counts when a letter is missing', () => {
    let answer = constructAnswersRegex({known:['a'], misplaced: [[],['a'],[],[],[]], missing: ['a'], counts: {a: 2}})
    expect(answer).toBe("a[^a]...(?<=(a.*){2})(?<=([^a].*){3})")
  })

  it ('ignores missing if all letters known', () => {
    let answer = constructAnswersRegex({known:['a','b','a','c','k'], misplaced: [[],[],[],[],[]], missing: ['d', 'e'], counts: {}})
    expect(answer).toBe("aback")
  })

  it ('ignores misplaced letters if all letters known', () => {
    let answer = constructAnswersRegex({known:['a',null,'a','c'], misplaced: [['k'],[],[],[],[]], missing: [], counts: {a: 2, b: 1, c: 1, k:1 }})
    expect(answer).toBe("a.ac.(?<=(b.*){1})(?<=(k.*){1})")
  })

  it ('places misplaced letters if no other option exists', () => {
    let answer = constructAnswersRegex({known:['a',null,'a','c'], misplaced: [[],[],[],[],['b']], missing: [], counts: {a: 2, b: 1, c: 1 }})
    expect(answer).toBe("abac.")
  })

  it ('does not place misplaced letters when options exists', () => {
    let answer = constructAnswersRegex({known:['a',null,null,'c'], misplaced: [[],[],[],[],['a']], missing: [], counts: {a: 2, c: 1 }})
    expect(answer).toBe("a..c[^a](?<=(a.*){2})")
  })

  it ('ignores misplaced letters if all accounted for', () => {
    let answer = constructAnswersRegex({known:['a',null,'a','c'], misplaced: [['k'],[],[],[],['b']], missing: ['d', 'e'], counts: {a: 2, b: 1, c: 1, k:1 }})
    expect(answer).toBe("aback")
  })

  it ('ignores missing if all letters known', () => {
    let answer = constructAnswersRegex({known:['a','b','a','c','k'], misplaced: [[],[],[],[],[]], missing: ['d', 'e'], counts: {}})
    expect(answer).toBe("aback")
  })

  it ('ignores missing when counts are known', () => {
    let answer = constructAnswersRegex({known:['a'], misplaced: [[],[],[],[],[]], missing: ['a'], counts: {a: 1}})
    expect(answer).toBe("a....(?<=([^a].*){4})")
  })

})

