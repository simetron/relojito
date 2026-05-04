import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

/**
 * Validates: Requirements 5
 * Parse tokens.css and assert that the set of token names under [data-theme="dark"]
 * is a superset of the token names under :root.
 */

function extractBlock(css: string, selector: string): string {
  const start = css.indexOf(selector)
  if (start === -1) return ''
  const braceOpen = css.indexOf('{', start)
  if (braceOpen === -1) return ''
  let depth = 0
  let i = braceOpen
  while (i < css.length) {
    if (css[i] === '{') depth++
    else if (css[i] === '}') {
      depth--
      if (depth === 0) return css.slice(braceOpen + 1, i)
    }
    i++
  }
  return ''
}

function extractTokenNames(block: string): string[] {
  const regex = /(--[\w-]+)\s*:/g
  const names: string[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(block)) !== null) {
    names.push(match[1])
  }
  return names
}

describe('tokens.css dark palette completeness', () => {
  it('every light-palette token is present in the dark-palette block', () => {
    const cssPath = path.resolve(process.cwd(), 'src/styles/tokens.css')
    const css = fs.readFileSync(cssPath, 'utf-8')

    const lightBlock = extractBlock(css, ':root')
    const darkBlock = extractBlock(css, '[data-theme="dark"]')

    expect(lightBlock).not.toBe('')
    expect(darkBlock).not.toBe('')

    const lightTokens = extractTokenNames(lightBlock)
    const darkTokens = new Set(extractTokenNames(darkBlock))

    expect(lightTokens.length).toBeGreaterThan(0)

    const missingFromDark = lightTokens.filter(token => !darkTokens.has(token))

    expect(
      missingFromDark,
      `The following tokens are defined in :root but missing from [data-theme="dark"]:\n  ${missingFromDark.join('\n  ')}`
    ).toEqual([])
  })
})
