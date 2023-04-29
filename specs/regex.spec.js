import { describe, it, expect } from 'vitest'
import { constructAnswersRegex } from '../regex.js'
import { answers } from '../answers.js'

describe('constructAnswersRegex', () => {
  it ('handles default', () => {
    let answer = constructAnswersRegex({known:[], misplaced: [[],[],[],[],[]], missing: [], counts: {}}, answers)
    expect(answer).toBe(".....")
  })

  it ('handles known letters', () => {
    let answer = constructAnswersRegex({known:['a'], misplaced: [[],[],[],[],[]], missing: [], counts: {}}, answers)
    expect(answer).toBe("a....")
  })

  it ('handles sparse known letters', () => {
    let answer = constructAnswersRegex({known:[null,'a'], misplaced: [[],[],[],[],[]], missing: [], counts: {}}, answers)
    expect(answer).toBe(".a...")
  })

  it ('handles misplaced letters', () => {
    let answer = constructAnswersRegex({known:[], misplaced: [['a'],[],[],[],[]], missing: [], counts: {}}, answers)
    expect(answer).toBe("[^a]....")
  })

  it ('sorts misplaced letters', () => {
    let answer = constructAnswersRegex({known:[], misplaced: [['b', 'a'],[],[],[],[]], missing: [], counts: {}}, answers)
    expect(answer).toBe("[^ab]....")
  })

  it ('retains and extends misplaced letters if all accounted for', () => {
    let answer = constructAnswersRegex({known:['a'], misplaced: [[],['a'],[],['a'],[]], missing: ['a'], counts: {a: 1}}, answers)
    expect(answer).toBe("a.[^a][^a][^a]")
  })

  it ('handles missing letters', () => {
    let answer = constructAnswersRegex({known:[], misplaced: [[],[],[],[],[]], missing: ['a'], counts: {}}, answers)
    expect(answer).toBe(".....(?<!([a].*))")
  })
  
  it ('sorts missing letters', () => {
    let answer = constructAnswersRegex({known:[], misplaced: [[],[],[],[],[]], missing: ['b', 'a'], counts: {}}, answers)
    expect(answer).toBe(".....(?<!([ab].*))")
  })

  it ('ensures minimum counts when no letters known', () => {
    let answer = constructAnswersRegex({known:[], misplaced: [[],['a'],[],[],[]], missing: [], counts: {a: 1}}, answers)
    expect(answer).toBe(".[^a]...(?<=(a.*){1})")
  })

  it ('ensures minimum counts when a letter is known', () => {
    let answer = constructAnswersRegex({known:['m'], misplaced: [[],[],[],['m'],[]], missing: [], counts: {m: 2}}, answers)
    expect(answer).toBe("m..[^m].(?<=(m.*){2})")
  })

  it ('ensures exact counts when a letter is missing', () => {
    let answer = constructAnswersRegex({known:['e'], misplaced: [[],[],['e'],[],[]], missing: ['e'], counts: {e: 2}}, answers)
    expect(answer).toBe("e.[^e]..(?<=(e.*){2})(?<=([^e].*){3})")
  })

  it ('ignores missing if all letters known', () => {
    let answer = constructAnswersRegex({known:['a','b','a','c','k'], misplaced: [[],[],[],[],[]], missing: ['d', 'e'], counts: {}}, answers)
    expect(answer).toBe("aback")
  })

  it ('ignores misplaced letters if all letters known', () => {
    let answer = constructAnswersRegex({known:['a',null,'a','c'], misplaced: [['k'],[],[],[],[]], missing: [], counts: {a: 2, b: 1, c: 1, k:1 }}, answers)
    expect(answer).toBe("a.ac.(?<=(b.*){1})(?<=(k.*){1})")
  })

  it ('places misplaced letters if no other option exists', () => {
    let answer = constructAnswersRegex({known:['a',null,'a','c'], misplaced: [[],[],[],[],['b']], missing: [], counts: {a: 2, b: 1, c: 1 }}, answers)
    expect(answer).toBe("abac.")
  })

  it ('does not place misplaced letters when options exists', () => {
    let answer = constructAnswersRegex({known:['a','l',null], misplaced: [[],[],[],[],['a']], missing: [], counts: {a: 2, l: 1 }}, answers)
    expect(answer).toBe("al..[^a](?<=(a.*){2})")
  })

  it ('ignores misplaced letters if all accounted for', () => {
    let answer = constructAnswersRegex({known:['a',null,'a','c'], misplaced: [['k'],[],[],[],['b']], missing: ['d', 'e'], counts: {a: 2, b: 1, c: 1, k:1 }}, answers)
    expect(answer).toBe("aback")
  })

  it ('ignores missing if all letters known', () => {
    let answer = constructAnswersRegex({known:['a','b','a','c','k'], misplaced: [[],[],[],[],[]], missing: ['d', 'e'], counts: {}}, answers)
    expect(answer).toBe("aback")
  })

  it ('leaves off missing matcher when counts are known', () => {
    let answer = constructAnswersRegex({known:['a'], misplaced: [[],[],[],[],[]], missing: ['a'], counts: {a: 1}}, answers)
    expect(answer).toBe("a.[^a][^a][^a]")
  })

  it ('ignores missing when no valid answers would match', () => {
    let answer = constructAnswersRegex({known:[null,'i','g','h','t'], misplaced: [[],[],[],[],[]], missing: ['a','b','c','d','e','f'], counts: {i:1,g:1,h:1,t:1}}, answers)
    expect(answer).toBe(".ight(?<!([ef].*))")
  })

  it ('ignores count limitation when no valid answers would match', () => {
    let answer = constructAnswersRegex({known:[null,'i','g','h','t'], misplaced: [['h','i'],[],[],[],[]], missing: ['a','b','c','d','e','f','h','i'], counts: {i:1,g:1,h:1,t:1}}, answers)
    expect(answer).toBe(".ight(?<!([ef].*))")
  })

  it ('handles misplaced letters that are doubled up', () => {
    let answer = constructAnswersRegex({known:[null,'i','g','h','t'], misplaced: [['t'],[],[],[],[]], missing: [], counts: {i:1,g:1,h:1,t:1}}, answers)
    expect(answer).toBe("[^t]ight")
  })

  it ('ignores misplaced letters when no valid answers would match', () => {
    let answer = constructAnswersRegex({known:['a','b','a','c'], misplaced: [[],[],[],[],['a']], missing: [], counts: {a:2,b:1,c:1}}, answers)
    expect(answer).toBe("abac.")
  })

  it ('still excludes letters that have been placed from former position', () => {
    let answer = constructAnswersRegex({known:[null,'o','o',null,'h'], misplaced: [[],[],[],['t'],[]], missing: ['c','p','s'], counts: {o:2,t:1,h:1}}, answers)
    expect(answer).toBe("too[^t]h")
  })

  it ('collapses fully accounted letters into misplaced', () => {
    let first = constructAnswersRegex({known:[null,'o','o','t','h'], misplaced: [['t'],[],[],[],[]], missing: [], counts: {o:2,t:1,h:1}}, answers)
    let second = constructAnswersRegex({known:[null,'o','o','t','h'], misplaced: [[],[],[],[],[]], missing: ['t'], counts: {o:2,t:1,h:1}}, answers)
    expect(first).toBe(second)
  })

  it ('modifies the outcome when collapsing missing into misplaced', () => {
    let outcome = {known:[null,'o','o','t','h'], misplaced: [[],[],[],[],[]], missing: ['t'], counts: {o:2,t:1,h:1}}
    let second = constructAnswersRegex(outcome, answers)
    expect(outcome).toEqual({known:[null,'o','o','t','h'], misplaced: [['t'],[],[],[],[]], missing: [], counts: {o:2,t:1,h:1}})
  })

})

