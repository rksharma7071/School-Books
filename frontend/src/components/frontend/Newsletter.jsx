import React from 'react'

const Newsletter = () => {
    return (
        <section className="py-14 bg-gradient-to-r from-blue-900 to-blue-950 text-white">
            <div className="max-w-3xl mx-auto px-4 text-center">
                <h2 className="text-2xl sm:text-3xl font-bold">📬 Subscribe to Our Newsletter</h2>
                <p className="mt-2 text-blue-200">Get the latest book releases, exclusive discounts &amp; study tips.</p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
                    <input type="email" id="newsletterInput" placeholder="Enter your email" className="flex-1 px-5 py-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-blue-300/70 focus:outline-none focus:border-yellow-400/60 transition-colors newsletter-input" />
                    <button id="newsletterBtn" className="px-8 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-semibold rounded-xl shadow-lg shadow-yellow-500/30 transition-all hover:scale-105 active:scale-95">Subscribe</button>
                </div>
                <p className="mt-3 text-xs text-blue-300">No spam, unsubscribe anytime.</p>
            </div>
        </section>
    )
}

export default Newsletter