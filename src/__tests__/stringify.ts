import { stripIndent } from '../utils/formatters'
import { expectResult } from '../utils/testing'

test('String representation of numbers are nice', () => {
  return expectResult(
    stripIndent`
  stringify(0);
  `,
    { native: true }
  ).toMatchInlineSnapshot(`"0"`)
})

test('String representation of strings are nice', () => {
  return expectResult(
    stripIndent`
  stringify('a string');
  `,
    { native: true }
  ).toMatchInlineSnapshot(`"\\"a string\\""`)
})

test('String representation of booleans are nice', () => {
  return expectResult(
    stripIndent`
  stringify('true');
  `,
    { native: true }
  ).toMatchInlineSnapshot(`"\\"true\\""`)
})

test('String representation of functions are nice', () => {
  return expectResult(
    stripIndent`
  function f(x, y) {
    return x;
  }
  stringify(f);
  `,
    { native: true }
  ).toMatchInlineSnapshot(`
            "function f(x, y) {
              return x;
            }"
          `)
})

test('String representation of arrow functions are nice', () => {
  return expectResult(
    stripIndent`
  const f = (x, y) => x;
  stringify(f);
  `,
    { native: true }
  ).toMatchInlineSnapshot(`"(x, y) => x"`)
})

test('String representation of arrays are nice', () => {
  return expectResult(
    stripIndent`
  const xs = [1, 'true', true, () => 1];
  stringify(xs);
  `,
    { chapter: 3, native: true }
  ).toMatchInlineSnapshot(`"[1, \\"true\\", true, () => 1]"`)
})

test('String representation of multidimensional arrays are nice', () => {
  return expectResult(
    stripIndent`
  const xs = [1, 'true', [true, () => 1, [[]]]];
  stringify(xs);
  `,
    { chapter: 3, native: true }
  ).toMatchInlineSnapshot(`"[1, \\"true\\", [true, () => 1, [[]]]]"`)
})

test('String representation of empty arrays are nice', () => {
  return expectResult(
    stripIndent`
  const xs = [];
  stringify(xs);
  `,
    { chapter: 3, native: true }
  ).toMatchInlineSnapshot(`"[]"`)
})

test('String representation of lists are nice', () => {
  return expectResult(
    stripIndent`
  stringify(enum_list(1, 10));
  `,
    { chapter: 2, native: true }
  ).toMatchInlineSnapshot(`
            "native:undefined
            interpreted:\\"[1, [2, [3, [4, [5, [6, [7, [8, [9, [10, null]]]]]]]]]]\\""
          `)
})

// The interpreter runs into a MaximumStackLimitExceeded error on 1000, so reduced it to 100.
// tslint:disable:max-line-length
test('String representation of huge lists are nice', () => {
  return expectResult(
    stripIndent`
  stringify(enum_list(1, 100));
  `,
    { chapter: 2, native: true }
  ).toMatchInlineSnapshot(`
            "native:undefined
            interpreted:\\"[ 1,\\\\n[ 2,\\\\n[ 3,\\\\n[ 4,\\\\n[ 5,\\\\n[ 6,\\\\n[ 7,\\\\n[ 8,\\\\n[ 9,\\\\n[ 10,\\\\n[ 11,\\\\n[ 12,\\\\n[ 13,\\\\n[ 14,\\\\n[ 15,\\\\n[ 16,\\\\n[ 17,\\\\n[ 18,\\\\n[ 19,\\\\n[ 20,\\\\n[ 21,\\\\n[ 22,\\\\n[ 23,\\\\n[ 24,\\\\n[ 25,\\\\n[ 26,\\\\n[ 27,\\\\n[ 28,\\\\n[ 29,\\\\n[ 30,\\\\n[ 31,\\\\n[ 32,\\\\n[ 33,\\\\n[ 34,\\\\n[ 35,\\\\n[ 36,\\\\n[ 37,\\\\n[ 38,\\\\n[ 39,\\\\n[ 40,\\\\n[ 41,\\\\n[ 42,\\\\n[ 43,\\\\n[ 44,\\\\n[ 45,\\\\n[ 46,\\\\n[ 47,\\\\n[ 48,\\\\n[ 49,\\\\n[ 50,\\\\n[ 51,\\\\n[ 52,\\\\n[ 53,\\\\n[ 54,\\\\n[ 55,\\\\n[ 56,\\\\n[ 57,\\\\n[ 58,\\\\n[ 59,\\\\n[ 60,\\\\n[ 61,\\\\n[ 62,\\\\n[ 63,\\\\n[ 64,\\\\n[ 65,\\\\n[ 66,\\\\n[ 67,\\\\n[ 68,\\\\n[ 69,\\\\n[ 70,\\\\n[ 71,\\\\n[ 72,\\\\n[ 73,\\\\n[ 74,\\\\n[ 75,\\\\n[ 76,\\\\n[ 77,\\\\n[ 78,\\\\n[ 79,\\\\n[ 80,\\\\n[ 81,\\\\n[ 82,\\\\n[ 83,\\\\n[ 84,\\\\n[ 85,\\\\n[ 86,\\\\n[ 87,\\\\n[ 88,\\\\n[89, [90, [91, [92, [93, [94, [95, [96, [97, [98, [99, [100, null]]]]]]]]]]]] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ] ]\\""
          `)
})
// tslint:enable:max-line-length

test('String representation of huge arrays are nice', () => {
  return expectResult(
    stripIndent`
  const arr = [];
  for (let i = 0; i < 100; i = i + 1) {
    arr[i] = i;
  }
  stringify(arr);
  `,
    { chapter: 3, native: true }
  ).toMatchInlineSnapshot(`
            "[ 0,
              1,
              2,
              3,
              4,
              5,
              6,
              7,
              8,
              9,
              10,
              11,
              12,
              13,
              14,
              15,
              16,
              17,
              18,
              19,
              20,
              21,
              22,
              23,
              24,
              25,
              26,
              27,
              28,
              29,
              30,
              31,
              32,
              33,
              34,
              35,
              36,
              37,
              38,
              39,
              40,
              41,
              42,
              43,
              44,
              45,
              46,
              47,
              48,
              49,
              50,
              51,
              52,
              53,
              54,
              55,
              56,
              57,
              58,
              59,
              60,
              61,
              62,
              63,
              64,
              65,
              66,
              67,
              68,
              69,
              70,
              71,
              72,
              73,
              74,
              75,
              76,
              77,
              78,
              79,
              80,
              81,
              82,
              83,
              84,
              85,
              86,
              87,
              88,
              89,
              90,
              91,
              92,
              93,
              94,
              95,
              96,
              97,
              98,
              99 ]"
          `)
})

test('String representation of objects are nice', () => {
  return expectResult(
    stripIndent`
  const o = { a: 1, b: true, c: () => 1 };
  stringify(o);
  `,
    { chapter: 100, native: true }
  ).toMatchInlineSnapshot(`"{\\"a\\": 1, \\"b\\": true, \\"c\\": () => 1}"`)
})

test('String representation of nested objects are nice', () => {
  return expectResult(
    stripIndent`
  const o = { a: 1, b: true, c: () => 1, d: { e: 5, f: 6 } };
  stringify(o);
  `,
    { chapter: 100, native: true }
  ).toMatchInlineSnapshot(
    `"{\\"a\\": 1, \\"b\\": true, \\"c\\": () => 1, \\"d\\": {\\"e\\": 5, \\"f\\": 6}}"`
  )
})

test('String representation of big objects are nice', () => {
  return expectResult(
    stripIndent`
  const o = { a: 1, b: true, c: () => 1, d: { e: 5, f: 6 }, g: 0, h: 0, i: 0, j: 0, k: 0, l: 0, m: 0, n: 0};
  stringify(o);
  `,
    { chapter: 100, native: true }
  ).toMatchInlineSnapshot(`
            "{ \\"a\\": 1,
              \\"b\\": true,
              \\"c\\": () => 1,
              \\"d\\": {\\"e\\": 5, \\"f\\": 6},
              \\"g\\": 0,
              \\"h\\": 0,
              \\"i\\": 0,
              \\"j\\": 0,
              \\"k\\": 0,
              \\"l\\": 0,
              \\"m\\": 0,
              \\"n\\": 0 }"
          `)
})

test('String representation of nested objects are nice', () => {
  return expectResult(
    stripIndent`
  let o = {};
  o.o = o;
  stringify(o);
  `,
    { chapter: 100, native: true }
  ).toMatchInlineSnapshot(`"{\\"o\\": ...<circular>}"`)
})

test('String representation of builtins are nice', () => {
  return expectResult(
    stripIndent`
  stringify(pair);
  `,
    { chapter: 2, native: true }
  ).toMatchInlineSnapshot(`
            "function pair(left, right) {
            	[implementation hidden]
            }"
          `)
})

test('String representation of null is nice', () => {
  return expectResult(
    stripIndent`
  stringify(null);
  `,
    { chapter: 2, native: true }
  ).toMatchInlineSnapshot(`"null"`)
})

test('String representation of undefined is nice', () => {
  return expectResult(
    stripIndent`
  stringify(undefined);
  `,
    { native: true }
  ).toMatchInlineSnapshot(`"undefined"`)
})

// tslint:disable:max-line-length
test('String representation with no indent', () => {
  return expectResult(
    stripIndent`
  stringify(parse('x=>x;'), 0);
  `,
    { chapter: 4, native: true }
  ).toMatchInlineSnapshot(
    `"[\\"function_definition\\", [[[\\"name\\", [\\"x\\", null]], null], [[\\"return_statement\\", [[\\"name\\", [\\"x\\", null]], null]], null]]]"`
  )
})

test('String representation with 1 space indent', () => {
  return expectResult(
    stripIndent`
  stringify(parse('x=>x;'), 1);
  `,
    { chapter: 4, native: true }
  ).toMatchInlineSnapshot(`
            "[\\"function_definition\\",
            [[[\\"name\\", [\\"x\\", null]], null],
            [[\\"return_statement\\", [[\\"name\\", [\\"x\\", null]], null]], null]]]"
          `)
})

test('String representation with default (2 space) indent', () => {
  return expectResult(
    stripIndent`
  stringify(parse('x=>x;'));
  `,
    { chapter: 4, native: true }
  ).toMatchInlineSnapshot(`
            "[ \\"function_definition\\",
            [ [[\\"name\\", [\\"x\\", null]], null],
            [[\\"return_statement\\", [[\\"name\\", [\\"x\\", null]], null]], null] ] ]"
          `)
})

test('String representation with more than 10 space indent should trim to 10 space indent', () => {
  return expectResult(
    stripIndent`
  stringify(parse('x=>x;'), 100);
  `,
    { chapter: 4, native: true }
  ).toMatchInlineSnapshot(`
            "[         \\"function_definition\\",
            [         [[\\"name\\", [\\"x\\", null]], null],
            [[\\"return_statement\\", [[\\"name\\", [\\"x\\", null]], null]], null]         ]         ]"
          `)
})

test('String representation with custom indent', () => {
  return expectResult(
    stripIndent`
  stringify(parse('x=>x;'), ' ... ');
  `,
    { chapter: 4, native: true }
  ).toMatchInlineSnapshot(`
            "[... \\"function_definition\\",
            [... [[\\"name\\", [\\"x\\", null]], null],
            [[\\"return_statement\\", [[\\"name\\", [\\"x\\", null]], null]], null] ...] ...]"
          `)
})

test('String representation with long custom indent gets trimmed to 10 characters', () => {
  return expectResult(
    stripIndent`
  stringify(parse('x=>x;'), '.................................');
  `,
    { chapter: 4, native: true }
  ).toMatchInlineSnapshot(`
            "[.........\\"function_definition\\",
            [.........[[\\"name\\", [\\"x\\", null]], null],
            [[\\"return_statement\\", [[\\"name\\", [\\"x\\", null]], null]], null].........].........]"
          `)
})
// tslint:enable:max-line-length
