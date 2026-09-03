import React from 'react'

const FeaturesBanner = () => {
    return (
        <section className="py-12 bg-blue-950 border-y border-blue-900/60">
            <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div className="flex flex-col items-center">
                    <div className="text-3xl mb-2">🚚</div>
                    <p className="text-white font-semibold text-sm">Free Shipping</p>
                    <p className="text-blue-200 text-xs">On orders above ₹499</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className="text-3xl mb-2">🔄</div>
                    <p className="text-white font-semibold text-sm">Easy Returns</p>
                    <p className="text-blue-200 text-xs">7-day return policy</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className="text-3xl mb-2">💳</div>
                    <p className="text-white font-semibold text-sm">Secure Payment</p>
                    <p className="text-blue-200 text-xs">100% protected</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className="text-3xl mb-2">📞</div>
                    <p className="text-white font-semibold text-sm">24/7 Support</p>
                    <p className="text-blue-200 text-xs">We're here to help</p>
                </div>
            </div>
        </section>
    )
}

export default FeaturesBanner