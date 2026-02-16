import React, { useState, useEffect } from 'react';
import { getDeviceId } from '@/Utils/device';
import { router } from '@inertiajs/react';

export default function ActivationModal({ isOpen, onClose, onActivated, documentId = null, documentTitle = null }) {
    const [code, setCode] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleRedeem = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const device_id = getDeviceId();

        try {
            const response = await fetch('/redeem-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                },
                body: JSON.stringify({ code, device_id, document_id: documentId }),
            });

            const data = await response.json();

            if (response.ok) {
                onActivated();
                onClose();
            } else {
                setError(data.message || 'Failed to redeem code.');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-[#f4f1ea] w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-[#be1e2d] relative animate-in fade-in zoom-in duration-300">
                {/* Decorative header */}
                <div className="bg-[#be1e2d] px-8 py-6 text-white text-center">
                    <h2 className="text-3xl font-black uppercase tracking-tighter italic">
                        {documentId ? 'Unlock Edition' : 'Activate Device'}
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mt-1">
                        {documentTitle ? `Accessing: ${documentTitle}` : 'Te Uekera Digital Edition Access'}
                    </p>
                </div>

                <form onSubmit={handleRedeem} className="p-8 space-y-6">
                    <div>
                        <p className="text-sm font-serif italic text-gray-700 leading-relaxed mb-6">
                            {documentId
                                ? "Enter your single-use code to unlock this specific digital edition for this device."
                                : "Enter your single-use activation code to unlock this device for full digital access."
                            }
                        </p>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="ENTER CODE..."
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                className="w-full bg-white border-2 border-black/10 rounded-2xl p-6 font-mono font-black text-2xl tracking-[0.3em] text-center focus:ring-4 focus:ring-[#be1e2d]/20 focus:border-[#be1e2d] transition-all"
                                required
                            />
                        </div>
                        {error && (
                            <div className="mt-4 bg-red-100 border-l-4 border-red-500 p-4 text-red-700 text-xs font-black uppercase tracking-widest italic">
                                {error}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#1a1a1a] text-[#ffde00] py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-lg hover:bg-[#be1e2d] hover:text-white transition-all shadow-xl shadow-black/20 hover:shadow-[#be1e2d]/30 active:scale-95 disabled:opacity-50"
                    >
                        {loading ? 'Verifying...' : 'Unlock Now'}
                    </button>

                    <p className="text-[9px] text-center font-black uppercase tracking-widest text-gray-400">
                        Once activated, this device will have permanent access to the {documentId ? 'edition' : 'content'}. <br />
                        Codes are single-use only.
                    </p>
                </form>

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
        </div>
    );
}
