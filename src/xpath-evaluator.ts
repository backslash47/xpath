import { NodeXPathNSResolver } from './node-x-path-ns-resolver';
import { isNSResolver } from './utils/types';
import { XPathException } from './xpath-exception';
import { XPathExpressionImpl } from './xpath-expression-impl';
import { XPathNSResolverWrapper } from './xpath-ns-resolver-wrapper';
import { XPathParser } from './xpath-parser';
import { FunctionResolver, VariableResolver } from './xpath-types';

export class XPathEvaluatorImpl implements XPathEvaluator {
  functionResolver?: FunctionResolver;
  variableResolver?: VariableResolver;
  parser?: XPathParser;

  constructor({ fr, vr, p }: { fr?: FunctionResolver; vr?: VariableResolver; p?: XPathParser }) {
    this.functionResolver = fr;
    this.variableResolver = vr;
    this.parser = p;
  }

  createExpression(e: string, r: XPathNSResolver | null) {
    try {
      return new XPathExpressionImpl(e, {
        fr: this.functionResolver,
        nr: new XPathNSResolverWrapper(r),
        vr: this.variableResolver,
        p: this.parser
      });
    } catch (e) {
      throw new XPathException(XPathException.INVALID_EXPRESSION_ERR, e);
    }
  }
  createNSResolver(n: Node) {
    return new NodeXPathNSResolver(n);
  }
  evaluate(
    expression: string,
    contextNode: Node,
    resolver: XPathNSResolver | ((prefix: string) => string | null) | null,
    type: number,
    result: XPathResult | null
  ) {
    if (type < 0 || type > 9) {
      throw {
        code: 0,
        toString() {
          return 'Request type not supported';
        }
      };
    }

    resolver = convertNSResolver(resolver);

    const ex = this.createExpression(expression, resolver);
    return ex.evaluate(contextNode, type, result);
  }
}

function convertNSResolver(resolver: XPathNSResolver | ((prefix: string) => string | null) | null | undefined) {
  if (resolver == null) {
    return {
      lookupNamespaceURI(_prefix: string): null {
        return null;
      }
    };
  } else if (!isNSResolver(resolver)) {
    const pr = resolver;
    return {
      lookupNamespaceURI(prefix: string): string | null {
        return pr(prefix);
      }
    };
  } else {
    return resolver;
  }
}
