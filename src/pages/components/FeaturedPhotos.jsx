import React from "react";
import { BiImage } from 'react-icons/bi';

function FeaturedPhotos({ photos, openModal, BACKEND_URL }) {
  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold text-havanaGray mb-6 flex items-center">
        <BiImage className="mr-2 text-havanaPink" />
        Featured Photos
      </h2>
      {photos.length === 0 ? (
        <p className="text-gray-600">No photos available at the moment.</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {photos.slice(0, 18).map((photo) => (
            <div
              key={photo._id}
              className="relative overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer"
              onClick={() => openModal(photo)}
            >
              <img
                src={`${BACKEND_URL}${photo.path}`}
                alt={photo.filename}
                className="w-full h-32 object-cover"
                onError={(e) => {
                  console.error(`Image loading error for ${photo.filename}:`, `${BACKEND_URL}${photo.path}`);
                  e.target.src = 'https://www.shorekids.co.nz/wp-content/uploads/2014/08/image-placeholder.jpg';
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FeaturedPhotos;