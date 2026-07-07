import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const [dark, setDark] = useState(false);

    useEffect(() => {
        const appearance = localStorage.getItem("appearance") ?? "light";

        setDark(appearance === "dark");

        document.documentElement.classList.toggle(
            "dark",
            appearance === "dark"
        );
    }, []);

    const toggle = () => {
        const next = !dark;

        setDark(next);

        localStorage.setItem("appearance", next ? "dark" : "light");

        document.documentElement.classList.toggle("dark", next);
    };

    return (
        <button
            onClick={toggle}
            className="rounded-lg border p-2 hover:bg-gray-100 dark:hover:bg-zinc-800"
        >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
    );
}