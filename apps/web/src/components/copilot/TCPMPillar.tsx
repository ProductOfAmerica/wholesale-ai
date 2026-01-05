'use client';

import { CheckCircle2Icon, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface TCPMPillarProps {
  name: string;
  icon: LucideIcon;
  isComplete: boolean;
  questions: string[];
  notes: string | null;
  onQuestionClick: (question: string) => void;
}

export function TCPMPillar({
  name,
  icon: Icon,
  isComplete,
  questions,
  notes,
  onQuestionClick,
}: TCPMPillarProps) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        isComplete ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon
          className={`h-4 w-4 ${isComplete ? 'text-green-600' : 'text-gray-500'}`}
        />
        <span
          className={`text-sm font-medium ${isComplete ? 'text-green-700' : 'text-gray-700'}`}
        >
          {name}
        </span>
        {isComplete && (
          <CheckCircle2Icon className="h-4 w-4 text-green-600 ml-auto" />
        )}
      </div>

      {notes && (
        <p className="text-xs text-muted-foreground mb-2 italic">{notes}</p>
      )}

      <div className="space-y-1">
        {questions.map((question) => (
          <Button
            key={question}
            variant="ghost"
            size="sm"
            className="w-full justify-start text-left h-auto py-1.5 px-2 text-xs hover:bg-blue-50 hover:text-blue-700"
            onClick={() => onQuestionClick(question)}
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  );
}
