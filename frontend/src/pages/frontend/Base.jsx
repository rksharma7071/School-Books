import { useContext, useState } from 'react';
import { Outlet, useNavigation } from 'react-router-dom'
import Header from '../../components/frontend/Header.jsx';
import Footer from '../../components/frontend/Footer.jsx';
import StatusMessage from '../../components/frontend/StatusMessage.jsx';
import { BookContext } from '../../context/School.jsx';
import Loading from '../../components/UI/Loading.jsx';

function Base() {
    const { toastConfig, showToast, setShowToast, loading } = useContext(BookContext);
    const navigation = useNavigation();

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