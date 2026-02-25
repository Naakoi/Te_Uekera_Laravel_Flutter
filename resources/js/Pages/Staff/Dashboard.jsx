import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';

export default function Dashboard({ auth, documents }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        description: '',
        file: null,
        thumbnail: null,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('documents.store'), {
            onSuccess: () => reset(),
        });
    };

    const isAdmin = auth.user.role === 'admin';
    const canUpload = isAdmin || auth.user.can_upload_documents;
    const canManageCodes = isAdmin || auth.user.can_create_vouchers;
    const canManageUsers = isAdmin || auth.user.can_manage_users;

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-black text-3xl text-gray-800 leading-tight uppercase tracking-tighter italic">Archive Command Center</h2>}
        >
            <Head title="Staff Dashboard" />

            <div className="py-12 bg-[#f4f1ea] min-h-screen">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-12">

                    {/* Management Actions */}
                    <div className="flex flex-wrap gap-4 px-4 sm:px-0">
                        {canManageCodes && (
                            <Link
                                href={route('admin.redeem_codes.index')}
                                className="px-6 py-4 bg-black text-[#ffde00] font-black rounded-2xl hover:bg-[#be1e2d] hover:text-white transition-all shadow-xl uppercase tracking-widest text-xs flex items-center gap-3"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                                </svg>
                                Voucher Control Panel
                            </Link>
                        )}
                        {canManageUsers && (
                            <Link
                                href={route('staff.users.index')}
                                className="px-6 py-4 bg-white text-gray-900 font-black rounded-2xl hover:bg-gray-50 transition-all shadow-xl uppercase tracking-widest text-xs flex items-center gap-3 border border-black/5"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                                Reader Registry
                            </Link>
                        )}
                    </div>

                    {/* Upload Section - Only for Authorized Staff */}
                    {canUpload ? (
                        <div className="bg-white/80 backdrop-blur-md overflow-hidden shadow-2xl sm:rounded-[3rem] border border-black/5 p-12">
                            <header className="mb-10">
                                <div className="inline-block bg-[#be1e2d] text-white px-4 py-1 text-[10px] font-black uppercase tracking-widest mb-4 rounded-full">Authorized Access</div>
                                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">Ingest New Edition</h2>
                                <p className="mt-2 text-sm text-gray-500 font-bold uppercase tracking-widest opacity-60">
                                    Official document distribution subsystem.
                                </p>
                            </header>

                            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-[#be1e2d] mb-2">Edition Title</label>
                                        <input
                                            type="text"
                                            className="w-full bg-[#f4f1ea] border-none rounded-2xl focus:ring-4 focus:ring-[#be1e2d]/10 font-bold text-lg p-5"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            placeholder="e.g. Weekly Gazette - Feb 2026"
                                            required
                                        />
                                        {errors.title && <div className="text-red-600 text-xs mt-1 font-bold italic">{errors.title}</div>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-[#be1e2d] mb-2">Internal Memo / Desc</label>
                                        <textarea
                                            className="w-full bg-[#f4f1ea] border-none rounded-2xl focus:ring-4 focus:ring-[#be1e2d]/10 font-bold text-lg p-5 min-h-[150px]"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                            placeholder="Brief overview of contents..."
                                        />
                                        {errors.description && <div className="text-red-600 text-xs mt-1 font-bold italic">{errors.description}</div>}
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="p-6 bg-[#f4f1ea] rounded-[2rem] border-2 border-dashed border-black/10 hover:border-[#be1e2d]/20 transition-all relative group text-center">
                                            <input
                                                type="file"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                onChange={(e) => setData('file', e.target.files[0])}
                                                required
                                            />
                                            <div className="space-y-2">
                                                <svg className="w-10 h-10 mx-auto text-[#be1e2d] opacity-40 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                </svg>
                                                <p className="font-black uppercase text-xs tracking-widest text-gray-500">
                                                    {data.file ? data.file.name : 'Select PDF Edition'}
                                                </p>
                                                <p className="text-[10px] text-gray-400 font-bold italic">Max size: 1GB</p>
                                                {errors.file && (
                                                    <div className="text-red-600 text-[10px] font-bold italic mt-2">
                                                        {errors.file.includes('failed to upload')
                                                            ? 'Upload failed. Check server limits (post_max_size/upload_max_filesize).'
                                                            : errors.file}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-6 bg-[#f4f1ea] rounded-[2rem] border-2 border-dashed border-black/10 hover:border-[#be1e2d]/20 transition-all relative group text-center">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                onChange={(e) => setData('thumbnail', e.target.files[0])}
                                            />
                                            <div className="space-y-2">
                                                <svg className="w-10 h-10 mx-auto text-[#be1e2d] opacity-40 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <p className="font-black uppercase text-xs tracking-widest text-gray-500">
                                                    {data.thumbnail ? data.thumbnail.name : 'Edition Key Image (Optional)'}
                                                </p>
                                                {errors.thumbnail && <div className="text-red-600 text-[10px] font-bold italic mt-2">{errors.thumbnail}</div>}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-6 bg-[#be1e2d] text-white font-black rounded-3xl hover:bg-black transition-all shadow-2xl shadow-red-500/20 active:scale-95 disabled:opacity-50 uppercase tracking-[0.2em] text-sm"
                                        disabled={processing}
                                    >
                                        Execute Publication
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="bg-red-50 border-2 border-red-100 p-8 rounded-[2rem] text-center">
                            <svg className="w-12 h-12 mx-auto text-red-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <h3 className="text-xl font-black text-red-900 uppercase tracking-tighter italic">Upload Permissions Restricted</h3>
                            <p className="text-sm text-red-600 font-bold uppercase tracking-widest opacity-60 mt-1">Consult your administrator to extend privileges.</p>
                        </div>
                    )}

                    {/* Archive Table */}
                    <div className="bg-white/80 backdrop-blur-md overflow-hidden shadow-2xl sm:rounded-[4rem] border border-black/5">
                        <div className="p-12">
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic text-gray-400 mb-10">Archive Ingestion Log</h3>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-black/5">
                                            <th className="py-6 px-4 text-xs font-black uppercase tracking-widest text-[#be1e2d]">Edition Title</th>
                                            <th className="py-6 px-4 text-xs font-black uppercase tracking-widest text-[#be1e2d]">Tariff</th>
                                            <th className="py-6 px-4 text-xs font-black uppercase tracking-widest text-[#be1e2d] text-right">Administrative</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {documents.data.map((doc) => (
                                            <tr key={doc.id} className="group hover:bg-[#be1e2d]/5 transition-colors">
                                                <td className="py-8 px-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-xl text-gray-900 tracking-tighter uppercase">{doc.title}</span>
                                                        <span className="text-xs font-bold text-gray-400 italic font-mono uppercase tracking-widest opacity-50">Ingested: {new Date(doc.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </td>
                                                <td className="py-8 px-4 font-black text-gray-400">$1.00</td>
                                                <td className="py-8 px-4 text-right space-x-3">
                                                    <Link
                                                        href={route('documents.reader', doc.id)}
                                                        className="inline-flex items-center px-6 py-3 bg-[#f4f1ea] text-gray-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black hover:text-white transition-all shadow-sm"
                                                    >
                                                        Review
                                                    </Link>
                                                    {canUpload && (
                                                        <Link
                                                            href={route('documents.destroy', doc.id)}
                                                            method="delete"
                                                            as="button"
                                                            className="inline-flex items-center px-6 py-3 bg-white border border-[#be1e2d]/10 text-[#be1e2d] text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#be1e2d] hover:text-white transition-all shadow-sm"
                                                        >
                                                            Delete
                                                        </Link>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {documents.links && documents.links.length > 3 && (
                                <div className="mt-16 flex justify-center items-center gap-3">
                                    {documents.links.map((link, i) => (
                                        <button
                                            key={i}
                                            disabled={!link.url}
                                            className={`h-12 flex items-center justify-center px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${link.active
                                                ? 'bg-[#be1e2d] text-white shadow-xl shadow-red-500/30'
                                                : 'bg-white text-black/40 hover:text-black hover:bg-white shadow-md hover:shadow-xl'
                                                } ${!link.url ? 'opacity-20 cursor-not-allowed' : ''}`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                            onClick={() => window.location.href = link.url}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

