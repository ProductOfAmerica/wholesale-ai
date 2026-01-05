'use client';

import type { ComplianceCheck } from '@wholesale-ai/shared';
import { AlertTriangle, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface ComplianceAlertProps {
  check: ComplianceCheck;
}

export function ComplianceAlert({ check }: ComplianceAlertProps) {
  if (check.violations.length === 0 && check.warnings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {check.violations.length > 0 && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            Compliance Violations
            <Badge variant="destructive" className="text-xs">
              {check.violations.length}
            </Badge>
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-3">
              {check.violations.map((violation) => (
                <li key={violation.ruleId} className="space-y-1">
                  <div className="font-medium">{violation.ruleName}</div>
                  <div className="text-sm opacity-90">{violation.message}</div>
                  <div className="text-sm font-medium text-green-600 dark:text-green-400">
                    Fix: {violation.remediation}
                  </div>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {check.warnings.length > 0 && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            Compliance Warnings
            <Badge
              variant="outline"
              className="border-amber-500 text-xs text-amber-600"
            >
              {check.warnings.length}
            </Badge>
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            <ul className="mt-2 list-inside list-disc space-y-1">
              {check.warnings.map((warning, idx) => (
                <li key={`${warning.type}-${idx}`}>
                  {warning.message}
                  {warning.learnMoreUrl && (
                    <a
                      href={warning.learnMoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-1 underline hover:no-underline"
                    >
                      Learn more
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
