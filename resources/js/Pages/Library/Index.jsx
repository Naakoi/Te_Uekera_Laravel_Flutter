import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';

export default function Index({ auth, documents }) {
    const [offlineDocs, setOfflineDocs] = useState([]);
    const [caching, setCaching] = useState(null);
    const [isAppOffline, setIsAppOffline] = useState(!navigator.onLine);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'downloaded'
    const [sortBy, setSortBy] = useState('newest');
    const [isGridView, setIsGridView] = useState(true);

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

    const filteredDocuments = useMemo(() => {
        let filtered = documents.filter(doc => {
            const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());

            const isCached = offlineDocs.includes(doc.id);
            let matchesFilter = true;
            if (filterStatus === 'downloaded') {
                matchesFilter = isCached;
            }

            return matchesSearch && matchesFilter;
        });

        return filtered.sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
            if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
            if (sortBy === 'alphabetical') return a.title.localeCompare(b.title);
            return 0;
        });
    }, [documents, searchQuery, filterStatus, sortBy, offlineDocs]);

    const saveForOffline = (e, doc) => {
        e.preventDefault();
        e.stopPropagation();
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
            header="My Digital Library"
        >
            <Head title="My Library" />

            <div className="pb-24 pt-6 md:pt-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Library Header */}
                    <div className="mb-8 md:mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-center md:text-left">
                            <span className="inline-block bg-[#1a1a1a] text-white px-5 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-lg">Purchased Collection</span>
                            <h2 className="mt-4 text-4xl md:text-6xl font-black text-[#1a1a1a] uppercase tracking-tighter italic font-display leading-none">My Library</h2>
                        </div>

                        {isAppOffline && (
                            <div className="flex items-center gap-3 px-6 py-3 bg-[#be1e2d] text-white rounded-2xl shadow-xl shadow-red-500/20 animate-pulse">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                                <span className="text-xs font-black uppercase tracking-widest">Offline Mode Active</span>
                            </div>
                        )}
                    </div>

                    {/* Search and Controls */}
                    <div className="bg-white/50 backdrop-blur-xl border border-white/60 p-4 md:p-6 rounded-[2rem] shadow-xl mb-8 md:mb-12">
                        <div className="flex flex-col lg:flex-row gap-6 items-center">
                            <div className="relative w-full lg:flex-1">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-[#be1e2d]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search your library..."
                                    className="block w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent focus:border-[#be1e2d] rounded-2xl shadow-sm font-sans font-bold text-gray-900 transition-all placeholder:text-gray-400 outline-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 w-full lg:w-auto">
                                <div className="flex bg-black/5 p-1 rounded-xl">
                                    {['all', 'downloaded'].map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setFilterStatus(f)}
                                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === f ? 'bg-white text-[#be1e2d] shadow-sm' : 'text-gray-500 hover:text-black'
                                                }`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>

                                <select
                                    className="bg-white border-2 border-transparent focus:border-[#be1e2d] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer shadow-sm"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="newest">Newest</option>
                                    <option value="oldest">Oldest</option>
                                    <option value="alphabetical">A-Z</option>
                                </select>

                                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-black/5">
                                    <button onClick={() => setIsGridView(true)} className={`p-2 rounded-lg ${isGridView ? 'bg-[#be1e2d]/10 text-[#be1e2d]' : 'text-gray-300'}`}>
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                    </button>
                                    <button onClick={() => setIsGridView(false)} className={`p-2 rounded-lg ${!isGridView ? 'bg-[#be1e2d]/10 text-[#be1e2d]' : 'text-gray-300'}`}>
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Collection View */}
                    {isGridView ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {filteredDocuments.map((doc) => {
                                const isCached = offlineDocs.includes(doc.id);
                                const isAvailable = !isAppOffline || isCached;

                                return (
                                    <div key={doc.id} className={`group bg-white/70 backdrop-blur-2xl border border-white/40 shadow-xl rounded-[2rem] overflow-hidden transition-all flex flex-col h-full ${!isAvailable ? 'opacity-40' : 'hover:-translate-y-2'}`}>
                                        <Link
                                            href={isAvailable ? route('documents.reader', doc.id) : '#'}
                                            className={`block aspect-[3/4] overflow-hidden bg-[#f4f1ea] relative ${!isAvailable ? 'cursor-not-allowed' : ''}`}
                                            onClick={(e) => !isAvailable && e.preventDefault()}
                                        >
                                            {doc.thumbnail_path ? (
                                                <img
                                                    src={`/storage/${doc.thumbnail_path}`}
                                                    alt={doc.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                    onError={(e) => {
                                                        const page1Url = route('documents.page', { document: doc.id, page: 1 });
                                                        if (e.target.src !== page1Url) {
                                                            e.target.src = page1Url;
                                                        } else {
                                                            e.target.onerror = null;
                                                            e.target.src = '/images/placeholder-cover.png';
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-black/10"><svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg></div>
                                            )}

                                            <div className="absolute top-4 right-4 md:top-6 md:right-6">
                                                {isCached ? (
                                                    <div className="bg-green-600 text-white p-2 rounded-full shadow-lg" title="Saved for Offline">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                    </div>
                                                ) : (
                                                    <div className="bg-amber-500/80 backdrop-blur-md text-white p-2 rounded-full shadow-lg" title="Cloud Access Only">
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" /></svg>
                                                    </div>
                                                )}
                                            </div>

                                            {!isAvailable && (
                                                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 text-center">
                                                    <span className="text-white text-[10px] font-black uppercase tracking-widest leading-relaxed">Please connect to internet to read</span>
                                                </div>
                                            )}
                                        </Link>

                                        <div className="p-6 md:p-8 flex-1 flex flex-col bg-white/30 border-t border-white/40">
                                            <h3 className="text-xl font-black text-[#1a1a1a] uppercase tracking-tighter italic font-display group-hover:text-[#be1e2d] transition-colors truncate">{doc.title}</h3>

                                            <div className="mt-6 flex flex-col gap-3">
                                                <Link
                                                    href={isAvailable ? route('documents.reader', doc.id) : '#'}
                                                    className={`w-full text-center py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-md ${isAvailable ? 'bg-[#1a1a1a] text-white hover:bg-[#be1e2d] active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                                    onClick={(e) => !isAvailable && e.preventDefault()}
                                                >
                                                    {isAvailable ? 'Read Now' : 'Offline'}
                                                </Link>

                                                {!isCached && !isAppOffline && (
                                                    <button
                                                        onClick={(e) => saveForOffline(e, doc)}
                                                        disabled={caching === doc.id}
                                                        className="w-full bg-[#ffde00] text-black py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-black hover:text-[#ffde00] transition-all active:scale-95 flex items-center justify-center gap-2"
                                                    >
                                                        {caching === doc.id ? '💾 Saving...' : '💾 Save Offline'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6 max-w-5xl mx-auto">
                            {filteredDocuments.map((doc) => {
                                const isCached = offlineDocs.includes(doc.id);
                                const isAvailable = !isAppOffline || isCached;

                                return (
                                    <Link
                                        key={doc.id}
                                        href={isAvailable ? route('documents.reader', doc.id) : '#'}
                                        onClick={(e) => !isAvailable && e.preventDefault()}
                                        className={`group bg-white/70 backdrop-blur-2xl border border-white/40 shadow-xl rounded-3xl overflow-hidden transition-all flex h-32 md:h-40 ${!isAvailable ? 'opacity-40 cursor-not-allowed' : 'hover:shadow-2xl'}`}
                                    >
                                        <div className="w-24 md:w-40 h-full bg-[#f4f1ea] relative shrink-0">
                                            {doc.thumbnail_path ? (
                                                <img
                                                    src={`/storage/${doc.thumbnail_path}`}
                                                    alt={doc.title}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        const page1Url = route('documents.page', { document: doc.id, page: 1 });
                                                        if (e.target.src !== page1Url) {
                                                            e.target.src = page1Url;
                                                        } else {
                                                            e.target.onerror = null;
                                                            e.target.src = '/images/placeholder-cover.png';
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-black/10"><svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg></div>
                                            )}
                                            {isCached && (
                                                <div className="absolute inset-0 bg-green-600/20 flex items-center justify-center">
                                                    <div className="bg-green-600 text-white p-1 rounded-full"><svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg></div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 p-5 md:p-8 flex items-center justify-between gap-6">
                                            <div className="min-w-0">
                                                <h3 className="text-lg md:text-2xl font-black text-[#1a1a1a] uppercase tracking-tighter italic font-display line-clamp-1 group-hover:text-[#be1e2d] transition-colors">{doc.title}</h3>
                                                <div className="mt-2 flex items-center gap-3">
                                                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400">Archived Collection</span>
                                                    {!isCached && isAppOffline && (
                                                        <span className="text-[8px] font-black uppercase text-[#be1e2d]">Requires Connection</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 md:gap-4 shrink-0">
                                                {!isCached && !isAppOffline && (
                                                    <button onClick={(e) => saveForOffline(e, doc)} disabled={caching === doc.id} className="p-3 bg-gray-100 rounded-xl hover:bg-[#ffde00] transition-all">
                                                        <svg className={`w-4 h-4 ${caching === doc.id ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                                    </button>
                                                )}
                                                <span className="p-3 bg-black text-white rounded-xl group-hover:bg-[#be1e2d] transition-all">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {documents.length === 0 && (
                        <div className="bg-white/40 backdrop-blur-xl border border-white/40 p-16 md:p-32 text-center rounded-[3rem] shadow-2xl">
                            <div className="w-24 h-24 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-8">
                                <svg className="w-12 h-12 text-black/10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            </div>
                            <h3 className="text-3xl md:text-5xl font-black text-black/10 uppercase tracking-tighter italic font-sans italic">Your Library is Empty</h3>
                            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-black/30 max-w-sm mx-auto leading-relaxed px-4">Unlock premium editions from our global archive to build your collection.</p>
                            <Link href={route('documents.index')} className="mt-12 inline-block px-12 py-5 bg-[#be1e2d] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-red-500/30 hover:-translate-y-1 active:scale-95 transition-all">Explore Newsstand</Link>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
