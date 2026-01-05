'use client';

import type {
  ComplianceCheck,
  ExitStrategyAnalysis,
  StrategyInputSchema,
  StrategyRecommendation,
} from '@wholesale-ai/shared';
import { useCallback, useEffect, useState } from 'react';
import { ComplianceAlert } from '@/components/compliance/ComplianceAlert';
import { StateSelector } from '@/components/compliance/StateSelector';
import {
  DecisionTree,
  ExitStrategyForm,
  StrategyCard,
  WarningsAlert,
} from '@/components/exit-strategy';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface StateInfo {
  code: string;
  name: string;
  hasRestrictions: boolean;
}

export default function ExitStrategyPage() {
  const [analysis, setAnalysis] = useState<ExitStrategyAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedState, setSelectedState] = useState('TX');
  const [states, setStates] = useState<StateInfo[]>([]);
  const [strategyChecks, setStrategyChecks] = useState<
    Map<string, ComplianceCheck>
  >(new Map());

  const fetchStates = useCallback(async () => {
    try {
      const res = await fetch('/api/compliance/states');
      const data = await res.json();
      setStates(data.states);
    } catch (error) {
      console.error('Failed to fetch states:', error);
    }
  }, []);

  useEffect(() => {
    fetchStates();
  }, [fetchStates]);

  const checkStrategiesCompliance = useCallback(
    async (recommendations: StrategyRecommendation[], state: string) => {
      const checks = new Map<string, ComplianceCheck>();
      for (const rec of recommendations) {
        try {
          const res = await fetch('/api/compliance/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state, strategy: rec.strategy }),
          });
          const data = await res.json();
          checks.set(rec.strategy, data);
        } catch {
          // Skip failed checks
        }
      }
      setStrategyChecks(checks);
    },
    []
  );

  useEffect(() => {
    if (analysis && selectedState) {
      checkStrategiesCompliance(analysis.recommendations, selectedState);
    }
  }, [analysis, selectedState, checkStrategiesCompliance]);

  const handleSubmit = async (data: StrategyInputSchema) => {
    setLoading(true);
    setStrategyChecks(new Map());
    try {
      const response = await fetch('/api/deals/exit-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setAnalysis(result);
    } catch (error) {
      console.error('Exit strategy analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRecommendations = () => {
    if (!analysis) return [];
    return analysis.recommendations.filter((rec) => {
      const check = strategyChecks.get(rec.strategy);
      return !check || check.passed;
    });
  };

  const blockedStrategies = analysis?.recommendations.filter((rec) => {
    const check = strategyChecks.get(rec.strategy);
    return check && !check.passed;
  });

  return (
    <AppLayout title="Exit Strategy Optimizer">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <ExitStrategyForm onSubmit={handleSubmit} loading={loading} />

          {states.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Property Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>State</Label>
                  <StateSelector
                    value={selectedState}
                    onChange={setSelectedState}
                    states={states}
                    placeholder="Select state"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          {analysis ? (
            <>
              <WarningsAlert warnings={analysis.warnings} />

              {blockedStrategies && blockedStrategies.length > 0 && (
                <ComplianceAlert
                  check={{
                    dealId: null,
                    state: selectedState,
                    strategy: blockedStrategies[0].strategy,
                    passed: false,
                    violations: blockedStrategies.flatMap((rec) => {
                      const check = strategyChecks.get(rec.strategy);
                      return check?.violations ?? [];
                    }),
                    warnings: [],
                    requiredDisclosures: [],
                    checkedAt: new Date().toISOString(),
                  }}
                />
              )}

              <DecisionTree
                tier1={analysis.tier1Result}
                tier2={analysis.tier2Result}
                tier3={analysis.tier3Result}
              />

              <div className="grid gap-4 md:grid-cols-2">
                {getFilteredRecommendations().map((rec) => (
                  <StrategyCard key={rec.strategy} recommendation={rec} />
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
              <p className="text-muted-foreground">
                Enter deal details and click &quot;Find Best Exit Strategy&quot;
                to see recommendations
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
