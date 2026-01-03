import React, { useState, useEffect } from 'react';
import { getSecureImageUrl } from '../lib/entryService';
import Skeleton from './Skeleton';

const SecureImage = ({ path, alt, className }) => {
    const [src, setSrc] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchImage = async () => {
            if (!path) {
                setLoading(false);
                return;
            }
            // If it's already a full http URL (e.g. external or legacy public) and not our storage path
            if (path.startsWith('http') && !path.includes('storage/v1/object/public')) {
                setSrc(path);
                setLoading(false);
                return;
            }

            const url = await getSecureImageUrl(path);
            if (isMounted) {
                setSrc(url);
                setLoading(false);
            }
        };

        fetchImage();
        return () => { isMounted = false; };
    }, [path]);

    if (loading) {
        return <Skeleton className={`rounded-lg ${className}`} />;
    }

    if (!src) return null;

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            loading="lazy"
        />
    );
};

export default SecureImage;
