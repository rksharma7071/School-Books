import { useContext, useState } from 'react';
import { Outlet, useNavigation } from 'react-router-dom'
import Header from '../../components/frontend/Header.jsx';
import Footer from '../../components/frontend/Footer.jsx';
import StatusMessage from '../../components/frontend/StatusMessage.jsx';
import { BookContext } from '../../context/School.jsx';
import Loading from '../../components/UI/Loading.jsx';
import { useSEO } from '../../seo/SEO.jsx';

function Base() {
    const { toastConfig, showToast, setShowToast, loading } = useContext(BookContext);
    const navigation = useNavigation();

    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "SchoolBook",
        "url": "https://www.schoolbook.lol/",
        "potentialAction": {
            "@type": "SearchAction",
            "target": "https://www.schoolbook.lol/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
        }
    };

    return (
        <>
            <Header />
            <Outlet />
            {showToast && (
                <StatusMessage
                    type={toastConfig.type}
                    title={toastConfig.title}
                    message={toastConfig.message}
                    onClose={() => setShowToast(false)}
                />
            )}
            {(navigation.state === "loading" || loading) && <Loading />}
            <Footer />
        </>

    )
}

export default Base
