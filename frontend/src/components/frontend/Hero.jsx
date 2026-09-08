import React from 'react'
import { Link } from 'react-router-dom'

const Hero = () => {
    console.log("Hero");
    
    return (
        <section className="relative bg-gradient-to-r from-blue-950 via-blue-900 to-blue-950 text-white overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48cGF0aCBkPSJNMzAgMTVMMTUgMzBsMTUgMTUgMTUtMTV6IiBmaWxsPSIjZmZmIi8+PC9zdmc+')] bg-repeat"></div>
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-24 flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="text-center md:text-left max-w-2xl">
                    <span className="inline-block bg-blue-800/60 backdrop-blur-sm text-blue-200 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-blue-700/50">📚 New Academic Year 2026</span>
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                        Find Your <span className="text-yellow-300">Perfect</span> School Book
                    </h1>
                    <p className="mt-4 text-blue-200 text-lg max-w-lg mx-auto md:mx-0">Thousands of textbooks, guides &amp; exam prep materials at the best prices. Free shipping on orders above ₹499.</p>
                    <div className="mt-8 flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <Link href="#bestsellers" className="px-8 py-3.5 bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-semibold rounded-xl shadow-lg shadow-yellow-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                            Explore Now
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        </Link>
                        <Link href="#categories" className="px-8 py-3.5 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-medium rounded-xl border border-white/20 transition-all">Browse Categories</Link>
                    </div>
                    <div className="mt-8 flex items-center gap-6 text-sm text-blue-200 justify-center md:justify-start">
                        <span className="flex items-center gap-1.5"><span className="text-yellow-300 text-lg">★</span> 4.8/5 from 2.4k+ reviews</span>
                        <span className="w-px h-5 bg-blue-700"></span>
                        <span>🚚 Free delivery</span>
                        <span className="w-px h-5 bg-blue-700 hidden sm:block"></span>
                        <span className="hidden sm:block">📖 5000+ titles</span>
                    </div>
                </div>
                <div className="relative shrink-0 hidden md:block">
                    <div className="w-64 h-64 lg:w-80 lg:h-80 rounded-2xl bg-gradient-to-br from-yellow-300/20 to-blue-400/20 backdrop-blur-sm border border-white/10 flex items-center justify-center p-6 shadow-2xl">
                        <div className="text-center">
                            <div className="text-7xl mb-3">📘</div>
                            <p className="text-2xl font-bold text-white">30% OFF</p>
                            <p className="text-sm text-blue-200">on all NCERT books</p>
                            <span className="inline-block mt-3 px-4 py-1.5 bg-red-500/80 text-white text-xs font-semibold rounded-full">Limited Time</span>
                        </div>
                    </div>
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-yellow-400/20 rounded-full blur-2xl"></div>
                    <div className="absolute -top-4 -left-4 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl"></div>
                </div>
            </div>
        </section>
    )
}

export default Hero