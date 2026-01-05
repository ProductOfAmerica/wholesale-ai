'use client';

import type { TCPMAnalysis } from '@wholesale-ai/shared';
import {
  CalendarIcon,
  DollarSignIcon,
  HeartIcon,
  WrenchIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TCPMPillar } from './TCPMPillar';

const TIMELINE_QUESTIONS = [
  'When do you need to be out of the house?',
  'Is there a deadline driving this?',
  'How quickly could you close?',
];

const CONDITION_QUESTIONS = [
  'What repairs does the property need?',
  'When was the roof/HVAC replaced?',
  'Any major issues I should know about?',
];

const PRICE_QUESTIONS = [
  'What number would make this work for you?',
  'How did you arrive at that price?',
  'Is there flexibility for a quick close?',
];

const MOTIVATION_QUESTIONS = [
  "What happens if the house doesn't sell?",
  'What are your plans after the sale?',
  'Why are you thinking about selling?',
];

function isTimelineComplete(analysis: TCPMAnalysis | null): boolean {
  if (!analysis) return false;
  return (
    analysis.timeline.urgency !== 'unknown' ||
    analysis.timeline.targetDate !== null ||
    (analysis.timeline.notes !== null && analysis.timeline.notes.length > 0)
  );
}

function isConditionComplete(analysis: TCPMAnalysis | null): boolean {
  if (!analysis) return false;
  return (
    analysis.condition.assessment !== 'unknown' ||
    analysis.condition.majorIssues.length > 0 ||
    (analysis.condition.notes !== null && analysis.condition.notes.length > 0)
  );
}

function isPriceComplete(analysis: TCPMAnalysis | null): boolean {
  if (!analysis) return false;
  return (
    analysis.price.expectation !== 'unknown' ||
    analysis.price.askingPrice !== null ||
    (analysis.price.notes !== null && analysis.price.notes.length > 0)
  );
}

function isMotivationComplete(analysis: TCPMAnalysis | null): boolean {
  if (!analysis) return false;
  return (
    analysis.motivation.level !== 'unknown' ||
    analysis.motivation.reasons.length > 0 ||
    (analysis.motivation.notes !== null && analysis.motivation.notes.length > 0)
  );
}

function calculateProgress(analysis: TCPMAnalysis | null): number {
  if (!analysis) return 0;
  let complete = 0;
  if (isTimelineComplete(analysis)) complete++;
  if (isConditionComplete(analysis)) complete++;
  if (isPriceComplete(analysis)) complete++;
  if (isMotivationComplete(analysis)) complete++;
  return (complete / 4) * 100;
}

export interface TCPMPromptsProps {
  tcpmAnalysis: TCPMAnalysis | null;
  onQuestionClick: (question: string) => void;
}

export function TCPMPrompts({
  tcpmAnalysis,
  onQuestionClick,
}: TCPMPromptsProps) {
  const progress = calculateProgress(tcpmAnalysis);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Discovery Prompts</CardTitle>
          <span className="text-xs text-muted-foreground">
            {Math.round(progress)}% complete
          </span>
        </div>
        <Progress value={progress} className="h-1" />
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <TCPMPillar
          name="Timeline"
          icon={CalendarIcon}
          isComplete={isTimelineComplete(tcpmAnalysis)}
          questions={TIMELINE_QUESTIONS}
          notes={tcpmAnalysis?.timeline.notes ?? null}
          onQuestionClick={onQuestionClick}
        />
        <TCPMPillar
          name="Condition"
          icon={WrenchIcon}
          isComplete={isConditionComplete(tcpmAnalysis)}
          questions={CONDITION_QUESTIONS}
          notes={tcpmAnalysis?.condition.notes ?? null}
          onQuestionClick={onQuestionClick}
        />
        <TCPMPillar
          name="Price"
          icon={DollarSignIcon}
          isComplete={isPriceComplete(tcpmAnalysis)}
          questions={PRICE_QUESTIONS}
          notes={tcpmAnalysis?.price.notes ?? null}
          onQuestionClick={onQuestionClick}
        />
        <TCPMPillar
          name="Motivation"
          icon={HeartIcon}
          isComplete={isMotivationComplete(tcpmAnalysis)}
          questions={MOTIVATION_QUESTIONS}
          notes={tcpmAnalysis?.motivation.notes ?? null}
          onQuestionClick={onQuestionClick}
        />
      </CardContent>
    </Card>
  );
}
