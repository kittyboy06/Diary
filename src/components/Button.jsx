import React from 'react';

const Button = ({ children, onClick, className = '', ...props }) => {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-all ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
