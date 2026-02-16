import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';

export default function Index({ auth, settings }) {
    const stripeSetting = settings.find(s => s.gateway === 'stripe');
    const paypalSetting = settings.find(s => s.gateway === 'paypal');

    const stripeForm = useForm({
        gateway: 'stripe',
        config: stripeSetting ? stripeSetting.config : { public_key: '', secret_key: '', webhook_secret: '' },
        is_enabled: stripeSetting ? !!stripeSetting.is_enabled : false,
    });

    const paypalForm = useForm({
        gateway: 'paypal',
        config: paypalSetting ? paypalSetting.config : { client_id: '', client_secret: '', app_id: '', mode: 'sandbox' },
        is_enabled: paypalSetting ? !!paypalSetting.is_enabled : false,
    });

    const submitStripe = (e) => {
        e.preventDefault();
        stripeForm.post(route('admin.gateway-settings.update'));
    };

    const submitPaypal = (e) => {
        e.preventDefault();
        paypalForm.post(route('admin.gateway-settings.update'));
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-black text-3xl text-gray-800 leading-tight uppercase tracking-tighter">Payment Gateways</h2>}
        >
            <Head title="Payment Gateways" />

            <div className="py-12 bg-[#f4f1ea] min-h-screen">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-12">

                    {/* Stripe Configuration */}
                    <div className="bg-white/80 backdrop-blur-md overflow-hidden shadow-2xl sm:rounded-[3rem] border border-black/5 p-12">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">Stripe Secure Gateway</h2>
                                <p className="mt-2 text-sm text-gray-500 font-bold uppercase tracking-widest opacity-60">Enter your production or test keys.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${stripeForm.data.is_enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {stripeForm.data.is_enabled ? 'Enabled' : 'Disabled'}
                                </span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={stripeForm.data.is_enabled}
                                        onChange={e => stripeForm.setData('is_enabled', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#be1e2d]"></div>
                                </label>
                            </div>
                        </div>

                        <form onSubmit={submitStripe} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#be1e2d] mb-2">Public Key</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[#f4f1ea] border-none rounded-2xl focus:ring-4 focus:ring-[#be1e2d]/10 font-bold p-5"
                                        value={stripeForm.data.config.public_key}
                                        onChange={e => stripeForm.setData('config', { ...stripeForm.data.config, public_key: e.target.value })}
                                        placeholder="pk_test_..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#be1e2d] mb-2">Secret Key</label>
                                    <input
                                        type="password"
                                        className="w-full bg-[#f4f1ea] border-none rounded-2xl focus:ring-4 focus:ring-[#be1e2d]/10 font-bold p-5"
                                        value={stripeForm.data.config.secret_key}
                                        onChange={e => stripeForm.setData('config', { ...stripeForm.data.config, secret_key: e.target.value })}
                                        placeholder="sk_test_..."
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-[#be1e2d] mb-2">Webhook Secret</label>
                                <input
                                    type="password"
                                    className="w-full bg-[#f4f1ea] border-none rounded-2xl focus:ring-4 focus:ring-[#be1e2d]/10 font-bold p-5"
                                    value={stripeForm.data.config.webhook_secret}
                                    onChange={e => stripeForm.setData('config', { ...stripeForm.data.config, webhook_secret: e.target.value })}
                                    placeholder="whsec_..."
                                />
                            </div>
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="px-10 py-5 bg-black text-white font-black rounded-2xl hover:bg-[#be1e2d] transition-all uppercase tracking-widest text-xs"
                                    disabled={stripeForm.processing}
                                >
                                    Update Stripe Config
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* PayPal Configuration */}
                    <div className="bg-white/80 backdrop-blur-md overflow-hidden shadow-2xl sm:rounded-[3rem] border border-black/5 p-12">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic">PayPal Global Gateway</h2>
                                <p className="mt-2 text-sm text-gray-500 font-bold uppercase tracking-widest opacity-60">Manage your PayPal Developer credentials.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${paypalForm.data.is_enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {paypalForm.data.is_enabled ? 'Enabled' : 'Disabled'}
                                </span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={paypalForm.data.is_enabled}
                                        onChange={e => paypalForm.setData('is_enabled', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#be1e2d]"></div>
                                </label>
                            </div>
                        </div>

                        <form onSubmit={submitPaypal} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#be1e2d] mb-2">Client ID</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[#f4f1ea] border-none rounded-2xl focus:ring-4 focus:ring-[#be1e2d]/10 font-bold p-5"
                                        value={paypalForm.data.config.client_id}
                                        onChange={e => paypalForm.setData('config', { ...paypalForm.data.config, client_id: e.target.value })}
                                        placeholder="PayPal Client ID"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#be1e2d] mb-2">Client Secret</label>
                                    <input
                                        type="password"
                                        className="w-full bg-[#f4f1ea] border-none rounded-2xl focus:ring-4 focus:ring-[#be1e2d]/10 font-bold p-5"
                                        value={paypalForm.data.config.client_secret}
                                        onChange={e => paypalForm.setData('config', { ...paypalForm.data.config, client_secret: e.target.value })}
                                        placeholder="PayPal Client Secret"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#be1e2d] mb-2">App ID (Optional)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[#f4f1ea] border-none rounded-2xl focus:ring-4 focus:ring-[#be1e2d]/10 font-bold p-5"
                                        value={paypalForm.data.config.app_id}
                                        onChange={e => paypalForm.setData('config', { ...paypalForm.data.config, app_id: e.target.value })}
                                        placeholder="APP-..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-[#be1e2d] mb-2">Mode</label>
                                    <select
                                        className="w-full bg-[#f4f1ea] border-none rounded-2xl focus:ring-4 focus:ring-[#be1e2d]/10 font-bold p-5"
                                        value={paypalForm.data.config.mode}
                                        onChange={e => paypalForm.setData('config', { ...paypalForm.data.config, mode: e.target.value })}
                                    >
                                        <option value="sandbox">Sandbox</option>
                                        <option value="live">Live</option>
                                    </select>
                                </div>
                            </div>
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="px-10 py-5 bg-black text-white font-black rounded-2xl hover:bg-[#be1e2d] transition-all uppercase tracking-widest text-xs"
                                    disabled={paypalForm.processing}
                                >
                                    Update PayPal Config
                                </button>
                            </div>
                        </form>
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
