import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
    return (
        <img
            {...props}
            src="/images/coreDevlogo-CUQ-ORnY.png"
            alt="App Logo"
            className={`bg-transparent object-contain ${props.className ?? ''}`}
        />
    );
}