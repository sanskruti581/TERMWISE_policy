import { rankContextSignals } from './signalRanker.js';

export const detectContextSignals = (text, documentType) => {
  const { signals } = rankContextSignals(text, documentType);
  return signals;
};
