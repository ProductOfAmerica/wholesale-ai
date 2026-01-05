import { Suspense } from 'react';
import { DealAnalyzerContent } from '@/components/deal-analyzer/DealAnalyzerContent';
export default function DealAnalyzerPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <DealAnalyzerContent />
    </Suspense>
  );
}
