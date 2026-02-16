import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useRef, useState, useEffect } from 'react';

export default function Viewer({ auth, document: docData, pageCount }) {
    const viewerRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isWindowFocused, setIsWindowFocused] = useState(true);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [currentPage, setCurrentPage] = useState(1);
    const [inputPage, setInputPage] = useState('1');
    const [showControls, setShowControls] = useState(true);

    const [viewMode, setViewMode] = useState('scroll'); // 'scroll', 'fit', 'spread'
    const pageRefs = useRef({});
    const scrollContainerRef = useRef(null);

    const getPageGroups = () => {
        const pages = Array.from({ length: pageCount || 0 }, (_, i) => i + 1);
        if (viewMode !== 'spread') return pages.map(p => [p]);

        const groups = [];
        // Typically newspaper archives start with Page 1 as a single cover
        groups.push([1]);
        for (let i = 1; i < pages.length; i += 2) {
            const pair = [pages[i]];
            if (pages[i + 1]) pair.push(pages[i + 1]);
            groups.push(pair);
        }
        return groups;
    };

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        let timeout;
        const handleMouseMove = () => {
            setShowControls(true);
            clearTimeout(timeout);
            timeout = setTimeout(() => setShowControls(false), 3000);
        };

        if (isFullscreen) {
            window.addEventListener('mousemove', handleMouseMove);
        } else {
            setShowControls(true);
        }

        // Intersection Observer for scroll tracking
        const observerOptions = {
            root: scrollContainerRef.current,
            threshold: 0.5,
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const pageNum = parseInt(entry.target.getAttribute('data-page'));
                    setCurrentPage(pageNum);
                    setInputPage(pageNum.toString());
                }
            });
        }, observerOptions);

        // Observe all page elements
        const currentRefs = pageRefs.current;
        Object.values(currentRefs).forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('mousemove', handleMouseMove);
            Object.values(currentRefs).forEach((ref) => {
                if (ref) observer.unobserve(ref);
            });
        };
    }, [isFullscreen, pageCount]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            viewerRef.current.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const goToPage = (page, forcedMode = null) => {
        if (forcedMode) setViewMode(forcedMode);

        const pageNum = Math.max(1, Math.min(page, pageCount || 1));

        // Wait for potential re-render if mode changed
        setTimeout(() => {
            const targetElement = pageRefs.current[pageNum];
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, forcedMode ? 50 : 0);

        setCurrentPage(pageNum);
        setInputPage(pageNum.toString());
    };

    const nextPage = () => goToPage(currentPage + 1);
    const prevPage = () => goToPage(currentPage - 1);

    const handleInputConfirm = (e) => {
        if (e.key === 'Enter') {
            goToPage(parseInt(inputPage) || 1);
        }
    };

    const handleInputBlur = () => {
        const val = parseInt(inputPage);
        if (!isNaN(val) && val !== currentPage) {
            goToPage(val);
        }
    };

    useEffect(() => {
        // Anti-screenshot: Blur on focus loss
        const handleBlur = () => setIsWindowFocused(false);
        const handleFocus = () => setIsWindowFocused(true);
        const handleVisibility = () => {
            setIsWindowFocused(!document.hidden);
        };

        const handleKeydown = (e) => {
            // Intercept common screenshot and DevTools shortcuts
            const isPrtScn = e.key === 'PrintScreen';
            const isMacShot = e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5');
            const isWinShot = e.shiftKey && e.metaKey && e.key === 'S';
            const isDevTools = (e.ctrlKey && e.shiftKey && e.key === 'I') || e.key === 'F12';
            const isCopy = (e.ctrlKey || e.metaKey) && e.key === 'c';

            if (isPrtScn || isMacShot || isWinShot || isDevTools || isCopy) {
                if (isCopy) {
                    e.preventDefault();
                    return;
                }

                // For screenshots, we immediately blur and show a warning
                setIsWindowFocused(false);
                setTimeout(() => {
                    alert('Screenshots and snipping are restricted on this platform to protect intellectual property.');
                }, 100);
            }
        };

        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);
        document.addEventListener("visibilitychange", handleVisibility);
        window.addEventListener('keydown', handleKeydown);

        // Intercept fullscreen changes
        const handleFsChange = () => {
            setIsFullscreen(!!window.document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFsChange);

        return () => {
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener("visibilitychange", handleVisibility);
            window.removeEventListener('keydown', handleKeydown);
            document.removeEventListener('fullscreenchange', handleFsChange);
        };
    }, []);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex flex-wrap items-center justify-between gap-y-2 w-full">
                    <div className="flex items-center gap-4 min-w-[200px] flex-1">
                        <Link
                            href={route('documents.library')}
                            className="bg-gray-200 dark:bg-gray-700 p-2 rounded-full hover:bg-gray-300 transition shrink-0"
                            title="Back to Library"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </Link>
                        <span className="font-semibold text-lg sm:text-xl text-gray-800 dark:text-gray-200 leading-tight truncate">
                            {docData.title}
                        </span>
                    </div>

                    <div className="flex justify-center order-3 sm:order-2 w-full sm:w-auto">
                        <button
                            onClick={toggleFullscreen}
                            className="flex items-center justify-center gap-2 px-3 py-1.5 border border-black/10 text-[10px] font-black uppercase tracking-[0.2em] rounded-md hover:bg-[#1a1a1a] hover:text-white transition-all shadow-sm bg-white whitespace-nowrap w-full sm:w-auto"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isFullscreen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 9L4 4m0 0l5 0m-5 4l0-4m11 5l5-5m0 0l-5 0m5 4l0-4m-11 11l-5 5m0 0l5 0m-5-4l0 5m11-5l5 5m0 0l-5 0m5-4l0 5" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                )}
                            </svg>
                            {isFullscreen ? 'Exit Fullscreen' : 'Maximize Reader'}
                        </button>
                    </div>

                    <div className="flex justify-end order-2 sm:order-3">
                        {isOffline && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-amber-200">
                                Offline
                            </span>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`Reading ${docData.title}`} />

            <div className={`py-6 no-print ${isFullscreen ? 'h-screen p-0 m-0 fixed inset-0 z-[100] bg-black' : 'h-[calc(100vh-160px)]'}`} ref={viewerRef}>
                <style>{`
                    @media print {
                        body { display: none !important; }
                        .no-print { display: none !important; }
                    }
                    /* Prevent selection */
                    body {
                        user-select: none;
                        -webkit-user-select: none;
                        -moz-user-select: none;
                        -ms-user-select: none;
                    }
                    /* Hide scrollbar but keep functionality */
                    .hide-scrollbar::-webkit-scrollbar {
                        display: none;
                    }
                    .hide-scrollbar {
                        -ms-overflow-style: none;
                        scrollbar-width: none;
                    }
                `}</style>
                <div
                    className={`${isFullscreen ? 'w-full h-full p-0' : 'max-w-7xl mx-auto sm:px-6 lg:px-8 h-full'} relative transition-all duration-300 ${!isWindowFocused ? 'blur-2xl' : ''}`}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    {!isWindowFocused && (
                        <div className="absolute inset-0 z-[110] flex items-center justify-center bg-black bg-opacity-50">
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl text-center border-2 border-indigo-500 max-w-md mx-4">
                                <svg className="w-16 h-16 mx-auto text-indigo-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight mb-2">Protected Mode</h3>
                                <p className="text-gray-600 dark:text-gray-400 font-bold italic">
                                    Content is hidden while window is out of focus to prevent unauthorized screenshots.
                                </p>
                                <p className="mt-4 text-indigo-600 dark:text-indigo-400 font-bold animate-pulse">
                                    Click here to resume reading
                                </p>
                            </div>
                        </div>
                    )}
                    <div className={`bg-white dark:bg-gray-900 overflow-hidden shadow-xl h-full border border-gray-200 dark:border-gray-700 relative ${isFullscreen ? 'rounded-none border-none' : 'sm:rounded-lg'}`}>
                        {/* Scrollable Container */}
                        <div
                            ref={scrollContainerRef}
                            className={`w-full h-full overflow-y-auto overflow-x-hidden ${viewMode !== 'scroll' ? 'snap-y snap-always' : 'snap-y snap-proximity'} scroll-smooth bg-gray-800 hide-scrollbar`}
                        >
                            {getPageGroups().map((group, idx) => (
                                <div
                                    key={idx}
                                    className={`w-full flex justify-center bg-gray-800 snap-start pt-2 ${viewMode !== 'scroll' ? 'h-full items-start' : 'mb-4'}`}
                                >
                                    <div className={`flex gap-1 items-start ${viewMode === 'spread' ? 'max-w-[98%] h-[95%] w-full justify-center' : 'h-[95%] w-auto'}`}>
                                        {group.map((pageNum) => (
                                            <div
                                                key={pageNum}
                                                ref={el => pageRefs.current[pageNum] = el}
                                                data-page={pageNum}
                                                onClick={() => goToPage(pageNum, 'scroll')}
                                                className={`relative shadow-2xl cursor-pointer group/page ${(viewMode === 'fit' || viewMode === 'spread') ? 'h-full w-auto' :
                                                    'max-w-[95vw] lg:max-w-4xl w-full'
                                                    }`}
                                            >
                                                <img
                                                    src={route('documents.page', { document: docData.id, page: pageNum })}
                                                    alt={`Page ${pageNum}`}
                                                    className={`${(viewMode === 'fit' || viewMode === 'spread') ? 'h-full w-auto object-contain' : 'w-full h-auto'} pointer-events-none rounded-sm bg-white transition-all duration-500 group-hover/page:ring-4 group-hover/page:ring-[#be1e2d]/20`}
                                                    loading={pageNum <= 3 ? "eager" : "lazy"}
                                                />
                                                <div className="absolute top-2 right-2 flex gap-2 items-center pointer-events-none">
                                                    <div className="bg-black/30 text-white text-[8px] px-2 py-0.5 rounded backdrop-blur-sm opacity-0 group-hover/page:opacity-100 transition-opacity">
                                                        {viewMode === 'scroll' ? 'Next Page' : 'Click to Zoom'}
                                                    </div>
                                                    <div className="bg-black/30 text-white text-[8px] px-2 py-0.5 rounded backdrop-blur-sm">
                                                        {pageNum}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {pageCount === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-white p-10 text-center">
                                    <svg className="animate-spin h-10 w-10 mb-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <p className="font-bold">Preparing Digital Archive...</p>
                                </div>
                            )}
                        </div>

                        {/* Floating Navigation Controls */}
                        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-nowrap items-center gap-2 sm:gap-4 px-3 sm:px-5 py-2 bg-black/70 backdrop-blur-md rounded-full border border-white/20 transition-all duration-500 max-w-[95vw] overflow-x-auto hide-scrollbar ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                            <button
                                onClick={prevPage}
                                className="p-1.5 hover:bg-white/10 rounded-full transition text-white disabled:opacity-30 shrink-0"
                                disabled={currentPage <= 1}
                                title="Previous Page"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>

                            <div className="flex items-center gap-1 sm:gap-2 text-white font-black uppercase tracking-widest text-[8px] sm:text-[10px] px-2 sm:px-3 border-x border-white/10 shrink-0">
                                <span className="opacity-60 hidden xs:inline">Page</span>
                                <input
                                    type="number"
                                    value={inputPage}
                                    onChange={(e) => setInputPage(e.target.value)}
                                    onKeyDown={handleInputConfirm}
                                    onBlur={handleInputBlur}
                                    className="w-8 sm:w-10 bg-white/10 border-none p-0.5 text-center focus:ring-1 focus:ring-[#be1e2d] text-white font-black rounded text-[10px] sm:text-xs"
                                    min="1"
                                    max={pageCount}
                                />
                                <span className="opacity-60">/ {pageCount || '?'}</span>
                            </div>

                            <button
                                onClick={nextPage}
                                className="p-1.5 hover:bg-white/10 rounded-full transition text-white disabled:opacity-30 shrink-0"
                                disabled={currentPage >= pageCount}
                                title="Next Page"
                            >
                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>

                            {/* View Mode Selector */}
                            <div className="hidden sm:flex items-center bg-white/10 rounded-lg p-1 border border-white/10 shrink-0">
                                <button
                                    onClick={() => setViewMode('scroll')}
                                    className={`p-1 sm:p-1.5 rounded-md transition-all ${viewMode === 'scroll' ? 'bg-[#be1e2d] text-white' : 'text-white/40 hover:text-white'}`}
                                    title="Infinite Scroll"
                                >
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setViewMode('fit')}
                                    className={`p-1 sm:p-1.5 rounded-md transition-all ${viewMode === 'fit' ? 'bg-[#be1e2d] text-white' : 'text-white/40 hover:text-white'}`}
                                    title="Single Page"
                                >
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setViewMode('spread')}
                                    className={`p-1 sm:p-1.5 rounded-md transition-all ${viewMode === 'spread' ? 'bg-[#be1e2d] text-white' : 'text-white/40 hover:text-white'}`}
                                    title="2-Page Spread"
                                >
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </button>
                            </div>

                            {isFullscreen && (
                                <button
                                    onClick={toggleFullscreen}
                                    className="p-1 sm:p-1.5 bg-red-600 hover:bg-red-700 rounded-full transition text-white shadow-lg shrink-0"
                                    title="Exit Fullscreen"
                                >
                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
