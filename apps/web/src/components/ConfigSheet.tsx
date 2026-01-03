'use client';

import { SettingsIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';

const DEFAULT_SCRIPT = `Hi! Thanks for picking up. I specialize in helping homeowners sell quickly without the hassle of repairs or showings. Do you have a few minutes to chat about your property?`;

const STORAGE_KEY = 'wholesale-ai-config';

interface Config {
  initialScript: string;
}

function loadConfig(): Config {
  if (typeof window === 'undefined') {
    return { initialScript: DEFAULT_SCRIPT };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return { initialScript: DEFAULT_SCRIPT };
}

function saveConfig(config: Config): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

interface ConfigSheetProps {
  onConfigChange?: (config: Config) => void;
}

export function ConfigSheet({ onConfigChange }: ConfigSheetProps) {
  const [config, setConfig] = useState<Config>({ initialScript: DEFAULT_SCRIPT });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const loaded = loadConfig();
    setConfig(loaded);
    onConfigChange?.(loaded);
  }, [onConfigChange]);

  const handleScriptChange = (value: string) => {
    const newConfig = { ...config, initialScript: value };
    setConfig(newConfig);
    saveConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const handleReset = () => {
    const newConfig = { initialScript: DEFAULT_SCRIPT };
    setConfig(newConfig);
    saveConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Call Settings</SheetTitle>
          <SheetDescription>
            Configure your call script and preferences
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="initial-script">Opening Script</Label>
            <Textarea
              id="initial-script"
              value={config.initialScript}
              onChange={(e) => handleScriptChange(e.target.value)}
              placeholder="Enter your opening script..."
              className="min-h-[200px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This script will be shown as the suggested response when a call starts.
            </p>
          </div>

          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset to Default
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function useConfig() {
  const [config, setConfig] = useState<Config>({ initialScript: DEFAULT_SCRIPT });

  useEffect(() => {
    setConfig(loadConfig());
  }, []);

  return config;
}
