import React from 'react'
import { Link } from 'react-router-dom'

const Categories = () => {
    console.log("Categories");
    
    return (
        <section className="py-14 bg-slate-50 dark:bg-slate-900/50 transition-colors">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Shop by Category</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Find the right books for every subject</p>
                    </div>
                    <Link to={''} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">View All →</Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <Link to={''} className="category-card bg-white dark:bg-gray-800 rounded-2xl p-5 text-center border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl">
                        <div className="text-4xl mb-2">📐</div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Mathematics</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">128 books</p>
                    </Link>
                    <Link to={''} className="category-card bg-white dark:bg-gray-800 rounded-2xl p-5 text-center border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl">
                        <div className="text-4xl mb-2">🔬</div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Science</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">96 books</p>
                    </Link>
                    <Link to={''} className="category-card bg-white dark:bg-gray-800 rounded-2xl p-5 text-center border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl">
                        <div className="text-4xl mb-2">📖</div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">English</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">74 books</p>
                    </Link>
                    <Link to={''} className="category-card bg-white dark:bg-gray-800 rounded-2xl p-5 text-center border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl">
                        <div className="text-4xl mb-2">🌍</div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Social Science</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">62 books</p>
                    </Link>
                    <Link to={''} className="category-card bg-white dark:bg-gray-800 rounded-2xl p-5 text-center border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl">
                        <div className="text-4xl mb-2">🧪</div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Competitive</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">43 books</p>
                    </Link>
                    <Link to={''} className="category-card bg-white dark:bg-gray-800 rounded-2xl p-5 text-center border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-xl">
                        <div className="text-4xl mb-2">🎯</div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Entrance Exams</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">37 books</p>
                    </Link>
                </div>
            </div>
        </section>
    )
}

export default Categories
