import { stripIndent } from '../../utils/formatters'
import { expectParsedError } from '../../utils/testing'

test('Blatant syntax error', () => {
  return expectParsedError(
    stripIndent`
    stringify(parse("'"), undefined, 2);
  `,
    { chapter: 4 }
  ).toMatchInlineSnapshot(`"Line 1: Name parse not declared."`)
})

test('Blacklisted syntax', () => {
  return expectParsedError(
    stripIndent`
    stringify(parse("function* f() { yield 1; } f();"), undefined, 2);
  `,
    { chapter: 4 }
  ).toMatchInlineSnapshot(`"Line 1: Name parse not declared."`)
})

test('Syntax rules', () => {
  return expectParsedError(
    stripIndent`
    stringify(parse("x = y = x;"), undefined, 2);
  `,
    { chapter: 4 }
  ).toMatchInlineSnapshot(`"Line 1: Name parse not declared."`)
})
