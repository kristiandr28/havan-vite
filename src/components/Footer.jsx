import React, { useState, useEffect } from 'react';
// The previous attempt to use react-icons resulted in a build error
// because the icons were not found in the specified modules.
// To ensure the code compiles and runs, we will stick to using
// self-contained inline SVG icons.

const BACKEND_URL = import.meta.env.VITE_API_URL;

// This component fetches and displays dynamic contact information from a backend API.
// It is self-contained and does not require external file imports.

function Footer() {
  // State to hold the fetched contact data
  const [contactInfo, setContactInfo] = useState(null);
  // State to handle loading status
  const [isLoading, setIsLoading] = useState(true);
  // State to handle any fetch errors
  const [error, setError] = useState(null);

  // Helper function to return SVG icon components based on name
  const getIcon = (name) => {
    switch (name) {
      case 'instagram':
        return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.5" y1="6.5" y2="6.5"></line></svg>;
      case 'facebook':
        return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M14 10H17L18 14H14V22H9V14H6V10H9V8C9 5.86 10.224 4 13 4C14.004 4 15.008 4.224 16 4.672V8H14C12.896 8 12 8.896 12 10V10H14Z"></path></svg>;
      case 'twitter':
        return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M22.46 6c-.77.34-1.6.56-2.46.67.88-.53 1.56-1.37 1.88-2.37-.83.5-1.75.85-2.73 1.05-.78-.83-1.89-1.35-3.13-1.35-2.36 0-4.28 1.9-4.28 4.23 0 .33.04.66.1.97C8.12 9.4 4.3 7.37 1.76 4.22c-.35.6-.55 1.28-.55 2.01 0 1.47.74 2.76 1.87 3.52-.69-.02-1.34-.2-1.91-.53v.05c0 2.05 1.46 3.76 3.39 4.15-.35.1-.72.15-1.1.15-.27 0-.53-.02-.79-.08.54 1.68 2.1 2.91 3.96 2.95-1.45 1.13-3.28 1.8-5.27 1.8-.34 0-.68-.02-1.01-.06 1.87 1.2 4.09 1.9 6.47 1.9 7.74 0 11.96-6.4 11.96-11.95v-.54c.82-.6 1.52-1.35 2.08-2.2z"></path></svg>;
      case 'line':
        return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 12H19V17H16.5C14.332 17 12 15.15 12 13C12 10.85 14.332 9 16.5 9H19V11H16.5C15.08 11 13 12.15 13 13C13 13.85 14.08 15 16.5 15H17V12H16.5Z"></path><path d="M11.5 12H9V17H11.5C13.668 17 16 15.15 16 13C16 10.85 13.668 9 11.5 9H9V11H11.5C12.92 11 15 12.15 15 13C15 13.85 13.92 15 11.5 15H11V12H11.5Z"></path><path d="M12 0C5.373 0 0 5.373 0 12c0 6.627 5.373 12 12 12s12-5.373 12-12C24 5.373 18.627 0 12 0ZM12 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10Z"></path></svg>;
      case 'wechat':
        return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.47 2 2 6.47 2 12c0 2.83 1.13 5.4 2.97 7.37l-1.95 1.95a1 1 0 00.7 1.7h.01a1 1 0 00.7-.27L8 18.9c1.93 1.5 4.3 2.1 6.8 2.1 5.53 0 10-4.47 10-10S17.53 2 12 2zm-2 11c-.55 0-1-.45-1-1s.45-1 1-1h4c.55 0 1 .45 1 1s-.45 1-1 1h-4zm-2.45-3.5c-.32-.32-.78-.5-1.24-.5s-.92.18-1.24.5a1.75 1.75 0 00-2.5 1.25.5.5 0 00.5.5h.01c.28 0 .5-.22.5-.5a.75.75 0 011-.25c.36.12.87.12 1.24.25.32.1.58.29.84.55s.45.62.55.94a1.75 1.75 0 001.25 2.5a.5.5 0 00.5-.5v-.01c0-.28-.22-.5-.5-.5a.75.75 0 01-.25-1c.12-.36.12-.87.25-1.24.1-.32.29-.58.55-.84s.62-.45.94-.55a1.75 1.75 0 002.5-1.25.5.5 0 00-.5-.5h-.01c-.28 0-.5.22-.5.5a.75.75 0 01-1 .25c-.36-.12-.87-.12-1.24-.25-.32-.1-.58-.29-.84-.55z"></path></svg>;
      case 'envelope':
        return <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M2.003 5.884L10 11.432l7.997-5.548a1 1 0 00-1.24-1.574L10 9.568 3.243 4.31a1 1 0 00-1.24 1.574z" clipRule="evenodd" fillRule="evenodd"></path><path d="M18 8.167V16a2 2 0 01-2 2H4a2 2 0 01-2-2V8.167L10 13.432l8-5.265z" clipRule="evenodd" fillRule="evenodd"></path></svg>;
      case 'map-pin':
        return <svg className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path></svg>;
      default:
        return null;
    }
  };

  useEffect(() => {
    // An asynchronous function to fetch data from the API
    const fetchContactData = async () => {
      try {
        // The URL for the API endpoint.
        const response = await fetch(`${BACKEND_URL}/api/contacts`);

        // Check if the response was successful
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Assuming the API returns an array of contacts, we'll use the first one.
        if (data.length > 0) {
          setContactInfo(data[0]);
        } else {
          setContactInfo(null); // Set to null if no contacts are found
        }
      } catch (e) {
        // Catch and set any errors that occur during the fetch
        console.error("Failed to fetch contact information:", e);
        setError("Failed to load contact information.");
      } finally {
        // Ensure loading state is set to false regardless of success or failure
        setIsLoading(false);
      }
    };

    fetchContactData();
  }, []); // The empty dependency array ensures this effect runs only once on mount

  // Display a loading message while data is being fetched
  if (isLoading) {
    return (
      <footer className="bg-gray-800 text-white py-12 text-center">
        <p>Loading contact information...</p>
      </footer>
    );
  }

  // Display an error message if the fetch failed
  if (error) {
    return (
      <footer className="bg-gray-800 text-white py-12 text-center">
        <p className="text-red-400">{error}</p>
      </footer>
    );
  }

  // Render the footer with the fetched data, or a placeholder if no data was found
  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Branding and Description */}
          <div>
            <h3 className="text-2xl font-bold text-pink-400 mb-4">Havana Travel</h3>
            <p className="text-gray-300 text-sm">
              Explore the beauty of Indonesia with our curated tours, activities, and destinations. Let us make your travel dreams come true.
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-lg font-semibold text-blue-400 mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="hover:text-pink-400 transition-colors duration-200">
                  Home
                </a>
              </li>
              <li>
                <a href="/tours" className="hover:text-pink-400 transition-colors duration-200">
                  Tours
                </a>
              </li>
              <li>
                <a href="/gallery" className="hover:text-pink-400 transition-colors duration-200">
                  Gallery
                </a>
              </li>
              <li>
                <a href="/destinations" className="hover:text-pink-400 transition-colors duration-200">
                  Destinations
                </a>
              </li>
              <li>
                <a href="/activities" className="hover:text-pink-400 transition-colors duration-200">
                  Activities
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Section with Icons */}
          <div>
            <h4 className="text-lg font-semibold text-blue-400 mb-4">Contact Us</h4>
            <ul className="space-y-2 text-sm">
              {contactInfo?.email && (
                <li className="flex items-center space-x-2">
                  {getIcon('envelope')}
                  <span>Email:</span>
                  <a href={`mailto:${contactInfo.email}`} className="hover:text-pink-400 transition-colors duration-200">{contactInfo.email}</a>
                </li>
              )}
              {contactInfo?.address && (
                <li className="flex items-start space-x-2">
                  {getIcon('map-pin')}
                  <span>Address: {contactInfo.address}</span>
                </li>
              )}
            </ul>
            {contactInfo?.socialMedia && (
              <div className="flex space-x-4 mt-6">
                {contactInfo.socialMedia.instagram && (
                  <a href={contactInfo.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-pink-400 transition-colors duration-200">
                    {getIcon('instagram')}
                  </a>
                )}
                {contactInfo.socialMedia.facebook && (
                  <a href={contactInfo.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-pink-400 transition-colors duration-200">
                    {getIcon('facebook')}
                  </a>
                )}
                {contactInfo.socialMedia.twitter && (
                  <a href={contactInfo.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-pink-400 transition-colors duration-200">
                    {getIcon('twitter')}
                  </a>
                )}
                {contactInfo.socialMedia.line && (
                  <a href={contactInfo.socialMedia.line} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-pink-400 transition-colors duration-200">
                    {getIcon('line')}
                  </a>
                )}
                {contactInfo.socialMedia.wechat && (
                  <a href={contactInfo.socialMedia.wechat} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-pink-400 transition-colors duration-200">
                    {getIcon('wechat')}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-sm">
          <p>© 2025 Havana Travel. All rights reserved. Built with ❤️ by Glatia-Tech.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
