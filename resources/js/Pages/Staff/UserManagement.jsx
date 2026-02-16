import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function UserManagement({ auth, users, filters }) {
    const [selectedUser, setSelectedUser] = useState(null);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
        password_confirmation: '',
    });

    const openResetModal = (user) => {
        setSelectedUser(user);
        setIsResetModalOpen(true);
    };

    const closeResetModal = () => {
        setIsResetModalOpen(false);
        setSelectedUser(null);
        reset();
    };

    const submitReset = (e) => {
        e.preventDefault();
        post(route('staff.users.reset-password', selectedUser.id), {
            onSuccess: () => closeResetModal(),
        });
    };

    // Custom debounce function
    const debouncedSearch = useRef(null);

    useEffect(() => {
        // Clear previous timeout if search query changes
        if (debouncedSearch.current) {
            clearTimeout(debouncedSearch.current);
        }

        // Only search if the query is different from the current filter
        if (searchQuery !== (filters.search || '')) {
            debouncedSearch.current = setTimeout(() => {
                router.get(
                    route('staff.users.index'),
                    { search: searchQuery },
                    { preserveState: true, replace: true }
                );
            }, 300);
        }

        return () => {
            if (debouncedSearch.current) {
                clearTimeout(debouncedSearch.current);
            }
        };
    }, [searchQuery, filters.search]);

    return (
        <AuthenticatedLayout
            user={auth.user}
            header="User Management"
        >
            <Head title="User Management" />

            <div className="pb-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white/70 backdrop-blur-2xl border border-white/40 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.1)] rounded-[3rem] overflow-hidden">
                        <div className="p-10 md:p-16 text-gray-900">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8 pb-10 border-b border-black/5">
                                <div>
                                    <div className="inline-block bg-[#be1e2d] text-white px-5 py-1 text-[10px] font-black uppercase tracking-[0.2em] mb-4 rounded-full shadow-lg shadow-red-500/20">Staff Access Only</div>
                                    <h3 className="text-5xl font-black text-[#1a1a1a] uppercase tracking-tighter italic font-display">Registered Readers</h3>
                                    <div className="text-xs font-black uppercase tracking-[0.2em] text-[#1e3a8a] opacity-50 mt-2">
                                        Total Enrollment: <span className="text-[#be1e2d]">{users.total}</span>
                                    </div>
                                </div>
                                <div className="w-full md:w-96 relative group">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-[#be1e2d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                        </svg>
                                    </div>
                                    <TextInput
                                        className="pl-14 w-full border-none rounded-2xl h-16 font-bold placeholder:text-black/20 bg-black/5 focus:bg-white focus:ring-4 focus:ring-[#be1e2d]/5 shadow-inner transition-all"
                                        placeholder="Search by name or email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute inset-y-0 right-0 pr-5 flex items-center text-black/20 hover:text-[#be1e2d]"
                                        >
                                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-3xl border border-black/5 shadow-inner bg-white/50">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-[#1a1a1a] text-white">
                                            <th className="px-8 py-6 font-black uppercase text-[10px] tracking-[0.3em]">Name</th>
                                            <th className="px-8 py-6 font-black uppercase text-[10px] tracking-[0.3em]">Email Address</th>
                                            <th className="px-8 py-6 font-black uppercase text-[10px] tracking-[0.3em]">Enrollment</th>
                                            <th className="px-8 py-6 font-black uppercase text-[10px] tracking-[0.3em] text-right">Administrative</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black/5 font-serif">
                                        {users.data.map((user) => (
                                            <tr key={user.id} className="hover:bg-white transition-colors group">
                                                <td className="px-8 py-6 whitespace-nowrap font-black uppercase tracking-tight text-[#1e3a8a] text-lg">{user.name}</td>
                                                <td className="px-8 py-6 whitespace-nowrap text-gray-800 font-medium italic">{user.email}</td>
                                                <td className="px-8 py-6 whitespace-nowrap text-xs font-black uppercase tracking-widest text-black/30">{user.created_at}</td>
                                                <td className="px-8 py-6 whitespace-nowrap text-right">
                                                    <button
                                                        onClick={() => openResetModal(user)}
                                                        className="inline-flex items-center px-6 py-2.5 bg-white border border-black/10 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-[#be1e2d] hover:text-white hover:border-[#be1e2d] hover:shadow-lg hover:shadow-red-500/20 transition-all active:scale-95"
                                                    >
                                                        Reset Key
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {users.links && users.links.length > 3 && (
                                <div className="mt-16 flex justify-center items-center gap-3">
                                    {users.links.map((link, i) => (
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

            <Modal show={isResetModalOpen} onClose={closeResetModal}>
                <form onSubmit={submitReset} className="p-6">
                    <h2 className="text-lg font-bold text-[#1e3a8a] mb-4">
                        Reset Password for {selectedUser?.name}
                    </h2>

                    <p className="mb-6 text-sm text-gray-600 dark:text-gray-400 italic border-l-4 border-[#be1e2d] pl-4">
                        Provide a new password for the user. You will need to share this password with them manually.
                    </p>

                    <div className="mt-4">
                        <InputLabel htmlFor="password" value="New Password" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="password_confirmation" value="Confirm New Password" />
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            required
                        />
                        <InputError message={errors.password_confirmation} className="mt-2" />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <SecondaryButton onClick={closeResetModal}>Cancel</SecondaryButton>
                        <PrimaryButton
                            className="bg-[#be1e2d] hover:bg-red-700"
                            disabled={processing}
                        >
                            Reset Password
                        </PrimaryButton>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
