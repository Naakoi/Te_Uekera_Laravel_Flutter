import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import LogoutOtherDevicesForm from './Partials/LogoutOtherDevicesForm';
import { Head, router } from '@inertiajs/react';

export default function Edit({ auth, mustVerifyEmail, status, sessions, tokens }) {
    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 dark:text-gray-200 leading-tight">Profile</h2>}
        >
            <Head title="Profile" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>

                    <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        <section className="max-w-xl">
                            <header>
                                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 uppercase font-black">Archive Access & Subscription</h2>
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                    Manage your premium archive privileges and activate new vouchers.
                                </p>
                            </header>

                            <div className="mt-6 space-y-6">
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black uppercase text-gray-400">Current Standing</span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                            {auth.user.has_active_subscription ? 'Premium Verified' : 'Standard Reader'}
                                        </span>
                                    </div>
                                    <a href={route('subscription.index')} className="text-[10px] font-black uppercase bg-[#be1e2d] text-white px-4 py-2 rounded-lg hover:bg-black transition-all">
                                        Upgrade Now
                                    </a>
                                </div>

                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const code = e.target.code.value;
                                    let deviceId = localStorage.getItem('te_uekera_device_id');
                                    if (!deviceId) {
                                        deviceId = 'web_' + Math.random().toString(36).substr(2, 9);
                                        localStorage.setItem('te_uekera_device_id', deviceId);
                                    }

                                    router.post(route('redeem_code.redeem'), {
                                        code: code,
                                        device_id: deviceId
                                    }, {
                                        onSuccess: () => e.target.reset(),
                                    });
                                }} className="space-y-4">
                                    <div className="flex flex-col">
                                        <label className="text-[10px] font-black uppercase text-gray-400 mb-2">Redeem Activation Code</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                name="code"
                                                placeholder="X1Y2Z3A4B5"
                                                required
                                                className="flex-grow bg-[#f4f1ea] dark:bg-gray-900 border-none rounded-xl focus:ring-4 focus:ring-[#be1e2d]/10 font-black text-xs uppercase"
                                            />
                                            <button
                                                type="submit"
                                                className="px-6 py-2 bg-black text-white font-black rounded-xl hover:bg-[#be1e2d] transition-all uppercase tracking-widest text-[9px]"
                                            >
                                                Activate
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </section>
                    </div>

                    <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>

                    <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        <LogoutOtherDevicesForm
                            className="max-w-xl"
                            status={status}
                            sessions={sessions}
                            tokens={tokens}
                        />
                    </div>

                    <div className="p-4 sm:p-8 bg-white dark:bg-gray-800 shadow sm:rounded-lg">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
