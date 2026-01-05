import type { TemplateField } from '@wholesale-ai/shared';
import { FieldType } from '@wholesale-ai/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DynamicFieldProps {
  field: TemplateField;
  value: string;
  onChange: (name: string, value: string) => void;
}

export function DynamicField({ field, value, onChange }: DynamicFieldProps) {
  const handleChange = (newValue: string) => {
    onChange(field.name, newValue);
  };

  const renderInput = () => {
    switch (field.type) {
      case FieldType.SELECT:
        return (
          <Select value={value} onValueChange={handleChange}>
            <SelectTrigger>
              <SelectValue
                placeholder={`Select ${field.label.toLowerCase()}`}
              />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case FieldType.CURRENCY:
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="0"
              className="pl-7"
            />
          </div>
        );

      case FieldType.NUMBER:
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );

      case FieldType.DATE:
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
          />
        );

      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name}>
        {field.label}
        {field.required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      {renderInput()}
    </div>
  );
}
