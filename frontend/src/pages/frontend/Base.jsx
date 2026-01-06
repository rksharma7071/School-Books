import { useContext, useState } from 'react';
import { Outlet } from 'react-router-dom'
import Header from '../../components/frontend/Header.jsx';
import Footer from '../../components/frontend/Footer.jsx';
import StatusMessage from '../../components/frontend/StatusMessage.jsx';
import { BookContext } from '../../context/School.jsx';

function Base() {
    const { toastConfig, showToast, setShowToast, } = useContext(BookContext);

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
            <Footer />
        </>

    )
}

export default Base