
'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import type { FieldValue } from 'firebase/firestore';

type FormattedDateProps = {
    date: Date | string | FieldValue | undefined | null;
    formatString: string;
    fallback?: string;
};

export const FormattedDate = ({ date, formatString, fallback = '' }: FormattedDateProps) => {
    const [formattedDate, setFormattedDate] = useState<string | null>(null);

    useEffect(() => {
        if (!date) {
            setFormattedDate(fallback);
            return;
        }

        try {
            let dateObj: Date;
            if (typeof date === 'string') {
                // Handles ISO strings like from new Date().toISOString() or date-picker strings
                dateObj = parseISO(date);
                if (isNaN(dateObj.getTime())) {
                    dateObj = new Date(date);
                }
            } else if (date && typeof (date as any).toDate === 'function') {
                // Handle Firestore Timestamps
                dateObj = (date as any).toDate();
            } else {
                dateObj = date as Date;
            }

            if (isNaN(dateObj.getTime())) {
                setFormattedDate(fallback);
            } else {
                setFormattedDate(format(dateObj, formatString));
            }
        } catch (error) {
            console.error("Error formatting date:", error);
            setFormattedDate(fallback);
        }
    }, [date, formatString, fallback]);

    // Render null on first render to avoid hydration mismatch, then the formatted date.
    if (formattedDate === null) {
        return null;
    }

    return <>{formattedDate}</>;
}
