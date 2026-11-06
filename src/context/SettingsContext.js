import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getWeightUnit, setWeightUnit as saveWeightUnit } from '../repo/preferences';

const SettingsContext = createContext({ weightUnit: 'kg', setWeightUnit: () => {} });

export function SettingsProvider({ children }) {
  const [weightUnit, setUnitState] = useState(null);

  useEffect(() => {
    getWeightUnit()
      .then(setUnitState)
      .catch(() => setUnitState('kg'));
  }, []);

  const setWeightUnit = useCallback(async (unit) => {
    setUnitState(unit);
    try {
      await saveWeightUnit(unit);
    } catch (e) {
      console.warn('Could not save unit preference', e);
    }
  }, []);

  const value = useMemo(() => ({ weightUnit: weightUnit ?? 'kg', setWeightUnit }), [weightUnit, setWeightUnit]);

  if (weightUnit === null) return null;
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
