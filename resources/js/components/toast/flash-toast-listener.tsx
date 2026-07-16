import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface FlashProps {
    flash?: {
        type?: 'success' | 'error' | 'warning' | 'info' | null;
        message?: string | null;
    };
    [key: string]: unknown;
}

export function FlashToastListener() {
    const { flash } = usePage<FlashProps>().props;

    useEffect(() => {
        if (!flash?.message || !flash?.type) {
            return;
        }

        toast[flash.type](flash.message);
    }, [flash]);

    return null;
}