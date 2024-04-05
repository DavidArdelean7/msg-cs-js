import { CapitalizationFrequency } from './capitalization-frequency.enum';

export const CapitalizationInterval = new Map<CapitalizationFrequency, number>();
CapitalizationInterval.set(CapitalizationFrequency.MONTHLY, 1);
CapitalizationInterval.set(CapitalizationFrequency.QUARTERLY, 3);
