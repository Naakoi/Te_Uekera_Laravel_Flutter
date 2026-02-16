import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

export default function Index({ auth, plans, currentSubscription }) {

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

                    <div className="text-center mb-16">
                        <h1 className="text-5xl font-black text-gray-900 uppercase tracking-tighter italic mb-4">Choose Your Access Level</h1>
                        <p className="text-xl text-gray-500 font-bold uppercase tracking-widest opacity-60 max-w-2xl mx-auto">
                            Unlock full archive access with our premium membership plans.
                        </p>
                    </div>

                    {currentSubscription && (
                        <div className="mb-12 bg-[#be1e2d] text-white p-8 rounded-[2rem] shadow-2xl flex flex-col md:flex-row justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Active Subscription: {currentSubscription.plan?.name}</h2>
                                <p className="font-bold opacity-80 mt-1">Valide until: {new Date(currentSubscription.ends_at).toLocaleDateString()}</p>
                            </div>
                            <div className="mt-4 md:mt-0 px-6 py-2 bg-white text-[#be1e2d] font-black rounded-full uppercase text-xs tracking-widest">
                                Premium Member
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {/* Pay Per View Option (Mocked or real based on current doc flow) */}
                        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-black/5 hover:scale-105 transition-all flex flex-col h-full">
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-2">One-Time Access</span>
                            <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic mb-4">Individual Archive</h3>
                            <div className="mb-8">
                                <span className="text-4xl font-black text-gray-900">$1.00</span>
                                <span className="text-gray-400 font-bold uppercase text-xs ml-2">/ per doc</span>
                            </div>
                            <ul className="space-y-4 mb-10 flex-grow text-sm font-bold text-gray-600 uppercase tracking-wider">
                                <li className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                                    Lifetime access to specific edition
                                </li>
                                <li className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                                    High-resolution digital reader
                                </li>
                            </ul>
                            <a href={route('documents.index')} className="text-center py-4 bg-gray-100 text-gray-900 font-black rounded-2xl hover:bg-gray-200 transition-all uppercase tracking-widest text-xs">
                                Browse Archives
                            </a>
                        </div>

                        {/* Dynamic Subscription Plans */}
                        {plans.map((plan) => (
                            <div key={plan.id} className="bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-[#be1e2d] relative overflow-hidden flex flex-col h-full transform hover:-translate-y-2 transition-all">
                                <div className="absolute top-0 right-0 bg-[#be1e2d] text-white px-6 py-2 rounded-bl-3xl font-black text-[10px] uppercase tracking-widest">
                                    Most Popular
                                </div>
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#be1e2d] mb-2">{plan.duration_days} Days Access</span>
                                <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic mb-4">{plan.name}</h3>
                                <div className="mb-8">
                                    <span className="text-4xl font-black text-gray-900">${plan.price}</span>
                                    <span className="text-gray-400 font-bold uppercase text-xs ml-2">/ one-time payment</span>
                                </div>
                                <p className="text-sm font-bold text-gray-500 mb-8 uppercase tracking-tight leading-relaxed">
                                    {plan.description}
                                </p>
                                <div className="space-y-4 mb-10 flex-grow">
                                    <ul className="space-y-4 text-sm font-bold text-gray-600 uppercase tracking-wider">
                                        <li className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                                            Unlimited archive access
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>
                                            No per-document fees
                                        </li>
                                    </ul>
                                </div>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => handleSubscription(plan.id, 'stripe')}
                                        className="w-full py-5 bg-[#be1e2d] text-white font-black rounded-3xl hover:bg-black transition-all shadow-xl shadow-red-500/20 uppercase tracking-[0.2em] text-[10px]"
                                    >
                                        Subscribe via Stripe
                                    </button>
                                    <button
                                        onClick={() => handleSubscription(plan.id, 'paypal')}
                                        className="w-full py-5 bg-black text-white font-black rounded-3xl hover:bg-[#0070ba] transition-all shadow-xl uppercase tracking-[0.2em] text-[10px]"
                                    >
                                        Subscribe via PayPal
                                    </button>
                                </div>
                            </div>
                        ))}

                    </div>

                    <div className="mt-20 text-center">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                            Secure payments processed through Stripe and PayPal. All transactions are encrypted.
                        </p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
