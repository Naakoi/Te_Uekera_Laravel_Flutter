import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import { Dialog } from '@headlessui/react';

export default function Index({ auth, plans }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
        price: '',
        duration_days: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('admin.subscription-plans.store'), {
            onSuccess: () => reset(),
        });
    };

    const deletePlan = (id) => {
        if (confirm('Are you sure you want to delete this plan?')) {
            router.delete(route('admin.subscription-plans.destroy', id));
        }
    };

    const [editingPlan, setEditingPlan] = useState(null);
    const { data: editData, setData: setEditData, patch: patchEdit, processing: processingEdit, errors: errorsEdit, reset: resetEdit } = useForm({
        name: '',
        description: '',
        price: '',
        duration_days: '',
        is_active: true,
    });

    const openEditModal = (plan) => {
        setEditingPlan(plan);
        setEditData({
            name: plan.name,
            description: plan.description || '',
            price: plan.price,
            duration_days: plan.duration_days,
            is_active: plan.is_active,
        });
    };

    const closeEditModal = () => {
        setEditingPlan(null);
        resetEdit();
    };

    const submitEdit = (e) => {
        e.preventDefault();
        patchEdit(route('admin.subscription-plans.update', editingPlan.id), {
            onSuccess: () => closeEditModal(),
        });
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-black text-3xl text-gray-800 leading-tight uppercase tracking-tighter">Subscription Plans</h2>}
        >
            <Head title="Subscription Plans" />

            <div className="py-12 bg-[#f4f1ea] min-h-screen">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-12">

                    {/* Create Section */}
                    <div className="bg-white/80 backdrop-blur-md overflow-hidden shadow-2xl sm:rounded-[3rem] border border-black/5 p-12">
                        <header className="mb-10">
                            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">Create New Plan</h2>
                        </header>

                        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#be1e2d] mb-2">Plan Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[#f4f1ea] border-none rounded-2xl focus:ring-4 focus:ring-[#be1e2d]/10 font-bold text-lg p-5"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g. Monthly Access"
                                        required
                                    />
                                    {errors.name && <div className="text-red-600 text-xs mt-1 font-bold italic">{errors.name}</div>}
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#be1e2d] mb-2">Description</label>
                                    <textarea
                                        className="w-full bg-[#f4f1ea] border-none rounded-2xl focus:ring-4 focus:ring-[#be1e2d]/10 font-bold text-lg p-5"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Plan features..."
                                    />
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#be1e2d] mb-2">Price ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full bg-[#f4f1ea] border-none rounded-2xl focus:ring-4 focus:ring-[#be1e2d]/10 font-bold text-lg p-5"
                                        value={data.price}
                                        onChange={(e) => setData('price', e.target.value)}
                                        placeholder="0.00"
                                        required
                                    />
                                    {errors.price && <div className="text-red-600 text-xs mt-1 font-bold italic">{errors.price}</div>}
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#be1e2d] mb-2">Duration (Days)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-[#f4f1ea] border-none rounded-2xl focus:ring-4 focus:ring-[#be1e2d]/10 font-bold text-lg p-5"
                                        value={data.duration_days}
                                        onChange={(e) => setData('duration_days', e.target.value)}
                                        placeholder="30"
                                        required
                                    />
                                    {errors.duration_days && <div className="text-red-600 text-xs mt-1 font-bold italic">{errors.duration_days}</div>}
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        className="w-full py-6 bg-[#be1e2d] text-white font-black rounded-3xl hover:bg-black transition-all shadow-2xl shadow-red-500/20 active:scale-95 disabled:opacity-50 uppercase tracking-[0.2em] text-sm"
                                        disabled={processing}
                                    >
                                        Create Plan
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white/80 backdrop-blur-md overflow-hidden shadow-2xl sm:rounded-[4rem] border border-black/5">
                        <div className="p-12">
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic text-gray-400 mb-10">Active Plans</h3>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-black/5">
                                            <th className="py-6 px-4 text-xs font-black uppercase tracking-widest text-[#be1e2d]">Plan</th>
                                            <th className="py-6 px-4 text-xs font-black uppercase tracking-widest text-[#be1e2d]">Price</th>
                                            <th className="py-6 px-4 text-xs font-black uppercase tracking-widest text-[#be1e2d]">Duration</th>
                                            <th className="py-6 px-4 text-xs font-black uppercase tracking-widest text-[#be1e2d]">Status</th>
                                            <th className="py-6 px-4 text-xs font-black uppercase tracking-widest text-[#be1e2d] text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5">
                                        {plans.map((plan) => (
                                            <tr key={plan.id} className="group hover:bg-[#be1e2d]/5 transition-colors">
                                                <td className="py-8 px-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-xl text-gray-900 tracking-tighter uppercase">{plan.name}</span>
                                                        <span className="text-xs font-bold text-gray-400 italic">{plan.description}</span>
                                                    </div>
                                                </td>
                                                <td className="py-8 px-4 font-black text-gray-900">${plan.price}</td>
                                                <td className="py-8 px-4 font-black text-gray-900">{plan.duration_days} Days</td>
                                                <td className="py-8 px-4">
                                                    <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg ${plan.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {plan.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="py-8 px-4 text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <button
                                                            onClick={() => openEditModal(plan)}
                                                            className="p-4 text-blue-300 hover:text-blue-600 hover:bg-white rounded-2xl transition-all"
                                                        >
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => deletePlan(plan.id)}
                                                            className="p-4 text-[#be1e2d]/20 hover:text-[#be1e2d] hover:bg-white rounded-2xl transition-all"
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

            <Dialog open={!!editingPlan} onClose={closeEditModal} className="relative z-50">
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <Dialog.Panel className="mx-auto max-w-2xl w-full bg-white rounded-3xl p-10 shadow-2xl">
                        <Dialog.Title className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic mb-8">Edit Plan</Dialog.Title>
                        <form onSubmit={submitEdit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#be1e2d] mb-2">Plan Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[#f4f1ea] border-none rounded-2xl focus:ring-4 focus:ring-[#be1e2d]/10 font-bold p-4"
                                        value={editData.name}
                                        onChange={(e) => setEditData('name', e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#be1e2d] mb-2">Price ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full bg-[#f4f1ea] border-none rounded-2xl focus:ring-4 focus:ring-[#be1e2d]/10 font-bold p-4"
                                        value={editData.price}
                                        onChange={(e) => setEditData('price', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-[#be1e2d] mb-2">Duration (Days)</label>
                                <input
                                    type="number"
                                    className="w-full bg-[#f4f1ea] border-none rounded-2xl focus:ring-4 focus:ring-[#be1e2d]/10 font-bold p-4"
                                    value={editData.duration_days}
                                    onChange={(e) => setEditData('duration_days', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-[#be1e2d] mb-2">Description</label>
                                <textarea
                                    className="w-full bg-[#f4f1ea] border-none rounded-2xl focus:ring-4 focus:ring-[#be1e2d]/10 font-bold p-4"
                                    value={editData.description}
                                    onChange={(e) => setEditData('description', e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 cursor-pointer p-3 bg-[#f4f1ea] rounded-xl border border-transparent hover:border-[#be1e2d]/20 transition-all text-xs font-black uppercase">
                                    <input
                                        type="checkbox"
                                        className="rounded text-[#be1e2d] focus:ring-[#be1e2d] border-none bg-white"
                                        checked={editData.is_active}
                                        onChange={(e) => setEditData('is_active', e.target.checked)}
                                    />
                                    Active Plan
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={closeEditModal} className="px-6 py-3 bg-gray-100 text-gray-700 font-black rounded-2xl hover:bg-gray-200 uppercase tracking-widest text-xs">Cancel</button>
                                <button type="submit" className="px-6 py-3 bg-[#be1e2d] text-white font-black rounded-2xl hover:bg-black uppercase tracking-widest text-xs" disabled={processingEdit}>Save Changes</button>
                            </div>
                        </form>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </AuthenticatedLayout>
    );
}
