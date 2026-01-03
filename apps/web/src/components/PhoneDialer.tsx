'use client';

import type React from 'react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PhoneDialerProps {
  onCall: (phoneNumber: string) => void;
  disabled?: boolean;
  className?: string;
}

const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA' },
  { code: '+44', country: 'UK' },
  { code: '+61', country: 'AU' },
  { code: '+49', country: 'DE' },
  { code: '+33', country: 'FR' },
  { code: '+81', country: 'JP' },
  { code: '+86', country: 'CN' },
  { code: '+91', country: 'IN' },
] as const;

function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');

  if (digits.length <= 3) {
    return digits;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

function unformatPhoneNumber(value: string): string {
  return value.replace(/\D/g, '');
}

export function PhoneDialer({
  onCall,
  disabled = false,
  className = '',
}: PhoneDialerProps) {
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handlePhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value);
      setPhoneNumber(formatted);
      setError(null);
    },
    []
  );

  const handleCall = useCallback(() => {
    const digits = unformatPhoneNumber(phoneNumber);

    if (digits.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    const fullNumber = `${countryCode}${digits}`;
    onCall(fullNumber);
  }, [countryCode, phoneNumber, onCall]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !disabled) {
        handleCall();
      }
    },
    [handleCall, disabled]
  );

  const digits = unformatPhoneNumber(phoneNumber);
  const isValid = digits.length >= 10;

  return (
    <div className={`phone-dialer ${className}`}>
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Make a Call
        </h2>

        <div className="space-y-4">
          <div className="flex gap-2">
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              disabled={disabled}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {COUNTRY_CODES.map(({ code, country }) => (
                <option key={code} value={code}>
                  {code} {country}
                </option>
              ))}
            </select>

            <Input
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              onKeyDown={handleKeyDown}
              placeholder="(555) 123-4567"
              disabled={disabled}
              className="flex-1 text-lg"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <title>Error</title>
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </div>
          )}

          <Button
            onClick={handleCall}
            disabled={disabled || !isValid}
            className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-6 h-6 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <title>Call</title>
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            Call {countryCode} {phoneNumber || '...'}
          </Button>
        </div>

        <p className="mt-4 text-sm text-gray-500 text-center">
          Your Twilio number will be used as the caller ID
        </p>
      </div>
    </div>
  );
}
