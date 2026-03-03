import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';

export default function Index({ auth, plans, currentSubscription }) {
    const { data: redeemData, setData: setRedeemData, post: postRedeem, processing: redeemProcessing, reset: resetRedeem } = useForm({
        code: '',
        device_id: '',
    });

    const handleSubscription = (planId, gateway) => {
        if (gateway === 'stripe') {
            router.post(route('stripe.checkout'), { plan_id: planId });
        } else if (gateway === 'paypal') {
            router.post(route('paypal.checkout'), { plan_id: planId });
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-black text-3xl text-gray-800 leading-tight uppercase tracking-tighter">Premium Archive Access</h2>}
        >
            <Head title="Subscription Plans" />

            <div className="py-20 bg-[#f4f1ea] min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="text-center mb-20">
                        <span className="inline-block px-4 py-1.5 bg-[#be1e2d]/10 text-[#be1e2d] text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-6">Exclusive Archive Access</span>
                        <h1 className="text-6xl font-black text-gray-900 uppercase tracking-tighter italic mb-6 leading-none">Choose Your Reading Privilege</h1>
                        <p className="text-xl text-gray-500 font-bold uppercase tracking-widest opacity-60 max-w-3xl mx-auto italic">
                            Support independent journalism and unlock over a century of digital history.
                        </p>
                    </div>

                    {currentSubscription && (
                        <div className="mb-20 bg-black text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#be1e2d]/10 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110"></div>
                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                                <div className="text-center md:text-left">
                                    <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                                        <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-500">Live Press Access</span>
                                    </div>
                                    <h2 className="text-4xl font-black uppercase tracking-tighter italic scale-y-110 origin-left">Active Tier: {currentSubscription.plan?.name}</h2>
                                    <p className="font-bold opacity-60 mt-2 uppercase text-xs tracking-widest">Your access expires on {new Date(currentSubscription.ends_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                </div>
                                <div className="px-10 py-4 bg-[#be1e2d] text-white font-black rounded-2xl uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-red-500/20">
                                    Verified Member
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                        <div className="bg-white/50 backdrop-blur-xl p-8 rounded-[2rem] border border-black/5 flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-[#be1e2d] text-white rounded-xl flex items-center justify-center mb-4 text-xl shadow-lg">🗞️</div>
                            <h4 className="font-black uppercase tracking-tight text-gray-900 mb-2">Full Archive</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Access every edition dating back to the foundation.</p>
                        </div>
                        <div className="bg-white/50 backdrop-blur-xl p-8 rounded-[2rem] border border-black/5 flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center mb-4 text-xl shadow-lg">⚡</div>
                            <h4 className="font-black uppercase tracking-tight text-gray-900 mb-2">Instant Unlock</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">No waiting, no ads. Built for serious research and discovery.</p>
                        </div>
                        <div className="bg-white/50 backdrop-blur-xl p-8 rounded-[2rem] border border-black/5 flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-[#1e3a8a] text-white rounded-xl flex items-center justify-center mb-4 text-xl shadow-lg">📱</div>
                            <h4 className="font-black uppercase tracking-tight text-gray-900 mb-2">Universal Sync</h4>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Read on Web, Tablet, or Mobile. Your library follows you.</p>
                        </div>
                    </div>

                    {/* Redeem Code Section */}
                    <div className="mt-20 bg-white p-12 rounded-[4rem] shadow-2xl border-4 border-[#ffde00] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 bg-[#ffde00] text-gray-900 px-10 py-3 rounded-bl-[2rem] font-black text-[10px] uppercase tracking-[0.3em]">
                            Voucher Activation
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h3 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic mb-4 leading-none text-[#be1e2d]">Have an activation code?</h3>
                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest opacity-80 italic">
                                    Enter your physical voucher or promotional code below to unlock premium access instantly across all your devices.
                                </p>
                            </div>
                            <div>
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    let deviceId = localStorage.getItem('te_uekera_device_id');
                                    if (!deviceId) {
                                        deviceId = 'web_' + Math.random().toString(36).substr(2, 9);
                                        localStorage.setItem('te_uekera_device_id', deviceId);
                                    }

                                    postRedeem(route('redeem_code.redeem'), {
                                        onBefore: () => {
                                            redeemData.device_id = deviceId;
                                        },
                                        onSuccess: () => resetRedeem(),
                                    });
                                }} className="flex gap-4">
                                    <input
                                        type="text"
                                        name="code"
                                        placeholder="X1Y2Z3A4B5"
                                        required
                                        value={redeemData.code}
                                        onChange={(e) => setRedeemData('code', e.target.value.toUpperCase())}
                                        className="flex-grow bg-[#f4f1ea] border-none rounded-2xl focus:ring-4 focus:ring-[#ffde00]/30 font-black text-lg p-5 uppercase placeholder:opacity-30"
                                    />
                                    <button
                                        type="submit"
                                        disabled={redeemProcessing}
                                        className="px-10 py-5 bg-black text-white font-black rounded-2xl hover:bg-[#be1e2d] transition-all uppercase tracking-widest text-[10px] shadow-xl flex items-center gap-3"
                                    >
                                        {redeemProcessing && (
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        )}
                                        {redeemProcessing ? 'Verifying...' : 'Redeem'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-10">
                        {/* Pay Per View */}
                        <div className="bg-white p-12 rounded-[4rem] shadow-xl border border-black/5 hover:border-[#be1e2d]/20 transition-all flex flex-col group">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-4">A La Carte</span>
                            <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic mb-6">Archive Ticket</h3>
                            <div className="mb-10 flex items-baseline gap-1">
                                <span className="text-5xl font-black text-gray-900">$1.00</span>
                                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">/ edition</span>
                            </div>
                            <ul className="space-y-6 mb-12 flex-grow">
                                <li className="flex items-center gap-3 text-xs font-black uppercase tracking-tight text-gray-600">
                                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                                        <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    Lifetime ownership
                                </li>
                                <li className="flex items-center gap-3 text-xs font-black uppercase tracking-tight text-gray-600">
                                    <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                                        <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    Universal reader access
                                </li>
                            </ul>
                            <a href={route('documents.index')} className="text-center py-5 bg-[#f4f1ea] text-gray-900 font-black rounded-3xl hover:bg-black hover:text-white transition-all uppercase tracking-widest text-[10px]">
                                Browse Archives
                            </a>
                        </div>

                        {/* Subscription Plans */}
                        {plans.map((plan) => (
                            <div key={plan.id} className="bg-white p-12 rounded-[4rem] shadow-2xl border-4 border-black relative overflow-hidden flex flex-col transform hover:-translate-y-4 transition-all group">
                                <div className="absolute top-0 right-0 bg-black text-white px-8 py-3 rounded-bl-[2rem] font-black text-[9px] uppercase tracking-[0.3em]">
                                    Unlimited
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#be1e2d] mb-4">{plan.duration_days} Day Pass</span>
                                <h3 className="text-4xl font-black text-gray-900 uppercase tracking-tighter italic mb-6 leading-none">{plan.name}</h3>
                                <div className="mb-10 flex items-baseline gap-1">
                                    <span className="text-5xl font-black text-gray-900 font-sans tracking-tighter">${plan.price}</span>
                                    <span className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">/ one-time</span>
                                </div>
                                <p className="text-[11px] font-bold text-gray-500 mb-10 uppercase tracking-tight leading-relaxed italic opacity-80">
                                    {plan.description}
                                </p>
                                <ul className="space-y-6 mb-12 flex-grow">
                                    <li className="flex items-center gap-3 text-xs font-black uppercase tracking-tight text-gray-900">
                                        <div className="w-5 h-5 bg-[#be1e2d] rounded-full flex items-center justify-center shrink-0">
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        All Digital Editions
                                    </li>
                                    <li className="flex items-center gap-3 text-xs font-black uppercase tracking-tight text-gray-900">
                                        <div className="w-5 h-5 bg-[#be1e2d] rounded-full flex items-center justify-center shrink-0">
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        Cross-Device Sync
                                    </li>
                                </ul>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => handleSubscription(plan.id, 'stripe')}
                                        className="w-full py-6 bg-[#be1e2d] text-white font-black rounded-3xl hover:bg-black transition-all shadow-xl shadow-red-500/20 uppercase tracking-[0.2em] text-[10px]"
                                    >
                                        Debit / Credit Card
                                    </button>
                                    <button
                                        onClick={() => handleSubscription(plan.id, 'paypal')}
                                        className="w-full py-6 bg-white text-black border-2 border-black/10 font-black rounded-3xl hover:bg-[#0070ba] hover:text-white hover:border-transparent transition-all uppercase tracking-[0.2em] text-[10px]"
                                    >
                                        PayPal Checkout
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-32 text-center border-t border-black/5 pt-12">
                        <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-[8px] flex items-center justify-center gap-4">
                            <span>SECURE ENCRYPTION</span>
                            <span className="w-1 H-1 bg-gray-300 rounded-full"></span>
                            <span>UNIVERSAL ACTIVATION</span>
                            <span className="w-1 H-1 bg-gray-300 rounded-full"></span>
                            <span>24/7 SUPPORT</span>
                        </p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
