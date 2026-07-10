import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { SharedData } from '@/types';

export function FlashToastListener() {
    const lastMessageRef = useRef<string | null>(null);

    useEffect(() => {
        return router.on('success', (event) => {
            const props = event.detail.page.props as unknown as SharedData;
            const flash = props.flash;

            if (!flash?.message || !flash.type) return;

            const key = `${flash.type}:${flash.message}`;
            if (lastMessageRef.current === key) return;
            lastMessageRef.current = key;

            toast[flash.type](flash.message);
        });
    }, []);

    return null;
}