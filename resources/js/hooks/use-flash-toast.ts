import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface PageProps {
    flash: {
        type: 'success' | 'error' | 'warning' | 'info' | null;
        message: string | null;
    };

    [key: string]: unknown;
}

export function useFlashToast(): void {
    const { props, url } = usePage<PageProps>();

    useEffect(() => {
        const flash = props.flash;

        if (!flash?.message || !flash?.type) {
            return;
        }

        toast.dismiss();
        toast[flash.type](flash.message);
    }, [url]);
}
