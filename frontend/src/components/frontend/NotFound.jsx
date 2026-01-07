import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function NotFound() {
    return (
        <>
            <Header />
            <div className="flex items-center justify-center bg-slate-50 px-6 py-18">
                <div className="text-center max-w-md">
                    <h1 className="text-7xl font-extrabold text-slate-900">404</h1>
                    <p className="mt-4 text-2xl font-semibold text-slate-700">Page not found</p>
                    <p className="mt-2 text-slate-500">Sorry, the page you are looking for doesn’t exist or has been moved.</p>
                    <div className="mt-6 flex justify-center gap-4">
                        <Link
                            to="/"
                            className="rounded-lg bg-slate-900 px-6 py-3 text-white font-medium hover:bg-slate-700 transition"
                        >
                            Go Home
                        </Link>

                        <button
                            onClick={() => window.history.back()}
                            className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-100 transition"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}
