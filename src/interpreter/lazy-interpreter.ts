/* tslint:disable:max-classes-per-file */
import * as es from 'estree'
import * as constants from '../constants'
import * as errors from '../errors/errors'
import { RuntimeSourceError } from '../errors/runtimeSourceError'
import { checkEditorBreakpoints } from '../stdlib/inspector'
import { Context, Environment, Frame, Value } from '../types'
import { primitive } from '../utils/astCreator'
import { evaluateBinaryExpression, evaluateUnaryExpression } from '../utils/operators'
import * as rttc from '../utils/rttc'
import Closure from './closure'
import Thunk from './Thunk'

class ReturnValue {
  constructor(public value: Value) {}
}

class TailCallReturnValue {
  constructor(public callee: Closure, public args: Value[], public node: es.CallExpression) {}
}

const createEnvironment = (
  closure: Closure,
  args: Value[],
  callExpression?: es.CallExpression
): Environment => {
  const environment: Environment = {
    name: closure.functionName, // TODO: Change this
    tail: closure.environment,
    head: {}
  }
  if (callExpression) {
    environment.callExpression = {
      ...callExpression,
      arguments: args.map(primitive)
    }
  }
  closure.node.params.forEach((param, index) => {
    const ident = param as es.Identifier
    environment.head[ident.name] = args[index]
  })
  return environment
}

const createBlockEnvironment = (
  context: Context,
  name = 'blockEnvironment',
  head: Frame = {}
): Environment => {
  return {
    name,
    tail: currentEnvironment(context),
    head,
    thisContext: context
  }
}

const handleRuntimeError = (context: Context, error: RuntimeSourceError): never => {
  context.errors.push(error)
  context.runtime.environments = context.runtime.environments.slice(
    -context.numberOfOuterEnvironments
  )
  throw error
}

const HOISTED_BUT_NOT_YET_ASSIGNED = Symbol('Used to implement hoisting')

function hoistIdentifier(context: Context, name: string, node: es.Node) {
  const environment = currentEnvironment(context)
  if (environment.head.hasOwnProperty(name)) {
    const descriptors = Object.getOwnPropertyDescriptors(environment.head)

    return handleRuntimeError(
      context,
      new errors.VariableRedeclaration(node, name, descriptors[name].writable)
    )
  }
  environment.head[name] = HOISTED_BUT_NOT_YET_ASSIGNED
  return environment
}

function hoistVariableDeclarations(context: Context, node: es.VariableDeclaration) {
  for (const declaration of node.declarations) {
    hoistIdentifier(context, (declaration.id as es.Identifier).name, node)
  }
}

function hoistFunctionsAndVariableDeclarationsIdentifiers(
  context: Context,
  node: es.BlockStatement
) {
  for (const statement of node.body) {
    switch (statement.type) {
      case 'VariableDeclaration':
        hoistVariableDeclarations(context, statement)
        break
      case 'FunctionDeclaration':
        hoistIdentifier(context, (statement.id as es.Identifier).name, statement)
        break
    }
  }
}

function defineVariable(context: Context, name: string, value: Value, constant = false) {
  const environment = context.runtime.environments[0]

  if (environment.head[name] !== HOISTED_BUT_NOT_YET_ASSIGNED) {
    return handleRuntimeError(
      context,
      new errors.VariableRedeclaration(context.runtime.nodes[0]!, name, !constant)
    )
  }

  Object.defineProperty(environment.head, name, {
    value,
    writable: !constant,
    enumerable: true
  })

  return environment
}

function visit(context: Context, node: es.Node) {
  checkEditorBreakpoints(context, node)
  context.runtime.nodes.unshift(node)
  return context
}

function leave(context: Context) {
  context.runtime.break = false
  context.runtime.nodes.shift()
  return context
}

const currentEnvironment = (context: Context) => context.runtime.environments[0]
const replaceEnvironment = (context: Context, environment: Environment) =>
  (context.runtime.environments[0] = environment)
const popEnvironment = (context: Context) => context.runtime.environments.shift()
const pushEnvironment = (context: Context, environment: Environment) =>
  context.runtime.environments.unshift(environment)

const getVariable = (context: Context, name: string) => {
  let environment: Environment | null = context.runtime.environments[0]
  while (environment) {
    if (environment.head.hasOwnProperty(name)) {
      if (environment.head[name] === HOISTED_BUT_NOT_YET_ASSIGNED) {
        return handleRuntimeError(
          context,
          new errors.UnassignedVariable(name, context.runtime.nodes[0])
        )
      } else {
        return environment.head[name]
      }
    } else {
      environment = environment.tail
    }
  }
  return handleRuntimeError(context, new errors.UndefinedVariable(name, context.runtime.nodes[0]))
}

// TODO[@plty]: make this possible
// const setVariable = (context: Context, name: string, value: any) => {
//   let environment: Environment | null = context.runtime.environments[0]
//   while (environment) {
//     if (environment.head.hasOwnProperty(name)) {
//       if (environment.head[name] === HOISTED_BUT_NOT_YET_ASSIGNED) {
//         break
//       }
//       const descriptors = Object.getOwnPropertyDescriptors(environment.head)
//       if (descriptors[name].writable) {
//         environment.head[name] = value
//         return undefined
//       }
//       return handleRuntimeError(
//         context,
//         new errors.ConstAssignment(context.runtime.nodes[0]!, name)
//       )
//     } else {
//       environment = environment.tail
//     }
//   }
//   return handleRuntimeError(context, new errors.UndefinedVariable(name, context.runtime.nodes[0]))
// }

const checkNumberOfArguments = (
  context: Context,
  callee: Closure,
  args: Value[],
  exp: es.CallExpression
) => {
  if (callee.node.params.length !== args.length) {
    return handleRuntimeError(
      context,
      new errors.InvalidNumberOfArguments(exp, callee.node.params.length, args.length)
    )
  }
  return undefined
}

function getArgs(context: Context, call: es.CallExpression) {
  return call.arguments.map(arg => evaluate(arg, context))
}

export type Evaluator<T extends es.Node> = (node: T, context: Context) => IterableIterator<Value>

function* evaluateBlockStatement(context: Context, node: es.BlockStatement) {
  hoistFunctionsAndVariableDeclarationsIdentifiers(context, node)
  let result
  for (const statement of node.body) {
    result = yield* evaluate(statement, context).evaluate()
    if (result instanceof ReturnValue || result instanceof TailCallReturnValue) {
      break
    }
  }
  return result
}

/**
 * WARNING: Do not use object literal shorthands, e.g.
 *   {
 *     *Literal(node: es.Literal, ...) {...},
 *     *ThisExpression(node: es.ThisExpression, ..._ {...},
 *     ...
 *   }
 * They do not minify well, raising uncaught syntax errors in production.
 * See: https://github.com/webpack/webpack/issues/7566
 */
// tslint:disable:object-literal-shorthand
export const evaluators: { [nodeType: string]: Evaluator<es.Node> } = {
  /** Simple Values */
  Literal: function*(node: es.Literal, context: Context) {
    return node.value
  },

  ThisExpression: function*(node: es.ThisExpression, context: Context) {
    return currentEnvironment(context).thisContext
  },

  // TODO[@plty]: Add debugger.
  // DebuggerStatement: function*(node: es.DebuggerStatement, context: Context) {
  //   context.runtime.break = true
  //   yield
  // },

  // TODO MARK[@plty]: unchanged stuff as this is O(1).
  FunctionExpression: function*(node: es.FunctionExpression, context: Context) {
    return new Closure(node, currentEnvironment(context), context)
  },

  ArrowFunctionExpression: function*(node: es.ArrowFunctionExpression, context: Context) {
    return Closure.makeFromArrowFunction(node, currentEnvironment(context), context)
  },

  Identifier: function*(node: es.Identifier, context: Context) {
    return yield* getVariable(context, node.name).evaluate()
  },

  CallExpression: function*(node: es.CallExpression, context: Context) {
    const callee = yield* evaluate(node.callee, context).evaluate()
    const args = getArgs(context, node)
    let thisContext
    if (node.callee.type === 'MemberExpression') {
      thisContext = evaluate(node.callee.object, context)
    }
    return yield* apply(context, callee, args, node, thisContext)
  },

  UnaryExpression: function*(node: es.UnaryExpression, context: Context) {
    const value = yield* evaluate(node.argument, context).evaluate()

    const error = rttc.checkUnaryExpression(node, node.operator, value)
    if (error) {
      return handleRuntimeError(context, error)
    }
    return evaluateUnaryExpression(node.operator, value)
  },

  BinaryExpression: function*(node: es.BinaryExpression, context: Context) {
    const left = yield* evaluate(node.left, context).evaluate()
    const right = yield* evaluate(node.right, context).evaluate()

    const error = rttc.checkBinaryExpression(node, node.operator, left, right)
    if (error) {
      return handleRuntimeError(context, error)
    }
    return evaluateBinaryExpression(node.operator, left, right)
  },

  IfStatement: function*(node: es.IfStatement | es.ConditionalExpression, context: Context) {
    const test = yield* evaluate(node.test, context).evaluate()
    const cons = node.consequent
    const alt = node.alternate!

    const error = rttc.checkIfStatement(node, test)
    if (error) {
      return handleRuntimeError(context, error)
    }

    return yield* evaluate(test ? cons : alt, context).evaluate()
  },

  ConditionalExpression: function*(node: es.ConditionalExpression, context: Context) {
    // TODO[@plty]: remove code duplication
    const test = yield* evaluate(node.test, context).evaluate()
    const cons = node.consequent
    const alt = node.alternate!

    const error = rttc.checkIfStatement(node, test)
    if (error) {
      return handleRuntimeError(context, error)
    }

    return yield* evaluate(test ? cons : alt, context).evaluate()
  },

  LogicalExpression: function*(node: es.LogicalExpression, context: Context) {
    const left = evaluate(node.left, context)
    const right = evaluate(node.right, context)

    const leftValue = yield* left.evaluate()

    if (node.operator === '&&') {
      return leftValue ? yield* right.evaluate() : false
    } else {
      return leftValue ? true : yield* right.evaluate()
    }
  },

  VariableDeclaration: function*(node: es.VariableDeclaration, context: Context) {
    const declaration = node.declarations[0]
    const constant = node.kind === 'const'
    const id = declaration.id as es.Identifier
    const value = evaluate(declaration.init!, context)
    defineVariable(context, id.name, value, constant)
    return undefined
  },

  FunctionDeclaration: function*(node: es.FunctionDeclaration, context: Context) {
    const id = node.id as es.Identifier
    // tslint:disable-next-line:no-any
    const closure = new Closure(node, currentEnvironment(context), context)
    defineVariable(context, id.name, Thunk.from(closure), true)
    return undefined
  },

  ExpressionStatement: function*(node: es.ExpressionStatement, context: Context) {
    return yield* evaluate(node.expression, context).evaluate()
  },

  // TODO[@plty] support TCO later
  ReturnStatement: function*(node: es.ReturnStatement, context: Context) {
    const returnExpression = node.argument!
    return new ReturnValue(yield* evaluate(returnExpression, context).evaluate())
  },

  BlockStatement: function*(node: es.BlockStatement, context: Context) {
    let result: Value

    // Create a new environment (block scoping)
    const environment = createBlockEnvironment(context, 'blockEnvironment')
    pushEnvironment(context, environment)
    result = evaluateBlockStatement(context, node)
    popEnvironment(context)
    return result
  },

  Program: function*(node: es.BlockStatement, context: Context) {
    context.numberOfOuterEnvironments += 1
    const environment = createBlockEnvironment(context, 'programEnvironment')
    pushEnvironment(context, environment)
    return yield* evaluateBlockStatement(context, node)
  }
}

// tslint:enable:object-literal-shorthand
export function evaluate(node: es.Node, context: Context) {
  visit(context, node)
  let frozenEnvironment = {
    ...context,
    runtime: {
      ...context.runtime,
      environments: [...context.runtime.environments]
    }
  }
  if (node.type === 'Program') {
    frozenEnvironment = context
  }
  const result = new Thunk(function*() {
    return yield* evaluators[node.type](node, frozenEnvironment)
  })
  leave(context)
  return result
}

export function* apply(
  context: Context,
  fun: Closure | Value,
  args: Value[],
  node: es.CallExpression,
  thisContext?: Value
) {
  let result: Value
  let total = 0

  while (!(result instanceof ReturnValue)) {
    if (fun instanceof Closure) {
      checkNumberOfArguments(context, fun, args, node!)
      const environment = createEnvironment(fun, args, node)
      environment.thisContext = thisContext
      if (result instanceof TailCallReturnValue) {
        replaceEnvironment(context, environment)
      } else {
        pushEnvironment(context, environment)
        total++
      }
      result = yield* evaluateBlockStatement(context, fun.node.body as es.BlockStatement)
      if (result instanceof TailCallReturnValue) {
        fun = result.callee
        node = result.node
        args = result.args
      } else if (!(result instanceof ReturnValue)) {
        // No Return Value, set it as undefined
        result = new ReturnValue(undefined)
      }
    } else if (typeof fun === 'function') {
      try {
        result = yield* fun.apply(thisContext, args)
        break
      } catch (e) {
        // Recover from exception
        context.runtime.environments = context.runtime.environments.slice(
          -context.numberOfOuterEnvironments
        )

        const loc = node ? node.loc! : constants.UNKNOWN_LOCATION
        if (!(e instanceof RuntimeSourceError || e instanceof errors.ExceptionError)) {
          // The error could've arisen when the builtin called a source function which errored.
          // If the cause was a source error, we don't want to include the error.
          // However if the error came from the builtin itself, we need to handle it.
          return handleRuntimeError(context, new errors.ExceptionError(e, loc))
        }
        result = undefined
        throw e
      }
    } else {
      return handleRuntimeError(context, new errors.CallingNonFunctionValue(fun, node))
    }
  }
  // Unwraps return value and release stack environment
  if (result instanceof ReturnValue) {
    result = result.value
  }
  for (let i = 1; i <= total; i++) {
    popEnvironment(context)
  }
  return result
}
