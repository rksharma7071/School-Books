import React from 'react'

function Loading({ text = "Loading..." }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#7EC4CC]/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
                <img
                    src="https://cdn.dribbble.com/userupload/20166759/file/original-f77ea42c152affea098191f743270208.gif"
                    className="w-32"
                    alt="Loading"
                />
                <p className="text-white font-semibold animate-pulse">{text}</p>
            </div>
        </div>
    )
}

export default Loading