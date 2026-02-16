import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import React, { useState } from 'react';

export default function RedeemCodes({ auth, codes, documents }) {
    const [selectedCodes, setSelectedCodes] = useState([]);
    const { data, setData, post, processing, errors, reset } = useForm({
        count: 10,
        document_id: '',
        duration_type: 'permanent',
    });

    const maskEmail = (email) => {
        if (!email) return 'N/A';
        const [local, domain] = email.split('@');
        if (local.length <= 2) return local + '***@' + domain;
        return local.substring(0, 2) + '*'.repeat(local.length - 2) + '@' + domain;
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.redeem_codes.generate'), {
            onSuccess: () => reset(),
        });
    };

    const deleteCode = (id) => {
        if (confirm('Are you sure you want to delete this code?')) {
            router.delete(route('admin.redeem_codes.delete', id));
        }
    };

    const toggleSelect = (id) => {
        setSelectedCodes(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedCodes.length === codes.data.length) {
            setSelectedCodes([]);
        } else {
            setSelectedCodes(codes.data.map(c => c.id));
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const selectedVouchers = codes.data.filter(c => selectedCodes.includes(c.id));

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-black text-3xl text-gray-800 leading-tight uppercase tracking-tighter">Activation Codes</h2>}
        >
            <Head title="Redeem Codes Management" />

            <style>{`
                @media screen {
                    .print-only { display: none; }
                }
                @media print {
                    @page { size: portrait; margin: 1cm; }
                    .screen-only { display: none !important; }
                    .print-only { 
                        display: block !important; 
                        background: white !important;
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 100% !important;
                        z-index: 9999 !important;
                    }
                    .voucher-grid {
                        display: grid !important;
                        grid-template-columns: repeat(2, 1fr) !important;
                        gap: 20px !important;
                        width: 100% !important;
                    }
                }
            `}</style>

            {/* Main Admin UI */}
            <div className="py-12 bg-[#f4f1ea] min-h-screen screen-only">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-8">
                    {/* Generator Section */}
                    <div className="bg-white/80 backdrop-blur-md overflow-hidden shadow-2xl sm:rounded-[2rem] border border-black/5 p-8">
                        <h3 className="text-xl font-black uppercase tracking-widest mb-6 text-[#be1e2d]">Generate New Codes</h3>
                        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Number of Codes</label>
                                <input
                                    type="number"
                                    value={data.count}
                                    onChange={(e) => setData('count', e.target.value)}
                                    className="w-full bg-[#f4f1ea] border-none rounded-xl focus:ring-2 focus:ring-[#be1e2d] font-bold text-lg p-4"
                                    min="1"
                                    max="100"
                                />
                                {errors.count && <div className="text-red-600 text-xs mt-1 font-bold italic">{errors.count}</div>}
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Duration</label>
                                <select
                                    value={data.duration_type}
                                    onChange={(e) => setData('duration_type', e.target.value)}
                                    className="w-full bg-[#f4f1ea] border-none rounded-xl focus:ring-2 focus:ring-[#be1e2d] font-bold text-lg p-4"
                                >
                                    <option value="permanent">Access: Permanent</option>
                                    <option value="weekly">Access: 1 Week</option>
                                    <option value="monthly">Access: 1 Month</option>
                                </select>
                                {errors.duration_type && <div className="text-red-600 text-xs mt-1 font-bold italic">{errors.duration_type}</div>}
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Scope (Optional Document)</label>
                                <select
                                    value={data.document_id}
                                    onChange={(e) => setData('document_id', e.target.value)}
                                    className="w-full bg-[#f4f1ea] border-none rounded-xl focus:ring-2 focus:ring-[#be1e2d] font-bold text-lg p-4"
                                >
                                    <option value="">Full Device Activation (All Access)</option>
                                    {documents.map((doc) => (
                                        <option key={doc.id} value={doc.id}>
                                            {doc.title}
                                        </option>
                                    ))}
                                </select>
                                {errors.document_id && <div className="text-red-600 text-xs mt-1 font-bold italic">{errors.document_id}</div>}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="px-10 py-5 bg-[#be1e2d] text-white font-black rounded-xl hover:bg-black transition-all shadow-xl shadow-red-500/20 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-sm h-[60px]"
                            >
                                {processing ? 'Generating...' : 'Generate Codes'}
                            </button>
                        </form>
                    </div>

                    {/* Codes List */}
                    <div className="bg-white/80 backdrop-blur-md overflow-hidden shadow-2xl sm:rounded-[3rem] border border-black/5">
                        <div className="p-10">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-black uppercase tracking-tighter italic text-gray-400">Inventory</h3>
                                {selectedCodes.length > 0 && (
                                    <button
                                        onClick={handlePrint}
                                        className="px-6 py-3 bg-[#1a1a1a] text-[#ffde00] font-black rounded-xl hover:bg-[#be1e2d] hover:text-white transition-all shadow-xl active:scale-95 uppercase tracking-widest text-xs flex items-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        Print {selectedCodes.length} Vouchers
                                    </button>
                                )}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-black/5">
                                            <th className="py-4 px-4 w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCodes.length === codes.data.length && codes.data.length > 0}
                                                    onChange={toggleSelectAll}
                                                    className="rounded border-gray-300 text-[#be1e2d] focus:ring-[#be1e2d]"
                                                />
                                            </th>
                                            <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-gray-400">Code</th>
                                            <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-gray-400">Duration</th>
                                            <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-gray-400">Target Type</th>
                                            <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-gray-400">Status</th>
                                            <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-gray-400">Details</th>
                                            <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-gray-400">Creator</th>
                                            <th className="py-4 px-4 text-xs font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {codes.data.map((code) => (
                                            <tr key={code.id} className="group hover:bg-[#be1e2d]/5 transition-colors">
                                                <td className="py-5 px-4 w-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCodes.includes(code.id)}
                                                        onChange={() => toggleSelect(code.id)}
                                                        className="rounded border-gray-300 text-[#be1e2d] focus:ring-[#be1e2d]"
                                                    />
                                                </td>
                                                <td className="py-5 px-4">
                                                    <span className="font-mono font-black text-lg bg-[#f4f1ea] px-3 py-1 rounded-lg border border-black/5 shadow-sm group-hover:bg-[#be1e2d] group-hover:text-white transition-colors uppercase">
                                                        {code.code}
                                                    </span>
                                                </td>
                                                <td className="py-5 px-4">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded ${code.duration_type === 'permanent' ? 'bg-indigo-50 text-indigo-600' :
                                                        code.duration_type === 'weekly' ? 'bg-amber-50 text-amber-600' :
                                                            'bg-purple-50 text-purple-600'
                                                        }`}>
                                                        {code.duration_type}
                                                    </span>
                                                </td>
                                                <td className="py-5 px-4">
                                                    {code.document ? (
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#be1e2d]">Per Document</span>
                                                            <span className="text-xs font-bold text-gray-600 italic truncate max-w-[120px]">"{code.document.title}"</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded">Full Device</span>
                                                    )}
                                                </td>
                                                <td className="py-5 px-4 text-sm">
                                                    {code.is_used ? (
                                                        <span className="px-3 py-1 bg-red-100 text-red-700 font-black uppercase text-[10px] rounded-full tracking-widest">Used</span>
                                                    ) : (
                                                        <span className="px-3 py-1 bg-green-100 text-green-700 font-black uppercase text-[10px] rounded-full tracking-widest">Available</span>
                                                    )}
                                                </td>
                                                <td className="py-5 px-4">
                                                    {code.is_used ? (
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Device:</span>
                                                                <span className="text-[9px] font-mono text-gray-500 truncate max-w-[80px]">{code.device_id}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Expires:</span>
                                                                <span className="text-[9px] font-bold text-[#be1e2d] italic">
                                                                    {code.expires_at ? new Date(code.expires_at).toLocaleDateString() : 'Never'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-300 italic text-[10px]">No usage recorded</span>
                                                    )}
                                                </td>
                                                <td className="py-5 px-4">
                                                    <span className="text-[10px] font-bold text-gray-500 font-mono">
                                                        {code.creator ? maskEmail(code.creator.email) : 'System'}
                                                    </span>
                                                </td>
                                                <td className="py-5 px-4 text-right">
                                                    <button
                                                        onClick={() => deleteCode(code.id)}
                                                        className="p-2 text-gray-300 hover:text-red-600 transition-colors"
                                                        title="Delete Code"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vouchers (Print Only) */}
            <div className="print-only">
                <div className="voucher-grid">
                    {selectedVouchers.map((code) => (
                        <div key={code.id} style={{ border: '2px dashed black', padding: '20px', borderRadius: '15px', backgroundColor: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minHeight: '300px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', borderBottom: '1px solid black', paddingBottom: '10px' }}>
                                <span style={{ fontWeight: '900', fontSize: '12px' }}>TE UEKERA</span>
                                <span style={{ fontWeight: '900', fontSize: '10px' }}>{code.duration_type.toUpperCase()} ACCESS</span>
                            </div>

                            <div style={{ margin: '30px 0' }}>
                                <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#666', marginBottom: '5px' }}>Your Activation Code</p>
                                <div style={{ fontSize: '36px', fontFamily: 'monospace', fontWeight: '900', letterSpacing: '2px', border: '2px solid black', padding: '15px', backgroundColor: '#f9f9f9' }}>
                                    {code.code}
                                </div>
                            </div>

                            <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '20px' }}>
                                {code.document ? `Valid only for: ${code.document.title}` : 'Valid for all editions (Full Access)'}
                            </div>

                            <div style={{ backgroundColor: '#000', color: '#fff', padding: '15px', borderRadius: '8px', width: '100%' }}>
                                <p style={{ fontSize: '10px', fontWeight: '900', marginBottom: '5px' }}>HOW TO REDEEM</p>
                                <p style={{ fontSize: '8px', lineHeight: '1.4' }}>
                                    1. Visit teuekera.com<br />
                                    2. Click "Unlock This Edition" (bottom-right)<br />
                                    3. Enter your code and enjoy!
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
