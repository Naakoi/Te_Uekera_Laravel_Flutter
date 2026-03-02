import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState, useMemo } from 'react';

export default function Index({ auth, documents }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'purchased', 'available'
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'alphabetical'
    const [isGridView, setIsGridView] = useState(true);

    const filteredDocuments = useMemo(() => {
        let filtered = documents.filter(doc => {
            const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()));

            let matchesFilter = true;
            if (filterStatus === 'purchased') {
                matchesFilter = doc.has_access;
            } else if (filterStatus === 'available') {
                matchesFilter = !doc.has_access;
            }

            return matchesSearch && matchesFilter;
        });

        // Sort
        return filtered.sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.created_at) - new Date(a.created_at);
            } else if (sortBy === 'oldest') {
                return new Date(a.created_at) - new Date(b.created_at);
            } else if (sortBy === 'alphabetical') {
                return a.title.localeCompare(b.title);
            } else if (sortBy === 'price-low') {
                return parseFloat(a.price) - parseFloat(b.price);
            } else if (sortBy === 'price-high') {
                return parseFloat(b.price) - parseFloat(a.price);
            }
            return 0;
        });
    }, [documents, searchQuery, filterStatus, sortBy]);

    const isNew = (doc) => {
        const publishedDate = new Date(doc.created_at);
        const now = new Date();
        const diffDays = Math.ceil((now - publishedDate) / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header="Online Newsstand"
        >
            <Head title="Browse Newspapers" />

            <div className="pb-24 pt-6 md:pt-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Shop Header */}
                    <div className="mb-8 md:mb-12">
                        <span className="inline-block bg-[#be1e2d] text-white px-5 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-lg shadow-red-500/20">Archive Library</span>
                        <h2 className="mt-4 text-4xl md:text-6xl font-black text-[#1a1a1a] uppercase tracking-tighter italic font-sans leading-none">Available Editions</h2>
                    </div>

                    {/* Search and Controls */}
                    <div className="bg-white/50 backdrop-blur-xl border border-white/60 p-4 md:p-6 rounded-[2rem] shadow-xl mb-8 md:mb-12">
                        <div className="flex flex-col lg:flex-row gap-6 items-center">
                            {/* Search Bar */}
                            <div className="relative w-full lg:flex-1">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-[#be1e2d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search for editions..."
                                    className="block w-full pl-12 pr-4 py-4 bg-white border-2 border-transparent focus:border-[#be1e2d] rounded-2xl shadow-sm font-sans font-bold text-gray-900 transition-all placeholder:text-gray-400 placeholder:font-normal outline-none"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-black transition-colors"
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {/* Filters & Sorts Toolbar */}
                            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 w-full lg:w-auto">
                                {/* Filter Group */}
                                <div className="flex bg-black/5 p-1 rounded-xl">
                                    {['all', 'purchased', 'available'].map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setFilterStatus(f)}
                                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === f
                                                ? 'bg-white text-[#be1e2d] shadow-sm'
                                                : 'text-gray-500 hover:text-black'
                                                }`}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>

                                <div className="h-6 w-px bg-black/10 mx-1 hidden sm:block"></div>

                                {/* Sort Options */}
                                <select
                                    className="bg-white border-2 border-transparent focus:border-[#be1e2d] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none transition-all cursor-pointer shadow-sm"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="alphabetical">Title (A-Z)</option>
                                    <option value="price-low">Price: Low to High</option>
                                    <option value="price-high">Price: High to Low</option>
                                </select>

                                {/* View Toggle */}
                                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-black/5">
                                    <button
                                        onClick={() => setIsGridView(true)}
                                        className={`p-2 rounded-lg transition-all ${isGridView ? 'bg-[#be1e2d]/10 text-[#be1e2d]' : 'text-gray-300 hover:text-gray-600'}`}
                                        title="Grid View"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setIsGridView(false)}
                                        className={`p-2 rounded-lg transition-all ${!isGridView ? 'bg-[#be1e2d]/10 text-[#be1e2d]' : 'text-gray-300 hover:text-gray-600'}`}
                                        title="List View"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between px-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                {filteredDocuments.length} Result{filteredDocuments.length !== 1 ? 's' : ''} Found
                            </span>
                        </div>
                    </div>

                    {/* Documents View */}
                    {isGridView ? (
                        /* GRID VIEW */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12 px-2 md:px-0">
                            {filteredDocuments.map((doc) => (
                                <div key={doc.id} className="group bg-white/70 backdrop-blur-2xl border border-white/40 shadow-xl hover:shadow-[0_32px_64px_-15px_rgba(0,0,0,0.2)] rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden transition-all hover:-translate-y-2 flex flex-col h-full relative">
                                    <Link href={route((auth.user.role === 'staff' || auth.user.role === 'admin' || doc.has_access) ? 'documents.reader' : 'documents.show', doc.id)} className="block aspect-[3/4] overflow-hidden bg-[#f4f1ea] relative">
                                        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition duration-500"></div>
                                        <img
                                            src={doc.thumbnail_path ? `/storage/${doc.thumbnail_path}` : route('documents.page', { document: doc.id, page: 1 })}
                                            alt={doc.title}
                                            className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
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

                                        {/* Status Badges */}
                                        <div className="absolute top-4 left-4 md:top-6 md:left-6 flex flex-col gap-2">
                                            <div className={`${doc.has_access ? 'bg-green-600' : 'bg-[#be1e2d]'} text-white px-4 md:px-5 py-1.5 md:py-2 text-[10px] md:text-xs font-black uppercase tracking-tighter rounded-full shadow-lg shadow-black/20`}>
                                                {doc.has_access ? 'Purchased' : `$${doc.price}`}
                                            </div>
                                            {isNew(doc) && (
                                                <div className="bg-blue-600 text-white px-3 md:px-4 py-1 text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-black/10 self-start animate-pulse">
                                                    NEW RELEASE
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                    <div className="p-6 md:p-10 flex-1 flex flex-col bg-white/30 backdrop-blur-sm border-t border-white/40">
                                        <h3 className="text-xl md:text-3xl font-black text-[#1a1a1a] uppercase tracking-tighter leading-none italic mb-4 md:mb-6 font-sans group-hover:text-[#be1e2d] transition-colors line-clamp-2">{doc.title}</h3>
                                        <p className="text-gray-800 text-sm md:text-lg font-sans italic line-clamp-3 mb-6 md:mb-8 border-l-4 md:border-l-8 border-[#ffde00] pl-4 md:pl-8">
                                            {doc.description || 'Access this edition through our secure digital portal. High-quality scans of all original pages.'}
                                        </p>
                                        <div className="mt-auto pt-6 md:pt-8 border-t border-black/5 flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 italic">Digital Archive</span>
                                            <Link
                                                href={route((auth.user.role === 'staff' || auth.user.role === 'admin' || doc.has_access) ? 'documents.reader' : 'documents.show', doc.id)}
                                                className="px-6 md:px-8 py-2 md:py-3 bg-[#1a1a1a] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-[#be1e2d] hover:shadow-xl hover:shadow-red-500/30 transition-all active:scale-95"
                                            >
                                                {(auth.user.role === 'staff' || auth.user.role === 'admin' || doc.has_access) ? 'Read Now' : 'Unlock Edition'}
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* LIST VIEW */
                        <div className="flex flex-col gap-6 max-w-5xl mx-auto px-2">
                            {filteredDocuments.map((doc) => (
                                <Link
                                    key={doc.id}
                                    href={route((auth.user.role === 'staff' || auth.user.role === 'admin' || doc.has_access) ? 'documents.reader' : 'documents.show', doc.id)}
                                    className="group bg-white/70 backdrop-blur-2xl border border-white/40 shadow-xl hover:shadow-2xl rounded-3xl overflow-hidden transition-all flex h-40 md:h-52"
                                >
                                    <div className="w-32 md:w-52 h-full relative overflow-hidden bg-[#f4f1ea] shrink-0">
                                        <img
                                            src={doc.thumbnail_path ? `/storage/${doc.thumbnail_path}` : route('documents.page', { document: doc.id, page: 1 })}
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
                                        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition duration-500"></div>
                                    </div>
                                    <div className="flex-1 p-5 md:p-8 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <h3 className="text-lg md:text-3xl font-black text-[#1a1a1a] uppercase tracking-tighter italic font-sans leading-none group-hover:text-[#be1e2d] transition-colors line-clamp-1">{doc.title}</h3>
                                                <div className={`${doc.has_access ? 'text-green-600' : 'text-[#be1e2d]'} text-[10px] md:text-xs font-black uppercase tracking-widest shrink-0 mt-1`}>
                                                    {doc.has_access ? 'Purchased' : `$${doc.price}`}
                                                </div>
                                            </div>
                                            <p className="text-gray-600 text-[10px] md:text-base font-sans italic line-clamp-2 md:line-clamp-3 mb-4">
                                                {doc.description || 'Access this edition through our secure digital portal.'}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between gap-4 pt-4 border-t border-black/5">
                                            <div className="flex items-center gap-2">
                                                {isNew(doc) && (
                                                    <span className="bg-blue-600 text-white px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-full">New</span>
                                                )}
                                                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] opacity-30 italic">Digital Newsstand Edition</span>
                                            </div>
                                            <span className="text-[#be1e2d] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                Open Reader
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {filteredDocuments.length === 0 && (
                        <div className="col-span-full py-32 bg-white/40 backdrop-blur-xl border border-white/40 rounded-[3rem] text-center shadow-2xl mx-2 md:mx-0">
                            <div className="w-24 h-24 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-8">
                                <svg className="w-12 h-12 text-black/10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <h4 className="text-3xl font-black uppercase tracking-tighter italic text-black/10 font-sans">No Editions Found</h4>
                            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-black/30 max-w-xs md:max-w-md mx-auto leading-relaxed px-4">
                                {searchQuery ? `No results for "${searchQuery}" in this category.` : 'We couldn\'t find any editions matching your filters.'}
                            </p>
                            {(searchQuery || filterStatus !== 'all') && (
                                <button
                                    onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}
                                    className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-[#be1e2d] hover:underline"
                                >
                                    Clear all filters
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
