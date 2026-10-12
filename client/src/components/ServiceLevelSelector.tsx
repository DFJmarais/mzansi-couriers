import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface ServiceLevelSelectorProps {
  distance: number;
  selectedLevel: 'economy' | 'express' | 'localSameDay';
  onChange: (level: 'economy' | 'express' | 'localSameDay') => void;
}

const SERVICE_LEVELS = [
  {
    id: 'economy',
    name: 'Economy',
    description: '3-5 days',
    multiplier: '1.0x',
    details: 'Standard relay network delivery',
  },
  {
    id: 'express',
    name: 'Express',
    description: '1-2 days',
    multiplier: '1.25x',
    details: 'Faster relay routing',
  },
  {
    id: 'localSameDay' as const,
    name: 'Local Same Day',
    description: 'Same day',
    multiplier: '1.5x',
    details: 'Within 100km only',
    maxDistance: 100,
  },
];

export function ServiceLevelSelector({
  distance,
  selectedLevel,
  onChange,
}: ServiceLevelSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-3">Service Level</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SERVICE_LEVELS.map((level) => {
            const isDisabled = 'maxDistance' in level && (level as any).maxDistance && distance > (level as any).maxDistance;
            const isSelected = selectedLevel === level.id;

            return (
              <div key={level.id}>
                <button
                  type="button"
                  onClick={() => !isDisabled && onChange(level.id as any)}
                  disabled={isDisabled}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    isSelected
                      ? 'border-accent bg-accent/5'
                      : isDisabled
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                      : 'border-gray-200 hover:border-accent/50 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-sm">{level.name}</h4>
                      <p className="text-xs text-muted-foreground">{level.description}</p>
                    </div>
                    <span className="text-xs font-semibold bg-accent/10 px-2 py-1 rounded text-accent">
                      {level.multiplier}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{level.details}</p>
                </button>

                {isDisabled && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                    <AlertCircle className="w-3 h-3" />
                    <span>Available only within 100km</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {distance > 100 && selectedLevel === 'localSameDay' && (
        <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Local Same Day is only available for deliveries within 100km. Switched to Express.</span>
        </div>
      )}
    </div>
  );
}
