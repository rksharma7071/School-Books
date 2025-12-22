import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../../components/frontend/Header';
import Header1 from '../../components/frontend/Header1';

function Base() {
    return (
        <>
            <Header />
            {/* <Header1 /> */}
            <Outlet />
        </>

    )
}

export default Base