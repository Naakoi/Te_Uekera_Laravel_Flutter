import { v4 as uuidv4 } from 'uuid';

export const getDeviceId = () => {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
};

export const checkActivationStatus = async (document_id = null) => {
    const device_id = getDeviceId();
    try {
        const response = await fetch('/redeem-code/status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
            },
            body: JSON.stringify({ device_id, document_id }),
        });
        const data = await response.json();
        return data.activated;
    } catch (error) {
        console.error('Failed to check activation status:', error);
        return false;
    }
};
