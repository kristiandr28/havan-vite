import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { BiCreditCard, BiCopy, BiCheckCircle, BiImageAdd, BiCloudUpload, BiX, BiLoaderAlt } from 'react-icons/bi';
import { BsBank } from 'react-icons/bs';

function SwiftCodePage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const session = location.state;
  const bankDetails = session?.bankDetails;
  const amount = session?.finalPrice;
  const bankCurrency = bankDetails?.bankCurrency || '-';

  const [copyStatus, setCopyStatus] = useState({});
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!uploadFile) {
      setPreviewUrl('');
      return;
    }
    const objectUrl = URL.createObjectURL(uploadFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [uploadFile]);

  useEffect(() => {
    if (showSuccessModal && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
    if (countdown === 0) {
      navigate('/');
    }
  }, [showSuccessModal, countdown, navigate]);

  const showMessage = (message, type = 'success') => {
    console.log(`Message (${type}): ${message}`);
  };

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyStatus({ ...copyStatus, [fieldName]: true });
      showMessage(`${fieldName} copied to clipboard!`);
      setTimeout(() => {
        setCopyStatus({ ...copyStatus, [fieldName]: false });
      }, 2000);
    });
  };

  const renderValue = (value) => {
    if (value === null || value === undefined) return '-';
    return value;
  };

  const sendProofToBackend = async (proofUrl) => {
    try {
      const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/upload-proof`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentProofUrl: proofUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to update booking with payment proof.');
      }

      console.log('Booking successfully updated with payment proof URL.');
    } catch (error) {
      console.error('Error sending proof to backend:', error);
      showMessage('Failed to save payment proof to booking.', 'error');
    }
  };

  const handleUploadProof = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      showMessage('Please select an image to upload.', 'error');
      return;
    }
    setUploading(true);
    try {
      const response = await fetch('http://localhost:5000/api/cloudinary-signature');
      const { signature, timestamp, cloudName, apiKey, folder } = await response.json();
      
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp);
      formData.append('signature', signature);
      formData.append('folder', folder);

      const cloudinaryResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await cloudinaryResponse.json();
      
      if (data.secure_url) {
        console.log('Uploaded image URL:', data.secure_url);
        
        await sendProofToBackend(data.secure_url);

        showMessage('Payment proof uploaded successfully!', 'success');
        setShowUploadModal(false);
        setCountdown(3);
        setShowSuccessModal(true); 

      } else {
        showMessage('Failed to upload image. Please try again.', 'error');
      }

    } catch (error) {
      console.error('Upload error:', error);
      showMessage('An error occurred during upload. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  if (!bankDetails || !bookingId) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-red-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error: Payment Details Missing
          </h1>
          <p className="text-gray-700 mb-6">
            Failed to load payment details. Please return to the checkout page.
          </p>
          <button
            onClick={() => navigate(`/checkout/${bookingId}`)}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Go Back to Checkout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 py-8 px-4 sm:px-6 lg:px-8 pt-20">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-havanaBlue mb-2 text-center">
          <BsBank className="inline-block mr-2 text-havanaBlue text-3xl" />
          Swift Code Payment Details
        </h1>
        <p className="text-center text-gray-500 mb-6">
          Complete your payment via international bank transfer.
        </p>

        <div
          className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 mb-6 rounded-md"
          role="alert"
        >
          <p className="font-bold">Important Instructions:</p>
          <p className="text-sm mt-1">
            Please transfer the exact amount of{' '}
            <span className="font-bold text-lg">
              {bankCurrency} {amount ? amount.toLocaleString('en-US') : '-'}
            </span>
            .
            <br />
            Note down all the details below and provide them to your bank.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gray-100 rounded-lg shadow-inner">
            <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
              <BsBank className="mr-2 text-lg text-gray-600" />
              Bank Information
            </h2>
            <ul className="text-sm sm:text-base text-gray-700 space-y-2">
              {bankDetails?.bankName && (
                <li>
                  <span className="font-semibold">Bank Name:</span>{' '}
                  {renderValue(bankDetails.bankName)}
                </li>
              )}
              {bankDetails?.bankAddress && (
                <li>
                  <span className="font-semibold">Bank Address:</span>{' '}
                  {renderValue(bankDetails.bankAddress)}
                </li>
              )}
              {bankDetails?.swiftCode && (
                <li>
                  <span className="font-semibold">Swift Code:</span>{' '}
                  {renderValue(bankDetails.swiftCode)}
                </li>
              )}
              {bankDetails?.intermediaryBank?.bankName && (
                <li>
                  <span className="font-semibold">Intermediary Bank:</span>{' '}
                  {bankDetails.intermediaryBank.bankName} (SWIFT: {bankDetails.intermediaryBank.swiftCode})
                </li>
              )}
            </ul>
          </div>

          <div className="p-4 bg-gray-100 rounded-lg shadow-inner">
            <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
              <BiCreditCard className="mr-2 text-lg text-gray-600" />
              Account Details
            </h2>
            <ul className="text-sm sm:text-base text-gray-700 space-y-2">
              {bankDetails?.accountNumber && (
                <li className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold">Account Number:</span>{' '}
                    {renderValue(bankDetails.accountNumber)}
                  </div>
                  <button
                    onClick={() =>
                      handleCopy(bankDetails.accountNumber, 'Account Number')
                    }
                    className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200 text-xs sm:text-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={copyStatus['Account Number']}
                  >
                    {copyStatus['Account Number'] ? (
                      <BiCheckCircle className="mr-1" />
                    ) : (
                      <BiCopy className="mr-1" />
                    )}
                    {copyStatus['Account Number'] ? 'Copied!' : 'Copy'}
                  </button>
                </li>
              )}
              {bankDetails?.accountName && (
                <li>
                  <span className="font-semibold">Account Name:</span>{' '}
                  {renderValue(bankDetails.accountName)}
                </li>
              )}
              {bankDetails?.beneficiaryAddress && (
                <li>
                  <span className="font-semibold">Beneficiary Address:</span>{' '}
                  {renderValue(bankDetails.beneficiaryAddress)}
                </li>
              )}
              {bankCurrency && (
                <li>
                  <span className="font-semibold">Currency:</span>{' '}
                  {renderValue(bankCurrency)}
                </li>
              )}
            </ul>
          </div>
        </div>

        {bankDetails?.notes && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-bold text-yellow-800">Notes:</h3>
            <p className="text-sm text-yellow-700 mt-1">
              {renderValue(bankDetails.notes)}
            </p>
          </div>
        )}

        <div className="text-center mt-8">
          <button
            onClick={() => setShowUploadModal(true)}
            className="w-full max-w-xs py-2.5 bg-havanaBlue text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300 text-base sm:text-lg flex items-center justify-center"
          >
            <BiCheckCircle className="mr-2 text-xl" />
            I've made the transfer
          </button>
          <p className="text-xs text-gray-500 mt-2">
            After the transfer, please allow some time for the payment to be
            verified.
          </p>
        </div>
      </div>

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Upload Payment Proof</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <BiX size={24} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Please upload a clear image of your transfer receipt to confirm your payment.
            </p>
            <form onSubmit={handleUploadProof}>
              <div className="mb-4">
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                     onClick={() => document.getElementById('fileInput').click()}>
                  {!previewUrl && (
                    <>
                      <BiImageAdd size={48} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        Click to select a file
                      </p>
                    </>
                  )}
                  {previewUrl && (
                    <img src={previewUrl} alt="Preview" className="mx-auto max-h-48 object-contain rounded-md" />
                  )}
                </div>
                {uploadFile && (
                  <p className="text-sm text-gray-600 mt-2 text-center">{uploadFile.name}</p>
                )}
                <input
                  id="fileInput"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="hidden"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={uploading || !uploadFile}
              >
                {uploading ? (
                  <>
                    <BiLoaderAlt className="animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <BiCloudUpload className="mr-2 text-xl" />
                    Upload Proof
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 text-center">
            <BiCheckCircle className="mx-auto text-green-500 mb-4 animate-bounce" size={64} />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Upload Successful!</h3>
            <p className="text-gray-600 mb-4">
              Your payment proof has been successfully uploaded. We will verify your payment shortly.
            </p>
            <p className="text-sm text-gray-500 font-semibold">
              Returning to the main page in {countdown} seconds...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SwiftCodePage;