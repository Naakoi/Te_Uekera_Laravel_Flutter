import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import LogoutOtherDevicesForm from './Partials/LogoutOtherDevicesForm';
import { Head, router, useForm } from '@inertiajs/react';

export default function Edit({ auth, mustVerifyEmail, status, sessions, tokens }) {
    const { data: redeemData, setData: setRedeemData, post: postRedeem, processing: redeemProcessing, reset: resetRedeem } = useForm({
        code: '',
        device_id: '',
    });
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
                                    let deviceId = localStorage.getItem('te_uekera_device_id');
                                    if (!deviceId) {
                                        deviceId = 'web_' + Math.random().toString(36).substr(2, 9);
                                        localStorage.setItem('te_uekera_device_id', deviceId);
                                    }

                                    postRedeem(route('redeem_code.redeem'), {
                                        onBefore: () => redeemData.device_id = deviceId,
                                        onSuccess: () => resetRedeem(),
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
                                                value={redeemData.code}
                                                onChange={(e) => setRedeemData('code', e.target.value)}
                                                className="flex-grow bg-[#f4f1ea] dark:bg-gray-900 border-none rounded-xl focus:ring-4 focus:ring-[#be1e2d]/10 font-black text-xs uppercase"
                                            />
                                            <button
                                                type="submit"
                                                disabled={redeemProcessing}
                                                className="px-6 py-2 bg-black text-white font-black rounded-xl hover:bg-[#be1e2d] transition-all uppercase tracking-widest text-[9px] flex items-center gap-2"
                                            >
                                                {redeemProcessing ? (
                                                    <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                ) : null}
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
