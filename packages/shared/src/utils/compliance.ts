import { getStateCompliance } from '../data/state-compliance.js';
import {
  type ComplianceCheck,
  type ComplianceCheckInput,
  ComplianceSeverity,
  type ComplianceViolation,
  type ComplianceWarning,
  type RequiredDisclosure,
} from '../types/compliance.js';
import { DealStrategy } from '../types/deal.js';

export function checkCompliance(input: ComplianceCheckInput): ComplianceCheck {
  const {
    state,
    strategy,
    distressIndicators = [],
    dealsThisYear = 0,
    propertyInForeclosure = false,
  } = input;

  const stateCompliance = getStateCompliance(state);
  const violations: ComplianceViolation[] = [];
  const warnings: ComplianceWarning[] = [];
  const requiredDisclosures: RequiredDisclosure[] = [];

  if (!stateCompliance) {
    return {
      dealId: null,
      state,
      strategy,
      passed: true,
      violations: [],
      warnings: [
        {
          type: 'no_data',
          message: `No compliance data available for ${state}. Proceed with caution and consult local regulations.`,
          learnMoreUrl: null,
        },
      ],
      requiredDisclosures: [],
      checkedAt: new Date().toISOString(),
    };
  }

  if (
    state.toUpperCase() === 'IL' &&
    strategy === DealStrategy.ASSIGNMENT &&
    dealsThisYear >= 1
  ) {
    violations.push({
      ruleId: 'il-license-001',
      ruleName: 'Real Estate License Requirement',
      message: `Illinois requires a real estate license after completing 1 wholesale deal per year. You have completed ${dealsThisYear} deals this year.`,
      severity: ComplianceSeverity.ERROR,
      remediation:
        'Use double close instead of assignment, or obtain an Illinois real estate license.',
    });
  }

  if (
    (state.toUpperCase() === 'CA' || state.toUpperCase() === 'WA') &&
    propertyInForeclosure
  ) {
    const stateName = stateCompliance.stateName;
    warnings.push({
      type: 'foreclosure_scrutiny',
      message: `${stateName} has strict regulations on foreclosure purchases. Extra documentation and disclosures required.`,
      learnMoreUrl: null,
    });

    for (const rule of stateCompliance.rules) {
      if (
        rule.category === 'foreclosure' &&
        rule.severity === ComplianceSeverity.ERROR
      ) {
        violations.push({
          ruleId: rule.id,
          ruleName: rule.name,
          message: rule.description,
          severity: rule.severity,
          remediation:
            'Ensure all required disclosures are provided and cancellation rights are honored.',
        });
      }
    }
  }

  if (
    (strategy === DealStrategy.SELLER_FINANCE ||
      strategy === DealStrategy.SUBJECT_TO) &&
    (state.toUpperCase() === 'TX' || state.toUpperCase() === 'OK')
  ) {
    const creativeFinanceRules = stateCompliance.rules.filter(
      (r) => r.category === 'creative_finance'
    );

    for (const rule of creativeFinanceRules) {
      if (rule.severity === ComplianceSeverity.ERROR) {
        warnings.push({
          type: 'creative_finance',
          message: `${rule.name}: ${rule.description}`,
          learnMoreUrl: null,
        });
      }
    }
  }

  for (const restriction of stateCompliance.restrictions) {
    if (restriction.strategy === strategy && !restriction.allowed) {
      violations.push({
        ruleId: `${state.toLowerCase()}-restriction-${strategy}`,
        ruleName: `${strategy} Restriction`,
        message: `${strategy} is restricted in ${stateCompliance.stateName}. ${restriction.conditions ?? ''}`,
        severity: ComplianceSeverity.ERROR,
        remediation: restriction.alternativeStrategy
          ? `Use ${restriction.alternativeStrategy} instead.`
          : 'Consult with a local real estate attorney.',
      });
    } else if (restriction.strategy === strategy && restriction.conditions) {
      warnings.push({
        type: 'conditional_strategy',
        message: `${strategy} is conditionally allowed: ${restriction.conditions}`,
        learnMoreUrl: null,
      });
    }
  }

  for (const disclosure of stateCompliance.disclosures) {
    const triggered = disclosure.triggeredBy.some((trigger) => {
      if (trigger === strategy) return true;
      if (trigger === 'foreclosure' && propertyInForeclosure) return true;
      if (trigger === 'distressed' && distressIndicators.length > 0)
        return true;
      return false;
    });

    if (triggered) {
      requiredDisclosures.push(disclosure);
    }
  }

  const passed = violations.length === 0;

  return {
    dealId: null,
    state: state.toUpperCase(),
    strategy,
    passed,
    violations,
    warnings,
    requiredDisclosures,
    checkedAt: new Date().toISOString(),
  };
}

export function isStrategyAllowedInState(
  state: string,
  strategy: DealStrategy
): { allowed: boolean; reason: string | null } {
  const stateCompliance = getStateCompliance(state);

  if (!stateCompliance) {
    return { allowed: true, reason: null };
  }

  const restriction = stateCompliance.restrictions.find(
    (r) => r.strategy === strategy
  );

  if (!restriction) {
    return { allowed: true, reason: null };
  }

  return {
    allowed: restriction.allowed,
    reason: restriction.allowed
      ? restriction.conditions
      : (restriction.notes ?? 'Strategy not allowed in this state'),
  };
}

export function getRequiredDisclosuresForStrategy(
  state: string,
  strategy: DealStrategy,
  propertyInForeclosure = false
): RequiredDisclosure[] {
  const stateCompliance = getStateCompliance(state);

  if (!stateCompliance) {
    return [];
  }

  return stateCompliance.disclosures.filter((disclosure) =>
    disclosure.triggeredBy.some((trigger) => {
      if (trigger === strategy) return true;
      if (trigger === 'foreclosure' && propertyInForeclosure) return true;
      return false;
    })
  );
}
