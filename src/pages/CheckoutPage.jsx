import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BiLoaderAlt, BiCreditCard, BiDollar, BiTag } from 'react-icons/bi';
import { BsBank, BsCreditCard } from 'react-icons/bs';

// Receives currentUser as a prop
function CheckoutPage({ currentUser }) {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [bookingDetails, setBookingDetails] = useState(null);
    const [activeProvider, setActiveProvider] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFetchingProvider, setIsFetchingProvider] = useState(true);
    const [error, setError] = useState('');
    const [voucherCode, setVoucherCode] = useState('');
    const [discount, setDiscount] = useState(0);
    const [voucherError, setVoucherError] = useState('');
    const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
    const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

    // This should be your backend URL
    const BACKEND_URL = import.meta.env.VITE_API_URL;

    // Use a custom message box instead of alert, as per instructions
    const showMessage = (message, type = 'success') => {
        // Implement your custom message box UI here, e.g., a modal or a toast notification.
        // For this example, we'll just log it.
        console.log(`Message (${type}): ${message}`);
    };

    // A single useEffect to handle all initial data fetching
    useEffect(() => {
        if (!currentUser || !currentUser.id) {
            navigate('/login');
            return;
        }

        if (!bookingId) {
            setError('Booking ID is missing from the URL. Please go back and select a booking.');
            setLoading(false);
            return;
        }

        // Fetch both provider and booking details in parallel
        const fetchData = async () => {
            setLoading(true);
            setError('');
            setIsFetchingProvider(true);

            // Fetch active payment provider
            try {
                const providerResponse = await axios.get(`${BACKEND_URL}/api/payment-settings`);
                setActiveProvider(providerResponse.data.provider);
            } catch (err) {
                console.error('Error fetching payment provider:', err);
                setActiveProvider(null);
                setError('Failed to fetch payment provider settings. Please try again.');
            } finally {
                setIsFetchingProvider(false);
            }

            // Fetch booking details
            try {
                const token = localStorage.getItem('authToken');
                if (!token) {
                    setError('Authentication token not found. Please log in.');
                    navigate('/login');
                    setLoading(false);
                    return;
                }
                const bookingResponse = await axios.get(`${BACKEND_URL}/api/bookings/${bookingId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setBookingDetails(bookingResponse.data);
            } catch (err) {
                console.error('Error fetching booking details:', err);
                const errorMessage = err.response?.data.message || 'Failed to fetch booking details. Please try again.';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [bookingId, currentUser, navigate, BACKEND_URL]);

    const handleApplyVoucher = async () => {
        if (!voucherCode.trim()) {
            setVoucherError('Please enter a voucher code.');
            return;
        }
        setIsApplyingVoucher(true);
        setVoucherError('');
        setDiscount(0);

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setVoucherError('Authentication token not found. Please log in.');
                navigate('/login');
                return;
            }

            const response = await axios.post(
                `${BACKEND_URL}/api/vouchers/apply`,
                {
                    code: voucherCode,
                    bookingId: bookingId,
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            setDiscount(response.data.discountAmount);
            setVoucherError('');
            showMessage(`Voucher applied successfully! You got a discount of ${bookingDetails.currency} ${response.data.discountAmount.toLocaleString('en-US')}.`);

        } catch (err) {
            console.error('Error applying voucher:', err);
            setDiscount(0);
            setVoucherError(err.response?.data.message || 'Failed to apply voucher. Please check the code.');
        } finally {
            setIsApplyingVoucher(false);
        }
    };

    const handlePayment = async () => {
        if (!bookingDetails || !activeProvider) {
            setError('Missing booking details or payment provider configuration.');
            return;
        }

        setIsPaymentProcessing(true);
        setError('');

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setError('Authentication token not found. Please log in.');
                navigate('/login');
                return;
            }

            let response;
            if (activeProvider === 'xendit') {
                // Xendit payment flow
                response = await axios.post(
                    `${BACKEND_URL}/api/payments/create-checkout-session`,
                    {
                        bookingId: bookingId,
                        appliedDiscount: discount,
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                if (response.data.paymentUrl) {
                    window.location.href = response.data.paymentUrl; // Redirect to Xendit
                } else {
                    setError('Failed to get payment URL. Please try again.');
                }
            } else if (activeProvider === 'swiftcode') {
                // Swiftcode payment flow
                response = await axios.post(
                    `${BACKEND_URL}/api/payments/create-swiftcode-session`,
                    {
                        bookingId: bookingId,
                        appliedDiscount: discount,
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );
                // Assuming the backend returns the bank details directly
                if (response.data.bankDetails) {
                    // Navigate to a new page to display the swift code details
                    navigate(`/payment-details/${bookingId}`, { state: { bankDetails: response.data.bankDetails, finalPrice: finalPrice } });
                } else {
                    setError('Failed to get swift code details. Please try again.');
                }
            } else {
                setError('No active payment provider configured.');
            }

        } catch (err) {
            console.error('Error initiating payment:', err);
            setError(err.response?.data.message || 'Payment initiation failed. Please try again.');
        } finally {
            setIsPaymentProcessing(false);
        }
    };

    const subtotal = bookingDetails?.totalPrice || 0;
    const finalPrice = subtotal - discount;

    if (loading || isFetchingProvider) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <BiLoaderAlt className="animate-spin text-havanaBlue text-5xl" />
                <p className="ml-4 text-havanaBlue text-lg">Loading details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-red-50 p-4">
                <p className="text-red-700 text-xl font-semibold mb-4">Error:</p>
                <p className="text-red-600 text-center">{error}</p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-6 px-5 py-2 bg-havanaBlue text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors duration-200 text-sm"
                >
                    Back to Home
                </button>
            </div>
        );
    }

    if (!bookingDetails) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-50 p-4">
                <p className="text-gray-700 text-xl font-semibold mb-4">Booking Not Found</p>
                <p className="text-gray-600 text-center">The booking you are looking for does not exist or you do not have access.</p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-6 px-5 py-2 bg-havanaBlue text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors duration-200 text-sm"
                >
                    Back to Home
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-8 px-4 sm:px-6 lg:px-8 pt-20">
            <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md p-4 sm:p-6 lg:p-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-havanaBlue mb-5 text-center">
                    <BiCreditCard className="inline-block mr-2 text-havanaBlue text-3xl" />
                    Complete Your Payment
                </h1>

                <div className="mb-6 border-b pb-4 border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-3">Booking Summary</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-700 text-xs sm:text-sm">
                        <div>
                            <p><span className="font-semibold">Booking ID:</span> {bookingDetails._id}</p>
                            <p><span className="font-semibold">Booking Date:</span> {new Date(bookingDetails.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p><span className="font-semibold">Status:</span> <span className="capitalize text-green-700 font-medium">{bookingDetails.status}</span></p>
                            <p><span className="font-semibold">Payment Status:</span> <span className="capitalize text-blue-700 font-medium">{bookingDetails.paymentStatus || 'Pending'}</span></p>
                        </div>
                        <div>
                            <p><span className="font-semibold">Customer Name:</span> {currentUser?.username || 'N/A'}</p>
                            <p><span className="font-semibold">Customer Email:</span> {currentUser?.email || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-3">Order Details</h2>
                    <ul className="divide-y divide-gray-200">
                        {bookingDetails.items.map((item, index) => (
                            <li key={index} className="py-3 flex justify-between items-center text-gray-700 text-xs sm:text-sm">
                                <div>
                                    {/* Defensive rendering to handle cases where itemId is an object with no name/title */}
                                    <p className="font-semibold">
                                        {item.itemId?.name || item.itemId?.title || item.itemId?.destination?.name || 'Unknown Item'}
                                    </p>
                                    <p className="text-gray-500">Quantity: {item.quantity}</p>
                                    {/* Ensure item.details is a valid array before attempting to render its content */}
                                    {Array.isArray(item.details) && item.details.length > 0 && (
                                        <p className="text-gray-500">
                                            Date: {new Date(item.details[0].date).toLocaleDateString('en-US')}
                                            {item.itemType === 'Tour' && item.details[0].pickupLocation
                                                ? `, Pickup: ${item.details[0].pickupLocation}`
                                                : ''}
                                        </p>
                                    )}
                                </div>
                                <span className="font-semibold">{bookingDetails.currency} {(item.price * item.quantity).toLocaleString('en-US')}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-base font-semibold text-blue-800 flex items-center mb-2">
                        <BiTag className="mr-2 text-lg" /> Apply Voucher
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            className="flex-grow p-1.5 text-sm border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-700"
                            placeholder="Enter voucher code"
                            value={voucherCode}
                            onChange={(e) => setVoucherCode(e.target.value)}
                            disabled={isApplyingVoucher || isPaymentProcessing}
                        />
                        <button
                            onClick={handleApplyVoucher}
                            className="flex-shrink-0 px-3 py-1.5 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm"
                            disabled={isApplyingVoucher || !voucherCode.trim() || isPaymentProcessing}
                        >
                            {isApplyingVoucher ? <BiLoaderAlt className="animate-spin mr-1.5 text-base" /> : null}
                            {isApplyingVoucher ? 'Applying...' : 'Apply Voucher'}
                        </button>
                    </div>
                    {voucherError && <p className="text-red-600 text-xs mt-1.5">{voucherError}</p>}
                </div>

                <div className="mb-6 border-t pt-4 border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800 mb-3">Price Summary</h2>
                    <div className="space-y-2 text-gray-700 text-sm sm:text-base">
                        <div className="flex justify-between">
                            <span>Subtotal:</span>
                            <span className="font-semibold">{bookingDetails.currency} {subtotal.toLocaleString('en-US')}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-green-600">
                                <span>Discount:</span>
                                <span className="font-semibold">- {bookingDetails.currency} {discount.toLocaleString('en-US')}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-bold text-havanaBlue mt-3 pt-2 border-t border-gray-200">
                            <span>Total Amount:</span>
                            <span>{bookingDetails.currency} {finalPrice.toLocaleString('en-US')}</span>
                        </div>
                    </div>
                </div>

                <div className="text-center">
                    <button
                        onClick={handlePayment}
                        className="w-full max-w-xs py-2.5 bg-havanaBlue text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300 text-base sm:text-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isPaymentProcessing}
                    >
                        {isPaymentProcessing ? <BiLoaderAlt className="animate-spin mr-2 text-xl" /> : <BiDollar className="mr-2 text-xl" />}
                        {isPaymentProcessing ? 'Processing Payment...' : `Pay Now ${bookingDetails.currency} ${finalPrice.toLocaleString('en-US')}`}
                    </button>
                    {activeProvider && (
                        <p className="mt-2 text-gray-500 text-sm">
                            You will be paying with:
                            <span className="font-semibold capitalize ml-1">{activeProvider}</span>
                            {activeProvider === 'xendit' ? (
                                <BsCreditCard className="inline-block ml-1" />
                            ) : (
                                <BsBank className="inline-block ml-1" />
                            )}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CheckoutPage;
