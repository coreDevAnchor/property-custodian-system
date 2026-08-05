import { router } from "@inertiajs/react";
import { useEffect, useState } from "react";

export function useInertiaLoading() {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const start = router.on("start", () => {
            setLoading(true);
        });

        const finish = router.on("finish", () => {
            setLoading(false);
        });

        return () => {
            start();
            finish();
        };
    }, []);

    return loading;
}