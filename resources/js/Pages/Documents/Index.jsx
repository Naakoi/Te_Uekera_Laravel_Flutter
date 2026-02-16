import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Index({ auth, documents }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header="Online Newsstand"
        >
            <Head title="Browse Newspapers" />

            <div className="pb-24">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-16 pb-8 border-b border-black/5 flex items-center justify-between">
                        <div>
                            <span className="bg-[#be1e2d] text-white px-5 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-lg shadow-red-500/20">Archive Library</span>
                            <h2 className="mt-4 text-5xl font-black text-[#1a1a1a] uppercase tracking-tighter italic font-sans">Available Editions</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12 px-2 md:px-0">
                        {documents.map((doc) => (
                            <div key={doc.id} className="group bg-white/70 backdrop-blur-2xl border border-white/40 shadow-xl hover:shadow-[0_32px_64px_-15px_rgba(0,0,0,0.2)] rounded-[2.5rem] overflow-hidden transition-all hover:-translate-y-2 flex flex-col h-full">
                                <Link href={route((auth.user.role === 'staff' || auth.user.role === 'admin') ? 'documents.reader' : 'documents.show', doc.id)} className="block aspect-[3/4] overflow-hidden bg-[#f4f1ea] relative">
                                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition duration-500"></div>
                                    {doc.thumbnail_path ? (
                                        <img
                                            src={`/storage/${doc.thumbnail_path}`}
                                            alt={doc.title}
                                            className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-black/20 p-8 text-center">
                                            <svg className="w-24 h-24 mb-6 transition-transform group-hover:rotate-12 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-[10px] uppercase font-black tracking-[0.3em]">Cover Pending Archive</span>
                                        </div>
                                    )}
                                    <div className="absolute top-6 left-6 bg-[#be1e2d] text-white px-5 py-2 text-xs font-black uppercase tracking-tighter rounded-full shadow-lg shadow-red-900/40">
                                        ${doc.price}
                                    </div>
                                </Link>
                                <div className="p-10 flex-1 flex flex-col bg-white/30 backdrop-blur-sm border-t border-white/40">
                                    <h3 className="text-3xl font-black text-[#1a1a1a] uppercase tracking-tighter leading-none italic mb-6 font-sans group-hover:text-[#be1e2d] transition-colors">{doc.title}</h3>
                                    <p className="text-gray-800 text-lg font-sans italic line-clamp-3 mb-8 border-l-8 border-[#ffde00] pl-8">
                                        {doc.description || 'Access this edition through our secure digital portal. High-quality scans of all original pages.'}
                                    </p>
                                    <div className="mt-auto pt-8 border-t border-black/5 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-30 italic">Digital Archive</span>
                                        <Link
                                            href={route((auth.user.role === 'staff' || auth.user.role === 'admin' || doc.has_access) ? 'documents.reader' : 'documents.show', doc.id)}
                                            className="px-8 py-3 bg-[#1a1a1a] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-[#be1e2d] hover:shadow-xl hover:shadow-red-500/30 transition-all active:scale-95"
                                        >
                                            {(auth.user.role === 'staff' || auth.user.role === 'admin' || doc.has_access) ? 'Read Now' : 'Unlock Edition'}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {documents.length === 0 && (
                            <div className="col-span-full py-32 bg-white/40 backdrop-blur-xl border border-white/40 rounded-[3rem] text-center shadow-2xl">
                                <div className="w-24 h-24 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-8">
                                    <svg className="w-12 h-12 text-black/10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                                </div>
                                <h4 className="text-3xl font-black uppercase tracking-tighter italic text-black/20 font-sans">Archive Unavailable</h4>
                                <p className="mt-4 text-xs font-black uppercase tracking-[0.2em] text-black/30 max-w-md mx-auto">Our editorial team is updating the digital collection. Please check back soon.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
