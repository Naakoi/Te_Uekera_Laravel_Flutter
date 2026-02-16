import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Dialog } from '@headlessui/react';

export default function Dashboard({ auth, staff }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        can_upload_documents: false,
        can_create_vouchers: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.staff.create'), {
            onSuccess: () => reset(),
        });
    };

    const deleteStaff = (id) => {
        if (confirm('Are you sure you want to delete this staff member?')) {
            router.delete(route('admin.staff.delete', id));
        }
    };

    const togglePermission = (user, permission) => {
        router.patch(route('admin.staff.toggle_permission', { user: user.id, permission: permission }));
    };

    const [editingUser, setEditingUser] = useState(null);
    const { data: editData, setData: setEditData, patch: patchEdit, processing: processingEdit, errors: errorsEdit, reset: resetEdit } = useForm({
        name: '',
        email: '',
        password: '',
        can_upload_documents: false,
        can_create_vouchers: false,
        can_manage_users: false,
    });

    const openEditModal = (user) => {
        setEditingUser(user);
        setEditData({
            name: user.name,
            email: user.email,
            password: '',
            can_upload_documents: user.can_upload_documents,
            can_create_vouchers: user.can_create_vouchers,
            can_manage_users: user.can_manage_users,
        });
    };

    const closeEditModal = () => {
        setEditingUser(null);
        resetEdit();
    };

    const submitEdit = (e) => {
        e.preventDefault();
        patchEdit(route('admin.staff.update', editingUser.id), {
            onSuccess: () => closeEditModal(),
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-black text-3xl text-gray-800 leading-tight uppercase tracking-tighter">Staff Control Center</h2>}
        >
            <Head title="Admin Dashboard" />

            <div className="py-12 bg-[#f4f1ea] min-h-screen">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-12">

                    {/* Navigation Pills */}
                    <div className="flex gap-4">
                        <a href={route('admin.dashboard')} className="px-6 py-3 bg-[#be1e2d] text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-red-500/20">Staff Management</a>
                        <a href={route('admin.subscription-plans.index')} className="px-6 py-3 bg-white text-gray-500 hover:text-[#be1e2d] font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-sm">Subscription Plans</a>
                        <a href={route('admin.gateway-settings.index')} className="px-6 py-3 bg-white text-gray-500 hover:text-[#be1e2d] font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-sm">Payment Gateways</a>
                        <a href={route('admin.redeem_codes.index')} className="px-6 py-3 bg-white text-gray-500 hover:text-[#be1e2d] font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-sm">Activation Codes</a>
                    </div>

                    {/* Create Section */}
                    <div className="bg-white/80 backdrop-blur-md overflow-hidden shadow-2xl sm:rounded-[3rem] border border-black/5 p-12">
                        <header className="mb-10">
                            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">Onboard New Team Member</h2>
                            <p className="mt-2 text-sm text-gray-500 font-bold uppercase tracking-widest opacity-60">
                                Assign specific administrative privileges to your staff.
                            </p>
                        </header>

                        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#be1e2d] mb-2">Display Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[#f4f1ea] border-none rounded-2xl focus:ring-4 focus:ring-[#be1e2d]/10 font-bold text-lg p-5"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Full Name"
                                        required
                                    />
                                    {errors.name && <div className="text-red-600 text-xs mt-1 font-bold italic">{errors.name}</div>}
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#be1e2d] mb-2">Email Identity</label>
                                    <input
                                        type="email"
                                        className="w-full bg-[#f4f1ea] border-none rounded-2xl focus:ring-4 focus:ring-[#be1e2d]/10 font-bold text-lg p-5"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="email@example.com"
                                        required
                                    />
                                    {errors.email && <div className="text-red-600 text-xs mt-1 font-bold italic">{errors.email}</div>}
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#be1e2d] mb-2">Secure Access Key</label>
                                    <input
                                        type="password"
                                        className="w-full bg-[#f4f1ea] border-none rounded-2xl focus:ring-4 focus:ring-[#be1e2d]/10 font-bold text-lg p-5"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Minimum 8 characters"
                                        required
                                    />
                                    {errors.password && <div className="text-red-600 text-xs mt-1 font-bold italic">{errors.password}</div>}
                                </div>
                            </div>

                            <div className="space-y-8">
                                <label className="block text-xs font-black uppercase tracking-widest text-[#be1e2d]">Staff Privileges</label>

                                <div className="space-y-4">
                                    <label className="flex items-center gap-4 group cursor-pointer p-4 bg-[#f4f1ea] rounded-2xl border-2 border-transparent hover:border-[#be1e2d]/20 transition-all">
                                        <input
                                            type="checkbox"
                                            className="w-6 h-6 rounded-lg text-[#be1e2d] focus:ring-[#be1e2d] border-none bg-white shadow-sm"
                                            checked={data.can_upload_documents}
                                            onChange={(e) => setData('can_upload_documents', e.target.checked)}
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-black uppercase text-sm tracking-tight text-gray-800">Document Upload</span>
                                            <span className="text-[10px] text-gray-500 font-bold italic">Can publish and delete archive editions.</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-4 group cursor-pointer p-4 bg-[#f4f1ea] rounded-2xl border-2 border-transparent hover:border-[#be1e2d]/20 transition-all">
                                        <input
                                            type="checkbox"
                                            className="w-6 h-6 rounded-lg text-[#be1e2d] focus:ring-[#be1e2d] border-none bg-white shadow-sm"
                                            checked={data.can_create_vouchers}
                                            onChange={(e) => setData('can_create_vouchers', e.target.checked)}
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-black uppercase text-sm tracking-tight text-gray-800">Voucher Creation</span>
                                            <span className="text-[10px] text-gray-500 font-bold italic">Can generate and print activation codes.</span>
                                        </div>
                                    </label>

                                    <label className="flex items-center gap-4 group cursor-pointer p-4 bg-[#f4f1ea] rounded-2xl border-2 border-transparent hover:border-[#be1e2d]/20 transition-all">
                                        <input
                                            type="checkbox"
                                            className="w-6 h-6 rounded-lg text-[#be1e2d] focus:ring-[#be1e2d] border-none bg-white shadow-sm"
                                            checked={data.can_manage_users}
                                            onChange={(e) => setData('can_manage_users', e.target.checked)}
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-black uppercase text-sm tracking-tight text-gray-800">Reader Management</span>
                                            <span className="text-[10px] text-gray-500 font-bold italic">Can view registered readers and reset passwords.</span>
                                        </div>
                                    </label>
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        className="w-full py-6 bg-[#be1e2d] text-white font-black rounded-3xl hover:bg-black transition-all shadow-2xl shadow-red-500/20 active:scale-95 disabled:opacity-50 uppercase tracking-[0.2em] text-sm"
                                        disabled={processing}
                                    >
                                        Create Accountant Access
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white/80 backdrop-blur-md overflow-hidden shadow-2xl sm:rounded-[4rem] border border-black/5">
                        <div className="p-12">
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic text-gray-400 mb-10">Active Staff List</h3>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-black/5">
                                            <th className="py-6 px-4 text-xs font-black uppercase tracking-widest text-[#be1e2d]">Staff Member</th>
                                            <th className="py-6 px-4 text-xs font-black uppercase tracking-widest text-[#be1e2d]">Permissions</th>
                                            <th className="py-6 px-4 text-xs font-black uppercase tracking-widest text-[#be1e2d] text-right">Administrative</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {staff.map((member) => (
                                            <tr key={member.id} className="group hover:bg-[#be1e2d]/5 transition-colors">
                                                <td className="py-8 px-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-xl text-gray-900 tracking-tighter uppercase">{member.name}</span>
                                                        <span className="text-xs font-bold text-gray-400 italic font-mono">{member.email}</span>
                                                    </div>
                                                </td>
                                                <td className="py-8 px-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => togglePermission(member, 'can_upload_documents')}
                                                            className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg border transition-all ${member.can_upload_documents
                                                                ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'
                                                                : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-blue-200 hover:text-blue-400'
                                                                }`}
                                                        >
                                                            Uploads
                                                        </button>
                                                        <button
                                                            onClick={() => togglePermission(member, 'can_create_vouchers')}
                                                            className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg border transition-all ${member.can_create_vouchers
                                                                ? 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100'
                                                                : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-amber-200 hover:text-amber-400'
                                                                }`}
                                                        >
                                                            Vouchers
                                                        </button>
                                                        <button
                                                            onClick={() => togglePermission(member, 'can_manage_users')}
                                                            className={`px-3 py-1 text-[9px] font-black uppercase rounded-lg border transition-all ${member.can_manage_users
                                                                ? 'bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100'
                                                                : 'bg-gray-50 text-gray-400 border-gray-200 hover:border-purple-200 hover:text-purple-400'
                                                                }`}
                                                        >
                                                            Readers
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="py-8 px-4 text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => openEditModal(member)}
                                                            className="p-4 text-blue-300 hover:text-blue-600 hover:bg-white rounded-2xl transition-all group"
                                                            title="Edit Staff"
                                                        >
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => deleteStaff(member.id)}
                                                            className="p-4 text-[#be1e2d]/20 hover:text-[#be1e2d] hover:bg-white rounded-2xl transition-all group"
                                                            title="Revoke Permission"
                                                        >
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
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

            <Dialog open={!!editingUser} onClose={closeEditModal} className="relative z-50">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-3xl p-10 shadow-2xl">
                        <Dialog.Title className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic mb-8">Edit Staff Member</Dialog.Title>

                        <form onSubmit={submitEdit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#be1e2d] mb-2">Display Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[#f4f1ea] border-none rounded-2xl focus:ring-4 focus:ring-[#be1e2d]/10 font-bold p-4"
                                        value={editData.name}
                                        onChange={(e) => setEditData('name', e.target.value)}
                                        required
                                    />
                                    {errorsEdit.name && <div className="text-red-600 text-xs mt-1 font-bold italic">{errorsEdit.name}</div>}
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#be1e2d] mb-2">Email Identity</label>
                                    <input
                                        type="email"
                                        className="w-full bg-[#f4f1ea] border-none rounded-2xl focus:ring-4 focus:ring-[#be1e2d]/10 font-bold p-4"
                                        value={editData.email}
                                        onChange={(e) => setEditData('email', e.target.value)}
                                        required
                                    />
                                    {errorsEdit.email && <div className="text-red-600 text-xs mt-1 font-bold italic">{errorsEdit.email}</div>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-[#be1e2d] mb-2">Update Password (Optional)</label>
                                <input
                                    type="password"
                                    className="w-full bg-[#f4f1ea] border-none rounded-2xl focus:ring-4 focus:ring-[#be1e2d]/10 font-bold p-4"
                                    value={editData.password}
                                    onChange={(e) => setEditData('password', e.target.value)}
                                    placeholder="Leave blank to keep current password"
                                />
                                {errorsEdit.password && <div className="text-red-600 text-xs mt-1 font-bold italic">{errorsEdit.password}</div>}
                            </div>

                            <div className="space-y-3">
                                <label className="block text-xs font-black uppercase tracking-widest text-[#be1e2d]">Permissions</label>
                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer p-3 bg-[#f4f1ea] rounded-xl border border-transparent hover:border-[#be1e2d]/20 transition-all">
                                        <input
                                            type="checkbox"
                                            className="rounded text-[#be1e2d] focus:ring-[#be1e2d] border-none bg-white"
                                            checked={editData.can_upload_documents}
                                            onChange={(e) => setEditData('can_upload_documents', e.target.checked)}
                                        />
                                        <span className="font-bold text-xs uppercase text-gray-700">Document Upload</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer p-3 bg-[#f4f1ea] rounded-xl border border-transparent hover:border-[#be1e2d]/20 transition-all">
                                        <input
                                            type="checkbox"
                                            className="rounded text-[#be1e2d] focus:ring-[#be1e2d] border-none bg-white"
                                            checked={editData.can_create_vouchers}
                                            onChange={(e) => setEditData('can_create_vouchers', e.target.checked)}
                                        />
                                        <span className="font-bold text-xs uppercase text-gray-700">Voucher Creation</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer p-3 bg-[#f4f1ea] rounded-xl border border-transparent hover:border-[#be1e2d]/20 transition-all">
                                        <input
                                            type="checkbox"
                                            className="rounded text-[#be1e2d] focus:ring-[#be1e2d] border-none bg-white"
                                            checked={editData.can_manage_users}
                                            onChange={(e) => setEditData('can_manage_users', e.target.checked)}
                                        />
                                        <span className="font-bold text-xs uppercase text-gray-700">Reader Management</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeEditModal}
                                    className="px-6 py-3 bg-gray-100 text-gray-700 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-3 bg-[#be1e2d] text-white font-black rounded-2xl hover:bg-black transition-all shadow-xl shadow-red-500/20 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-xs"
                                    disabled={processingEdit}
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </AuthenticatedLayout>
    );
}

