import * as React from 'react';
import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface FloatingLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
    floated?: boolean;
    variant?: 'field' | 'textarea';
}

function FloatingLabel({
    floated = false,
    variant = 'field',
    className,
    children,
    ...props
}: FloatingLabelProps) {
    return (
        <span
            aria-hidden
            className={cn(
                'pointer-events-none absolute left-3 z-10 whitespace-nowrap bg-background px-1.5 transition-all duration-200',
                variant === 'textarea'
                    ? floated
                        ? 'top-0 -translate-y-1/2 text-xs font-medium text-foreground'
                        : 'top-4 text-sm text-muted-foreground'
                    : floated
                        ? 'top-0 -translate-y-1/2 text-xs font-medium text-foreground'
                        : 'top-1/2 -translate-y-1/2 text-sm text-muted-foreground',
                className,
            )}
            {...props}
        >
            {children}
        </span>
    );
}

interface FloatingFieldProps {
    label: string;
    floated: boolean;
    variant?: 'field' | 'textarea';
    className?: string;
    children?: React.ReactNode;
}

function FloatingField({
    label,
    floated,
    variant = 'field',
    className,
    children,
}: FloatingFieldProps) {
    return (
        <div className={cn('relative', className)}>
            <FloatingLabel floated={floated} variant={variant}>
                {label}
            </FloatingLabel>
            {children}
        </div>
    );
}

interface FloatingInputProps extends React.ComponentProps<typeof Input> {
    label: string;
}

function FloatingInput({
    label,
    className,
    placeholder: _placeholder,
    onFocus,
    onBlur,
    ...props
}: FloatingInputProps) {
    const [focused, setFocused] = useState(false);
    const hasValue =
        props.value !== undefined && props.value !== null && props.value !== '';

    return (
        <FloatingField label={label} floated={focused || hasValue}>
            <Input
                aria-label={label}
                className={cn('h-10', className)}
                onFocus={(event) => {
                    setFocused(true);
                    onFocus?.(event);
                }}
                onBlur={(event) => {
                    setFocused(false);
                    onBlur?.(event);
                }}
                {...props}
            />
        </FloatingField>
    );
}

interface FloatingTextareaProps extends React.ComponentProps<typeof Textarea> {
    label: string;
}

function FloatingTextarea({
    label,
    className,
    placeholder: _placeholder,
    onFocus,
    onBlur,
    ...props
}: FloatingTextareaProps) {
    const [focused, setFocused] = useState(false);
    const hasValue =
        props.value !== undefined && props.value !== null && props.value !== '';

    return (
        <FloatingField label={label} floated={focused || hasValue} variant="textarea">
            <Textarea
                aria-label={label}
                className={className}
                onFocus={(event) => {
                    setFocused(true);
                    onFocus?.(event);
                }}
                onBlur={(event) => {
                    setFocused(false);
                    onBlur?.(event);
                }}
                {...props}
            />
        </FloatingField>
    );
}

interface FloatingSelectProps extends React.ComponentProps<typeof Select> {
    label: string;
    className?: string;
}

function FloatingSelect({
    label,
    className,
    open: openProp,
    onOpenChange: onOpenChangeProp,
    children,
    ...props
}: FloatingSelectProps) {
    const [open, setOpen] = useState(false);
    const isOpen = openProp ?? open;
    const hasValue =
        props.value !== undefined && props.value !== null && props.value !== '';

    return (
        <FloatingField label={label} floated={isOpen || hasValue} className={className}>
            <Select
                {...props}
                open={isOpen}
                onOpenChange={(next) => {
                    setOpen(next);
                    onOpenChangeProp?.(next);
                }}
            >
                {children}
            </Select>
        </FloatingField>
    );
}

interface FloatingDatePickerProps {
    label: string;
    value?: string;
    className?: string;
    trigger: React.ReactNode;
    children?: React.ReactNode;
}

function FloatingDatePicker({
    label,
    value,
    className,
    trigger,
    children,
}: FloatingDatePickerProps) {
    const [open, setOpen] = useState(false);

    return (
        <FloatingField
            label={label}
            floated={open || Boolean(value)}
            className={className}
        >
            <Popover open={open} onOpenChange={setOpen}>
                {trigger}
                <PopoverContent className="w-auto p-0" align="start">
                    {children}
                </PopoverContent>
            </Popover>
        </FloatingField>
    );
}

export {
    FloatingLabel,
    FloatingField,
    FloatingInput,
    FloatingTextarea,
    FloatingSelect,
    FloatingDatePicker,
};