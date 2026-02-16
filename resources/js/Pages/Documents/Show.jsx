import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import ActivationModal from '@/Components/ActivationModal';

export default function Show({ auth, document, isPurchased }) {
    const [isRedeeming, setIsRedeeming] = useState(false);
    const [purchasedState, setPurchasedState] = useState(isPurchased);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<span className="font-black italic uppercase tracking-tighter">{document.title}</span>}
        >
            <Head title={document.title} />

            <div className="py-12 bg-[#f4f1ea] min-h-screen">
                <div className="max-w-6xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white/40 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-[3rem] overflow-hidden">
                        <div className="p-8 md:p-16">
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-16 items-center">
                                {/* Newspaper Preview Image */}
                                <div className="md:col-span-2">
                                    <div className="group relative aspect-[3/4] bg-[#1a1a1a] rounded-[2rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] overflow-hidden transform transition-all duration-700 hover:scale-[1.02] hover:-rotate-1 border-4 border-white/20">
                                        {document.thumbnail_path ? (
                                            <img
                                                src={`/storage/${document.thumbnail_path}`}
                                                alt={document.title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-white/20 p-8 text-center bg-gradient-to-br from-gray-800 to-black">
                                                <svg className="w-24 h-24 mb-6 opacity-20" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6H7a1 1 0 100 2h6a1 1 0 100-2H7z" />
                                                </svg>
                                                <span className="text-[10px] uppercase font-black tracking-[0.3em] opacity-40 italic">Cover Pending Archive</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="absolute top-6 left-6 bg-[#be1e2d] text-white px-5 py-2 text-xs font-black uppercase tracking-tighter rounded-full shadow-lg">
                                            Digital Edition
                                        </div>
                                    </div>
                                </div>

                                {/* Content Details */}
                                <div className="md:col-span-3 space-y-8">
                                    <div>
                                        <span className="bg-[#ffde00] text-black px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-6 inline-block">Official Edition</span>
                                        <h3 className="text-5xl md:text-7xl font-black text-[#1a1a1a] uppercase tracking-tighter leading-[0.9] italic font-sans mb-8">{document.title}</h3>
                                        <p className="text-gray-800 text-2xl font-sans italic border-l-8 border-[#be1e2d] pl-10 py-2 leading-relaxed">
                                            {document.description || 'Access this high-fidelity digital edition of our newsletter. Features full-page scans and optimized reading experience for all devices.'}
                                        </p>
                                    </div>

                                    <div className="pt-10 space-y-6">
                                        {purchasedState ? (
                                            <div className="bg-green-50/50 border border-green-100 p-8 rounded-[2rem] space-y-6">
                                                <div className="flex items-center gap-4 text-green-700">
                                                    <div className="p-2 bg-green-100 rounded-lg">
                                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                                    </div>
                                                    <span className="text-lg font-black uppercase tracking-tight italic">Successfully Activated!</span>
                                                </div>
                                                <Link
                                                    href={route('documents.reader', document.id)}
                                                    className="block w-full text-center px-10 py-6 bg-[#1a1a1a] text-[#ffde00] font-black rounded-2xl shadow-2xl hover:bg-[#be1e2d] hover:text-white hover:scale-[1.02] transition-all uppercase tracking-widest text-lg"
                                                >
                                                    Open Document Reader
                                                </Link>




                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                <div className="flex items-end justify-between border-b-2 border-black/5 pb-8">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Single Edition Price</span>
                                                        <span className="text-6xl font-black text-[#be1e2d] italic tracking-tighter font-sans">${document.price}</span>
                                                    </div>
                                                    <button
                                                        onClick={() => window.alert('This would integrate with a real payment gateway in production.')}
                                                        className="px-10 py-5 bg-[#be1e2d] text-white font-black rounded-2xl shadow-2xl shadow-red-500/20 hover:bg-black hover:shadow-black/20 transition-all uppercase tracking-widest text-sm"
                                                    >
                                                        Pay Online
                                                    </button>
                                                </div>

                                                <div className="flex flex-col sm:flex-row items-center gap-4 text-gray-400">
                                                    <div className="h-[1px] flex-1 bg-black/5"></div>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Or use activation code</span>
                                                    <div className="h-[1px] flex-1 bg-black/5"></div>
                                                </div>

                                                <button
                                                    onClick={() => setIsRedeeming(true)}
                                                    className="w-full py-6 bg-white border-2 border-black/10 text-black font-black rounded-2xl hover:border-[#be1e2d] hover:text-[#be1e2d] hover:bg-[#be1e2d]/5 transition-all uppercase tracking-widest text-sm active:scale-95"
                                                >
                                                    Redeem Activation Code
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-8 flex items-center justify-between text-gray-500">
                                        <div className="flex gap-4">
                                            {['PDF', 'High-Res', 'Secure'].map(tag => (
                                                <span key={tag} className="text-[9px] font-black uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">{tag}</span>
                                            ))}
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Archived 2026</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ActivationModal
                isOpen={isRedeeming}
                onClose={() => setIsRedeeming(false)}
                onActivated={() => {
                    setPurchasedState(true);
                    // Reload to update the backend logic check
                    // router.reload(); // Option 1
                    window.location.reload(); // Option 2 (cleaner for state)
                }}
                documentId={document.id}
                documentTitle={document.title}
            />
        </AuthenticatedLayout>
    );
}
