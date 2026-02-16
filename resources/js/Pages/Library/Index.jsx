import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Index({ auth, documents }) {
    const [offlineDocs, setOfflineDocs] = useState([]);
    const [caching, setCaching] = useState(null);
    const [isAppOffline, setIsAppOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsAppOffline(false);
        const handleOffline = () => setIsAppOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check which docs are cached in Cache API
        if ('caches' in window) {
            caches.open('newspaper-library').then(cache => {
                cache.keys().then(keys => {
                    const cachedUrls = keys.map(request => request.url);
                    const cachedIds = documents
                        .filter(doc => cachedUrls.some(url => url.includes(`/documents/${doc.id}/page/1`)))
                        .map(doc => doc.id);
                    setOfflineDocs(cachedIds);
                });
            });
        }

        const handleMessage = (event) => {
            if (event.data.type === 'CACHE_SUCCESS') {
                const docId = event.data.docId;
                setOfflineDocs(prev => [...prev, docId]);
                setCaching(null);
            } else if (event.data.type === 'CACHE_ERROR') {
                alert('Failed to save for offline viewing. Please check your connection.');
                setCaching(null);
            }
        };

        navigator.serviceWorker?.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            navigator.serviceWorker?.removeEventListener('message', handleMessage);
        };
    }, [documents]);

    const saveForOffline = (doc) => {
        if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
            alert('Offline features are not supported in this browser or pending activation.');
            return;
        }

        setCaching(doc.id);

        navigator.serviceWorker.controller.postMessage({
            type: 'CACHE_IMAGES',
            docId: doc.id,
            pageCount: doc.page_count
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex items-center justify-between">
                    <span className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">
                        My Digital Library
                    </span>
                    {isAppOffline && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400 text-xs font-black uppercase tracking-widest rounded-full border border-amber-200 dark:border-amber-800">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                            Offline Mode
                        </div>
                    )}
                </div>
            }
        >
            <Head title="My Library" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Offline Banner */}
                    {isAppOffline && (
                        <div className="mb-8 bg-indigo-600 rounded-xl p-6 text-white shadow-xl flex items-center gap-6">
                            <div className="bg-white/20 p-3 rounded-full">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight">Offline Reading Enabled</h3>
                                <p className="opacity-90 font-medium">You can still read any newspapers marked with a green checkmark below.</p>
                            </div>
                        </div>
                    )}

                    {documents.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {documents.map((doc) => {
                                const isCached = offlineDocs.includes(doc.id);
                                const isAvailable = !isAppOffline || isCached;

                                return (
                                    <div key={doc.id} className={`bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col group transition-all duration-300 ${!isAvailable ? 'opacity-60 grayscale' : ''}`}>
                                        <Link
                                            href={isAvailable ? route('documents.reader', doc.id) : '#'}
                                            className={`block aspect-[3/4] overflow-hidden bg-gray-100 dark:bg-gray-700 relative ${!isAvailable ? 'cursor-not-allowed' : ''}`}
                                            onClick={(e) => !isAvailable && e.preventDefault()}
                                        >
                                            {doc.thumbnail_path ? (
                                                <img
                                                    src={`/storage/${doc.thumbnail_path}`}
                                                    alt={doc.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                                                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                            )}

                                            {isAvailable && (
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 flex items-center justify-center transition-all duration-300">
                                                    <span className="bg-white text-black px-4 py-2 rounded-full font-bold opacity-0 group-hover:opacity-100 shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                                                        Open Newspaper
                                                    </span>
                                                </div>
                                            )}

                                            {!isAvailable && (
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4 text-center">
                                                    <span className="text-white text-xs font-black uppercase tracking-widest bg-black/60 px-3 py-2 rounded-lg backdrop-blur-sm">
                                                        Not Available Offline
                                                    </span>
                                                </div>
                                            )}

                                            {isCached && (
                                                <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg" title="Available Offline">
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                                                    </svg>
                                                </div>
                                            )}
                                        </Link>
                                        <div className="p-4 flex-1 flex flex-col">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">{doc.title}</h3>

                                            <div className="mt-4 flex flex-col gap-2">
                                                <Link
                                                    href={isAvailable ? route('documents.reader', doc.id) : '#'}
                                                    className={`block w-full text-center px-4 py-2 rounded-md transition font-bold ${isAvailable ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
                                                    onClick={(e) => !isAvailable && e.preventDefault()}
                                                >
                                                    {isAvailable ? 'Read Now' : 'Offline'}
                                                </Link>

                                                {!isCached && !isAppOffline ? (
                                                    <button
                                                        onClick={() => saveForOffline(doc)}
                                                        disabled={caching === doc.id}
                                                        className="block w-full text-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-bold"
                                                    >
                                                        {caching === doc.id ? (
                                                            <span className="flex items-center justify-center gap-2">
                                                                <svg className="animate-spin h-4 w-4 text-indigo-500" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                </svg>
                                                                Saving...
                                                            </span>
                                                        ) : (
                                                            '💾 Save for Offline'
                                                        )}
                                                    </button>
                                                ) : isCached ? (
                                                    <div className="text-center py-2 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded">
                                                        ✓ Available in App Library
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 p-12 text-center rounded-lg shadow">
                            <svg className="w-20 h-20 mx-auto text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your Library is Empty</h3>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">Purchase a newspaper to see it here.</p>
                            <Link
                                href={route('documents.index')}
                                className="mt-8 inline-block px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-bold"
                            >
                                Browse Newspapers
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
