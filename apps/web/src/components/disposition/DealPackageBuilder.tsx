'use client';

import { Loader2, Send, Users } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface DealPackageBuilderProps {
  selectedCount: number;
  onSend: (notes: string) => Promise<void>;
  loading: boolean;
}

export function DealPackageBuilder({
  selectedCount,
  onSend,
  loading,
}: DealPackageBuilderProps) {
  const [notes, setNotes] = useState('');

  const handleSend = async () => {
    await onSend(notes);
    setNotes('');
  };

  return (
    <Card className="sticky top-6">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Send className="h-5 w-5" />
          Send Deal Package
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg bg-slate-100 p-3">
          <Users className="h-5 w-5 text-slate-600" />
          <div>
            <p className="font-medium">
              {selectedCount} Buyer{selectedCount !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-muted-foreground">
              Selected to receive deal
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="mb-2 block text-sm font-medium">
            Notes (optional)
          </label>
          <Textarea
            id="notes"
            placeholder="Add any notes for buyers..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
          />
        </div>

        <Button
          onClick={handleSend}
          disabled={selectedCount === 0 || loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send to {selectedCount} Buyer{selectedCount !== 1 ? 's' : ''}
            </>
          )}
        </Button>

        {selectedCount === 0 && (
          <p className="text-center text-xs text-muted-foreground">
            Select buyers to send the deal package
          </p>
        )}
      </CardContent>
    </Card>
  );
}
