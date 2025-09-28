import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BiImage } from 'react-icons/bi';

function PhotoGallery({ openDetailModal, BACKEND_URL: appBackendUrl }) {
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');

  const effectiveBackendUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchPhotos();
  }, [effectiveBackendUrl]);

  const fetchPhotos = async () => {
    try {
      const response = await axios.get(`${effectiveBackendUrl}/api/photos`);
      console.log('Fetched photos:', response.data.map((p) => ({ _id: p._id, filename: p.filename, path: p.path })));
      setPhotos(response.data);
    } catch (err) {
      setError('Failed to fetch photos');
      console.error('Photo fetch error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <h2 className="text-3xl font-bold text-havanaGray mb-6 flex items-center">
          <BiImage className="mr-2 text-havanaPink" />
          Explore Our Gallery
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <div
              key={photo._id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
              {photo.path ? (
                <img
                  src={`${effectiveBackendUrl}${photo.path}`}
                  alt={photo.filename}
                  className="w-full h-48 sm:h-40 object-cover"
                  onError={(e) => {
                    console.error(`Image loading error for ${photo.filename}:`, `${effectiveBackendUrl}${photo.path}`);
                    e.target.src = 'https://www.shorekids.co.nz/wp-content/uploads/2014/08/image-placeholder.jpg';
                  }}
                />
              ) : (
                <div className="w-full h-48 sm:h-40 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">No Image Available</span>
                </div>
              )}
              <div className="p-6 sm:p-4">
                <p className="text-gray-600 mt-2 text-sm">
                  Uploaded: {new Date(photo.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => openDetailModal(photo, 'photo')}
                    className="bg-havanaBlue text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors duration-200"
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PhotoGallery;