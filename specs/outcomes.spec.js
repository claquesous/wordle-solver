import { describe, it, expect } from 'vitest';

import { enumerateOutcomes } from '../outcomes';

describe('enumerateOutcomes', () => {
  it ('returns all outcomes when nothing is known', () => {
    let outcomes = enumerateOutcomes('aback', {known:[], misplaced: [[],[],[],[],[]], missing: [], counts: {}})
    expect(outcomes).toHaveLength(243)
  })

  it ('cuts outcomes in third when a letter is known', () => {
    let outcomes = enumerateOutcomes('aback', {known:['a'], misplaced: [[],[],[],[],[]], missing: [], counts: {a: 1}})
    expect(outcomes).toHaveLength(81)
  })

  it ('cuts missing letters', () => {
    let outcomes = enumerateOutcomes('aback', {known:[], misplaced: [[],[],[],[],[]], missing: ['b'], counts: {}})
    expect(outcomes).toHaveLength(81)
  })

  it ('cuts repeated missing letters', () => {
    let outcomes = enumerateOutcomes('aback', {known:[], misplaced: [[],[],[],[],[]], missing: ['a'], counts: {}})
    let knowns = outcomes.map(o => o.known ).flat()
    expect(knowns).not.toContain('a')
  })

  it ('cuts misplaced outcomes that are missing', () => {
    let outcomes = enumerateOutcomes('aback', {known:[], misplaced: [[],[],[],[],[]], missing: ['b'], counts: {}})
    let misplaceds = outcomes.map(o => o.misplaced[1] ).flat()
    expect(misplaceds).not.toContain('b')
  })

  it ('cuts outcomes that are not high enough count', () => {
    let outcomes = enumerateOutcomes('aback', {known:[], misplaced: [['a'],[],[],[],[]], missing: [], counts: {a: 1}})
    let counts = outcomes.map(o => o.counts.a )
    expect(Math.min(...counts)).toBe(1)
  })

  it ('cuts outcomes that have too high a count', () => {
    let outcomes = enumerateOutcomes('aback', {known:[], misplaced: [['a'],[],[],[],[]], missing: ['a'], counts: {a: 1}})
    let counts = outcomes.map(o => o.counts.a )
    expect(Math.max(...counts)).toBe(1)
  })

  it ('cuts outcomes that were missing but now have a count', () => {
    let outcomes = enumerateOutcomes('aback', {known:[], misplaced: [[],[],[],[],[]], missing: ['a'], counts: {}})
    let counts = outcomes.map(o => o.counts.a || 0 )
    expect(Math.max(...counts)).toBe(0)
  })

  it ('cuts outcomes that were misplaced but are now missing', () => {
    let outcomes = enumerateOutcomes('aback', {known:['a','b','a'], misplaced: [ [], [], [], [], ['c'] ], missing: [], counts: {a:2,b:1,c:1}})
    let allMissing = outcomes.map(o => o.missing).flat()
    expect(allMissing).not.toContain('c')
  })

})

