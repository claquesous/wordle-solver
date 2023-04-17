import { describe, it, expect } from 'vitest';

import { enumerateOutcomes } from '../outcomes';

describe('enumerateOutcomes', () => {
  it ('returns all outcomes (except 4 known and one misplaced) when nothing is known', () => {
    let outcomes = enumerateOutcomes('abhor', {known:[], misplaced: [[],[],[],[],[]], missing: [], counts: {}})
    expect(outcomes).toHaveLength(238)
  })

  it ('cuts outcomes in about a third when a letter is known', () => {
    let outcomes = enumerateOutcomes('abhor', {known:['a'], misplaced: [[],[],[],[],[]], missing: [], counts: {a: 1}})
    expect(outcomes).toHaveLength(77)
  })

  it ('cuts missing letters', () => {
    let outcomes = enumerateOutcomes('abhor', {known:[], misplaced: [[],[],[],[],[]], missing: ['b'], counts: {}})
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

  it ('cuts outcomes with four known and one misplaced', () => {
    let outcomes = enumerateOutcomes('aback', {known:[], misplaced: [ [], [], [], [], [] ], missing: [], counts: {}})
    let counts = outcomes.map(o => (o.known.filter(x=>x).length===4 && o.misplaced.flat().length===1))
    expect(counts).not.toContain(true)
  })

  it ('cuts outcomes where a missing letter is later misplaced', () => {
    let outcomes = enumerateOutcomes('aback', {known:[], misplaced: [ [], [], [], [], [] ], missing: [], counts: {}})
    expect(outcomes).not.toContainEqual({known:[], misplaced: [ [], [], ['a'], [], [] ], missing: ['a','b','c','k'], counts: {a:1}})
  })

  it ('sets misplaced for a double letter with one count', () => {
    let outcomes = enumerateOutcomes('aback', {known:[], misplaced: [ [], [], [], [], [] ], missing: [], counts: {}})
    expect(outcomes).toContainEqual({known:[], misplaced: [ ['a'], [], ['a'], [], [] ], missing: ['a','b','c','k'], counts: {a:1}})
  })

  it ('does not set missing for a double letter with two count', () => {
    let outcomes = enumerateOutcomes('aback', {known:[], misplaced: [ [], [], [], [], [] ], missing: [], counts: {}})
    expect(outcomes).toContainEqual({known:[], misplaced: [ ['a'], [], ['a'], [], [] ], missing: ['b','c','k'], counts: {a:2}})
  })

  it ('returns limited outcomes for the only 2 letters word', () => {
    let outcomes = enumerateOutcomes('mamma', {known:[], misplaced: [[],[],[],[],[]], missing: [], counts: {}})
    expect(outcomes).toHaveLength(155)
  })

  it ('sets misplaced for a triple letter with two count', () => {
    let outcomes = enumerateOutcomes('mummy', {known:[], misplaced: [ [], [], [], [], [] ], missing: [], counts: {}})
    expect(outcomes).toContainEqual({known:[], misplaced: [ ['m'], [], ['m'], ['m'], [] ], missing: ['m','u','y'], counts: {m:2}})
  })

})

