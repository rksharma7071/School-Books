import { Outlet } from 'react-router-dom'
import Header from '../../components/frontend/Header';
import Footer from '../../components/frontend/Footer';
import StatusMessage from '../../components/frontend/StatusMessage';
import { useContext, useState } from 'react';
import { BookContext } from '../../context/School';

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