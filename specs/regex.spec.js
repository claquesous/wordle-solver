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
    let answer = constructAnswersRegex({known:['m'], misplaced: [[],[],[],['m'],[]], missing: [], counts: {m: 2}})
    expect(answer).toBe("m..[^m].(?<=(m.*){2})")
  })

  it ('ensures exact counts when a letter is missing', () => {
    let answer = constructAnswersRegex({known:['e'], misplaced: [[],[],['e'],[],[]], missing: ['e'], counts: {e: 2}})
    expect(answer).toBe("e.[^e]..(?<=(e.*){2})(?<=([^e].*){3})")
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
    let answer = constructAnswersRegex({known:['a','l',null], misplaced: [[],[],[],[],['a']], missing: [], counts: {a: 2, l: 1 }})
    expect(answer).toBe("al..[^a](?<=(a.*){2})")
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

  it ('ignores missing when no valid answers would match', () => {
    let answer = constructAnswersRegex({known:[null,'i','g','h','t'], misplaced: [[],[],[],[],[]], missing: ['a','b','c','d','e','f'], counts: {i:1,g:1,h:1,t:1}})
    expect(answer).toBe(".ight(?<!([ef].*))")
  })

  it ('ignores count limitation when no valid answers would match', () => {
    let answer = constructAnswersRegex({known:[null,'i','g','h','t'], misplaced: [['h','i'],[],[],[],[]], missing: ['a','b','c','d','e','f','h','i'], counts: {i:1,g:1,h:1,t:1}})
    expect(answer).toBe(".ight(?<!([ef].*))")
  })

  it ('handles misplaced letters that are doubled up', () => {
    let answer = constructAnswersRegex({known:[null,'i','g','h','t'], misplaced: [['t'],[],[],[],[]], missing: [], counts: {i:1,g:1,h:1,t:1}})
    expect(answer).toBe("[^t]ight")
  })

  it ('ignores misplaced letters when no valid answers would match', () => {
    let answer = constructAnswersRegex({known:['a','b','a','c'], misplaced: [[],[],[],[],['a']], missing: [], counts: {a:2,b:1,c:1}})
    expect(answer).toBe("abac.")
  })

})

