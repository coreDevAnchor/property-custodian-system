import { Category } from "@/types/categories";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ReportFiltersProps {
    categories: Category[];
    category: string;
    sort: string;
    sortOptions: {
        value: string;
        label: string;
    }[];

    onCategoryChange(value: string): void;
    onSortChange(value: string): void;
}

export function ReportFilters({
    categories,
    category,
    sort,
    sortOptions,
    onCategoryChange,
    onSortChange,
}: ReportFiltersProps) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            <Select
                value={category}
                onValueChange={onCategoryChange}
            >
                <SelectTrigger className="w-[180px] cursor-pointer">
                    <SelectValue placeholder="Category" />
                </SelectTrigger>

                <SelectContent>
                    <SelectItem value="all">
                        All Categories
                    </SelectItem>

                    {categories.map((cat) => (
                        <SelectItem
                            key={cat.id}
                            value={String(cat.id)}
                        >
                            {cat.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={sort}
                onValueChange={onSortChange}
            >
                <SelectTrigger className="w-[180px] cursor-pointer">
                    <SelectValue placeholder="Sort by" />
                </SelectTrigger>

                <SelectContent>
                    {sortOptions.map((option) => (
                        <SelectItem
                            key={option.value}
                            value={option.value}
                        >
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}