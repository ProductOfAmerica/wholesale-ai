'use client';

import type {
  AnalyzeRequestSchema,
  ComplianceCheck,
  DealAnalysis,
  Lead,
} from '@wholesale-ai/shared';
import { DealStrategy } from '@wholesale-ai/shared';
import { FileText, Phone, Users } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ComplianceAlert } from '@/components/compliance/ComplianceAlert';
import { DisclosureList } from '@/components/compliance/DisclosureList';
import { StateSelector } from '@/components/compliance/StateSelector';
import { CompList } from '@/components/deal-analyzer/CompList';
import { DealGradeCard } from '@/components/deal-analyzer/DealGradeCard';
import { MAODisplay } from '@/components/deal-analyzer/MAODisplay';
import { ProfitDisplay } from '@/components/deal-analyzer/ProfitDisplay';
import {
  PropertyForm,
  type PropertyFormRef,
} from '@/components/deal-analyzer/PropertyForm';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

interface StateInfo {
  code: string;
  name: string;
  hasRestrictions: boolean;
}

export function DealAnalyzerContent() {
  const searchParams = useSearchParams();
  const leadId = searchParams.get('leadId');

  const [analysis, setAnalysis] = useState<DealAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [lead, setLead] = useState<Lead | null>(null);
  const [leadLoading, setLeadLoading] = useState(false);
  const [selectedState, setSelectedState] = useState('TX');
  const [states, setStates] = useState<StateInfo[]>([]);
  const [complianceCheck, setComplianceCheck] =
    useState<ComplianceCheck | null>(null);

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

  useEffect(() => {
    if (!leadId) return;
    setLeadLoading(true);
    fetch(`/api/leads/${leadId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Lead | null) => {
        if (data) {
          setLead(data);
          setSelectedState(data.property.state);
        }
      })
      .finally(() => setLeadLoading(false));
  }, [leadId]);

  const formDefaults = useMemo(() => {
    if (!lead) return undefined;
    const { property } = lead;
    return {
      address: `${property.address}, ${property.city}, ${property.state} ${property.zip}`,
      sqft: property.sqft,
    };
  }, [lead]);

  const checkCompliance = useCallback(
    async (state: string) => {
      if (!analysis) return;
      try {
        const res = await fetch('/api/compliance/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            state,
            strategy: DealStrategy.ASSIGNMENT,
          }),
        });
        const data = await res.json();
        setComplianceCheck(data);
      } catch (error) {
        console.error('Compliance check failed:', error);
      }
    },
    [analysis]
  );

  useEffect(() => {
    if (analysis && selectedState) {
      checkCompliance(selectedState);
    }
  }, [analysis, selectedState, checkCompliance]);

  const handleSubmit = async (data: AnalyzeRequestSchema) => {
    setLoading(true);
    setComplianceCheck(null);
    try {
      const response = await fetch('/api/deals/analyze', {
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
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasViolations = complianceCheck ? !complianceCheck.passed : false;

  return (
    <AppLayout title="Deal Analyzer">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <PropertyForm
            onSubmit={handleSubmit}
            loading={loading || leadLoading}
            defaultValues={formDefaults}
          />

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
              {complianceCheck && <ComplianceAlert check={complianceCheck} />}

              <div className="flex items-start justify-between gap-4">
                <DealGradeCard
                  grade={analysis.grade}
                  reasons={analysis.gradeReasons}
                />
                <div className="flex flex-col gap-2">
                  <Link href="/copilot">
                    <Button variant="outline" className="w-full justify-start">
                      <Phone className="mr-2 h-4 w-4" />
                      Call Seller
                    </Button>
                  </Link>
                  <Link href="/disposition">
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="mr-2 h-4 w-4" />
                      Find Buyers
                    </Button>
                  </Link>
                  <Link href="/docs">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      disabled={hasViolations}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Docs
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <MAODisplay breakdown={analysis.maoBreakdown} />
                <ProfitDisplay profit={analysis.profitProjection} />
              </div>

              <CompList comps={analysis.comps} arv={analysis.arv} />

              {complianceCheck &&
                complianceCheck.requiredDisclosures.length > 0 && (
                  <DisclosureList
                    disclosures={complianceCheck.requiredDisclosures}
                  />
                )}
            </>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
              <p className="text-muted-foreground">
                Enter property details and click &quot;Analyze Deal&quot; to see
                results
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}