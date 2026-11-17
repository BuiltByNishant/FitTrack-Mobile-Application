import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getProfile, setHeightUnit as saveHeightUnit, setWeightUnit as saveWeightUnit } from '../repo/profile';

const SettingsContext = createContext({
  weightUnit: 'kg',
  heightUnit: 'cm',
  setWeightUnit: () => {},
  setHeightUnit: () => {},
});

// Display units for the whole app. Saved values stay in kg and cm; units only change how they are shown.
export function SettingsProvider({ children }) {
  const [units, setUnits] = useState(null);

  useEffect(() => {
    getProfile()
      .then((p) => setUnits({ weightUnit: p.weightUnit, heightUnit: p.heightUnit }))
      .catch(() => setUnits({ weightUnit: 'kg', heightUnit: 'cm' }));
  }, []);

  const setWeightUnit = useCallback(async (weightUnit) => {
    setUnits((u) => ({ ...u, weightUnit }));
    try {
      await saveWeightUnit(weightUnit);
    } catch (e) {
      console.warn('Could not save weight unit', e);
    }
  }, []);

  const setHeightUnit = useCallback(async (heightUnit) => {
    setUnits((u) => ({ ...u, heightUnit }));
    try {
      await saveHeightUnit(heightUnit);
    } catch (e) {
      console.warn('Could not save height unit', e);
    }
  }, []);

  const value = useMemo(
    () => ({ weightUnit: units?.weightUnit ?? 'kg', heightUnit: units?.heightUnit ?? 'cm', setWeightUnit, setHeightUnit }),
    [units, setWeightUnit, setHeightUnit]
  );

  if (units === null) return null;
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
