import React, { useEffect, useState } from 'react';
import config from '../config';

function Home() {
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    );
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const handleResize = () => {
                const isPortrait = window.innerHeight > window.innerWidth;
                setIsMobile(window.innerWidth <= 768 || isPortrait);
            };

            const debounce = (func, delay) => {
                let timer;
                return () => {
                    clearTimeout(timer);
                    timer = setTimeout(func, delay);
                };
            };

            const debouncedHandleResize = debounce(handleResize, 200);

            window.addEventListener('resize', debouncedHandleResize);
            window.addEventListener('orientationchange', handleResize);
            return () => {
                window.removeEventListener('resize', debouncedHandleResize);
                window.removeEventListener('orientationchange', handleResize);
            };
        }
    }, []);

    return (
        <div>
            {isMobile ? (
                <spline-viewer key="mobile" loading-anim-type="spinner-big-light" url={config.splineUrls.mobile}/>
            ) : (
                <spline-viewer key="desktop" loading-anim-type="spinner-big-light" url={config.splineUrls.desktop}/>
            )}
        </div>
    );
}

export default Home;