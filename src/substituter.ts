import * as es from 'estree'
import { parse } from './parser'
import { Context } from './types'
import * as ast from './utils/astCreator'
import { evaluateBinaryExpression, evaluateUnaryExpression } from './utils/operators'
import * as rttc from './utils/rttc'

const reducers = {
  ExpressionStatement(node: es.ExpressionStatement, context: Context) {
    const [reducedExpression] = reduce(node.expression, context)
    return [ast.expressionStatement(reducedExpression as es.Expression, node.loc!), context]
  },
  BinaryExpression(node: es.BinaryExpression, context: Context) {
    const { operator, left, right } = node
    if (left.type === 'Literal') {
      if (right.type === 'Literal') {
        const error = rttc.checkBinaryExpression(node, operator, left.value, right.value)
        if (error === undefined) {
          return [ast.literal(evaluateBinaryExpression(operator, left.value, right.value)), context]
        } else {
          throw error
        }
      } else {
        const [reducedRight] = reduce(right, context)
        const reducedExpression = ast.binaryExpression(
          operator,
          left,
          reducedRight as es.Expression,
          node.loc!
        )
        return [reducedExpression, context]
      }
    } else {
      const [reducedLeft] = reduce(node.left, context)
      const reducedExpression = ast.binaryExpression(
        operator,
        reducedLeft as es.Expression,
        right,
        node.loc!
      )
      return [reducedExpression, context]
    }
  },
  UnaryExpression(node: es.UnaryExpression, context: Context) {
    const { operator, argument } = node
    if (argument.type === 'Literal') {
      const error = rttc.checkUnaryExpression(node, operator, argument.value)
      if (error === undefined) {
        return [ast.literal(evaluateUnaryExpression(operator, argument.value)), context]
      } else {
        throw error
      }
    } else {
      const [reducedArgument] = reduce(argument, context)
      const reducedExpression = ast.unaryExpression(
        operator,
        reducedArgument as es.Expression,
        node.loc!
      )
      return [reducedExpression, context]
    }
  },
  ConditionalExpression(node: es.ConditionalExpression, context: Context) {
    const { test, consequent, alternate } = node
    if (test.type === 'Literal') {
      const error = rttc.checkIfStatement(node, test)
      if (error === undefined) {
        return [ast.expressionStatement(test.type ? consequent : alternate), context]
      } else {
        throw error
      }
    } else {
      const [reducedTest] = reduce(test, context)
      const reducedExpression = ast.conditionalExpression(
        reducedTest as es.Expression,
        consequent,
        alternate,
        node.loc!
      )
      return reducedExpression
    }
  },
  /* <WORK IN PROGRESS>
  CallExpression(node: es.CallExpression, context: Context) {
    const { callee, arguments } = node
    // if functor can reduce, reduce functor
    if (callee.type !== 'Literal') { // in source 0, callee can only be a literal
      const [reducedFunctor] = reduce(callee, context)
      const reducedExpression: es.SimpleCallExpression = {
        type: 'CallExpression',
        callee: reducedFunctor as es.Expression,
        arguments
      }
      return reducedExpression
    }
    // if arguments can reduce, reduce arguments
    else if {
      arguments.length 
    }
    // else if no error (wrong number of args), replace with return statement
  },
  FunctionDeclaration(node: es.FunctionDeclaration, context: Context) {
    const { id, body } = node
    // if id is not undefined
    // saveVariable(id, body);
  },
  */
  Program(node: es.Program, context: Context) {
    const [firstStatement, ...otherStatements] = node.body
    if (
      firstStatement.type === 'ExpressionStatement' &&
      firstStatement.expression.type === 'Literal'
    ) {
      return [ast.program(otherStatements, node.loc!), context]
    } else {
      const [reduced, newContext] = reduce(firstStatement, context)
      return [ast.program([reduced as es.Statement, ...otherStatements], node.loc!), newContext]
    }
  },
  /* <BAD PRACTICE>
   * for now BlockStatement is just duplicated code from Program which is BAD PRACTICE,
   * but in future BlockStatement will need to handle return as well.
   * </BAD PRACTICE>
   */
  BlockStatement(node: es.BlockStatement, context: Context) {
    const [firstStatement, ...otherStatements] = node.body
    const isFirstStatementCompletelyReduced =
      firstStatement.type === 'ExpressionStatement' && firstStatement.expression.type === 'Literal'
    if (isFirstStatementCompletelyReduced) {
      return [ast.blockStatement(otherStatements, node.loc!), context]
    } else {
      const [reduced, newContext] = reduce(firstStatement, context)
      return [
        ast.blockStatement([reduced as es.Statement, ...otherStatements], node.loc!),
        newContext
      ]
    }
  }
}

function reduce(node: es.Node, context: Context): [es.Node, Context] {
  const reducer = reducers[node.type]
  if (reducer === undefined) {
    return [node, context] // if reducer is not found we just get stuck
  } else {
    return reducer(node, context)
  }
}

export function getEvaluationSteps(code: string, context: Context): Array<[es.Node, Context]> {
  const steps: Array<[es.Node, Context]> = []
  try {
    const program = parse(code, context)
    if (program === undefined) {
      return [[parse('', context)!, context]]
    }
    steps.push([program, context])
    let [reduced, newContext] = reduce(program, context)
    while ((reduced as es.Program).body.length > 0) {
      steps.push([reduced, newContext])
        // some bug with no semis
        // tslint:disable-next-line
        ;[reduced, newContext] = reduce(reduced, newContext)
    }
    return steps
  } catch (error) {
    context.errors.push(error)
    return steps
  }
}