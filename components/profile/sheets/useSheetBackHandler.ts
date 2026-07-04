import { TrueSheet } from '@lodev09/react-native-true-sheet';
import React, { useEffect, useState, useCallback } from 'react';
import { BackHandler } from 'react-native';

/**
 * Intercepts the Android hardware back button while a TrueSheet is visible.
 * Manually calls dismiss() on the sheet, then returns true to consume the
 * event so React Navigation does not also navigate back.
 */
export function useSheetBackHandler(ref: React.ForwardedRef<TrueSheet>) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const sub = BackHandler.addEventListener('hardwareBackPress', () => {
            if (ref && typeof ref !== 'function') {
                ref.current?.dismiss();
            }
            return true;
        });
        return () => sub.remove();
    }, [isOpen, ref]);

    const onDidPresent = useCallback(() => setIsOpen(true), []);
    const onDidDismiss = useCallback(() => setIsOpen(false), []);

    return {
        onDidPresent,
        onDidDismiss,
    };
}

